<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Facades\Activity;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Repositories\Eloquent\ServerRepository;
use Pterodactyl\Services\Servers\ReinstallServerService;
use Pterodactyl\Services\Servers\ServerDeletionService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\RenameServerRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\SetDockerImageRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\ReinstallServerRequest;

class SettingsController extends ClientApiController
{
    /**
     * SettingsController constructor.
     */
    public function __construct(
        private ServerRepository $repository,
        private ReinstallServerService $reinstallServerService,
        private ServerDeletionService $deletionService
    ) {
        parent::__construct();
    }

    /**
     * Renames a server.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function rename(RenameServerRequest $request, Server $server): JsonResponse
    {
        $name = $request->input('name');
        $description = $request->has('description') ? (string) $request->input('description') : $server->description;
        $this->repository->update($server->id, [
            'name' => $name,
            'description' => $description,
        ]);

        if ($server->name !== $name) {
            Activity::event('server:settings.rename')
                ->property(['old' => $server->name, 'new' => $name])
                ->log();
        }

        if ($server->description !== $description) {
            Activity::event('server:settings.description')
                ->property(['old' => $server->description, 'new' => $description])
                ->log();
        }

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Reinstalls the server on the daemon.
     *
     * @throws \Throwable
     */
    public function reinstall(ReinstallServerRequest $request, Server $server): JsonResponse
    {
        $this->reinstallServerService->handle($server);

        Activity::event('server:reinstall')->log();

        return new JsonResponse([], Response::HTTP_ACCEPTED);
    }

    /**
     * Changes the Docker image in use by the server.
     *
     * @throws \Throwable
     */
    public function dockerImage(SetDockerImageRequest $request, Server $server): JsonResponse
    {
        if (!in_array($server->image, array_values($server->egg->docker_images))) {
            throw new BadRequestHttpException('This server\'s Docker image has been manually set by an administrator and cannot be updated.');
        }

        $original = $server->image;
        $server->forceFill(['image' => $request->input('docker_image')])->saveOrFail();

        if ($original !== $server->image) {
            Activity::event('server:startup.image')
                ->property(['old' => $original, 'new' => $request->input('docker_image')])
                ->log();
        }

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Delete a server from the panel and notify Spring Boot.
     *
     * @throws \Throwable
     * @throws \Pterodactyl\Exceptions\DisplayException
     */
    public function delete(Server $server): JsonResponse
    {
        // Spring Boot uses pterodactyl_identifier (uuidShort) to identify servers
        // Try external_id first, but use uuidShort (pterodactyl_identifier) as fallback
        $externalId = request()->input('external_id') ?? $server->external_id;
        $pterodactylIdentifier = $server->uuidShort; // This matches pterodactyl_identifier in Spring Boot

        // Notify Spring Boot to delete server from their database FIRST
        // This ensures Spring Boot is notified before we delete from Pterodactyl
        // Use pterodactyl_identifier (uuidShort) as primary identifier since that's what Spring Boot uses
        $identifierToUse = $pterodactylIdentifier; // Use uuidShort as primary since Spring Boot uses pterodactyl_identifier
        
        if ($identifierToUse) {
            try {
                $springBootUrl = config('services.spring_boot.url', 'http://localhost:9000');
                
                // Try to get token from various sources
                $token = request()->bearerToken();
                if (!$token) {
                    $authHeader = request()->header('Authorization');
                    if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
                        $token = substr($authHeader, 7);
                    }
                }
                
                // If still no token, try session
                if (!$token) {
                    $token = session('spring_boot_token');
                }

                $headers = ['Content-Type' => 'application/json', 'Accept' => 'application/json'];
                
                if ($token) {
                    // Remove 'Bearer ' prefix if present
                    $token = str_replace('Bearer ', '', $token);
                    $headers['Authorization'] = "Bearer {$token}";
                }

                Log::info('Attempting to delete server from Spring Boot', [
                    'external_id' => $externalId,
                    'pterodactyl_identifier' => $pterodactylIdentifier,
                    'identifier_used' => $identifierToUse,
                    'server_uuid' => $server->uuid,
                    'server_uuid_short' => $server->uuidShort,
                    'spring_boot_url' => $springBootUrl,
                    'has_token' => !empty($token),
                ]);

                // Try with pterodactyl_identifier first (uuidShort)
                // Spring Boot might use different endpoints, try multiple variations
                $endpoints = [
                    "{$springBootUrl}/api/servers/{$identifierToUse}",
                    "{$springBootUrl}/api/servers/pterodactyl/{$identifierToUse}",
                    "{$springBootUrl}/api/servers/by-identifier/{$identifierToUse}",
                ];
                
                $response = null;
                $lastError = null;
                
                foreach ($endpoints as $endpoint) {
                    try {
                        Log::info('Trying Spring Boot endpoint', ['endpoint' => $endpoint]);
                        $response = Http::timeout(10)->withHeaders($headers)->delete($endpoint);
                        
                        if ($response->successful()) {
                            Log::info('Success with endpoint', ['endpoint' => $endpoint]);
                            break;
                        } else {
                            Log::warning('Failed with endpoint', [
                                'endpoint' => $endpoint,
                                'status' => $response->status(),
                                'response' => $response->body(),
                            ]);
                            $lastError = [
                                'endpoint' => $endpoint,
                                'status' => $response->status(),
                                'response' => $response->body(),
                            ];
                        }
                    } catch (\Exception $e) {
                        Log::warning('Exception with endpoint', [
                            'endpoint' => $endpoint,
                            'error' => $e->getMessage(),
                        ]);
                        $lastError = [
                            'endpoint' => $endpoint,
                            'error' => $e->getMessage(),
                        ];
                    }
                }
                
                // If all endpoints failed and we have external_id, try with that too
                if ((!$response || !$response->successful()) && $externalId && $externalId !== $identifierToUse) {
                    Log::info('Retrying with external_id', ['external_id' => $externalId]);
                    $response = Http::timeout(10)->withHeaders($headers)->delete("{$springBootUrl}/api/servers/{$externalId}");
                }

                if ($response->successful()) {
                    Log::info('Server deleted from Spring Boot successfully', [
                        'identifier_used' => $identifierToUse,
                        'external_id' => $externalId,
                        'pterodactyl_identifier' => $pterodactylIdentifier,
                        'server_uuid' => $server->uuid,
                        'response' => $response->json(),
                    ]);
                } else {
                    Log::error('Failed to delete server from Spring Boot', [
                        'identifier_used' => $identifierToUse,
                        'external_id' => $externalId,
                        'pterodactyl_identifier' => $pterodactylIdentifier,
                        'server_uuid' => $server->uuid,
                        'status' => $response->status(),
                        'response' => $response->body(),
                    ]);
                    // Continue with deletion from Pterodactyl even if Spring Boot fails
                    // This prevents orphaned servers in Pterodactyl
                }
            } catch (\Exception $e) {
                // Log error but continue with deletion from Pterodactyl
                Log::error('Error notifying Spring Boot about server deletion', [
                    'external_id' => $externalId,
                    'pterodactyl_identifier' => $pterodactylIdentifier,
                    'server_uuid' => $server->uuid,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        } else {
            Log::warning('No identifier found for server, skipping Spring Boot deletion', [
                'server_uuid' => $server->uuid,
                'server_uuid_short' => $server->uuidShort,
                'server_id' => $server->id,
                'external_id' => $externalId,
            ]);
        }

        // Delete server from Pterodactyl panel
        $this->deletionService->handle($server);

        Activity::event('server:settings.delete')->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }
}
