<?php

namespace Pterodactyl\Jobs\Servers;

use Pterodactyl\Models\Server;
use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Pterodactyl\Jobs\Job;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Services\Servers\ServerDeletionService;
use Illuminate\Support\Facades\Log;

class CreateServerJob extends Job implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 300; // 5 minutes

    /**
     * Create a new job instance.
     */
    public function __construct(
        private int $serverId,
        private bool $startOnCompletion = false
    ) {
        $this->onQueue('high');
    }

    /**
     * Execute the job.
     */
    public function handle(
        DaemonServerRepository $daemonServerRepository,
        ServerDeletionService $serverDeletionService
    ): void {
        $server = Server::findOrFail($this->serverId);

        // Skip if server is already created or in a different state
        if ($server->status !== Server::STATUS_INSTALLING) {
            Log::info("Server {$server->id} is not in INSTALLING state, skipping creation job");
            return; 
        }

        try {
            Log::info("Creating server {$server->id} on Wings daemon", [
                'server_id' => $server->id,
                'server_uuid' => $server->uuid,
            ]);

            $daemonServerRepository->setServer($server)->create($this->startOnCompletion);

            Log::info("Server {$server->id} creation job completed successfully", [
                'server_id' => $server->id,
            ]);
        } catch (DaemonConnectionException $exception) {
            Log::error("Failed to create server {$server->id} on Wings daemon", [
                'server_id' => $server->id,
                'error' => $exception->getMessage(),
            ]);

            // Clean up the server if creation fails
            try {
                $serverDeletionService->withForce()->handle($server);
            } catch (\Exception $cleanupException) {
                Log::error("Failed to cleanup server {$server->id} after creation failure", [
                    'server_id' => $server->id,
                    'error' => $cleanupException->getMessage(),
                ]);
            }

            // Re-throw to mark job as failed
            throw $exception;
        } catch (\Exception $exception) {
            Log::error("Unexpected error while creating server {$server->id}", [
                'server_id' => $server->id,
                'error' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString(),
            ]);

            throw $exception;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        $server = Server::find($this->serverId);

        if ($server && $server->status === Server::STATUS_INSTALLING) {
            Log::error("Server creation job failed for server {$server->id}", [
                'server_id' => $server->id,
                'error' => $exception->getMessage(),
            ]);

            // Optionally update server status to indicate failure
            // $server->update(['status' => Server::STATUS_SUSPENDED]);
        }
    }
}

