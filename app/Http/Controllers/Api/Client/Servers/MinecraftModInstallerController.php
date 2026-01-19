<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Illuminate\Validation\Rule;
use Pterodactyl\Models\Permission;
use Pterodactyl\Exceptions\DisplayException;
use Illuminate\Auth\Access\AuthorizationException;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Services\Minecraft\MinecraftSoftwareService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Services\Minecraft\Mods\ModrinthModService;
use Pterodactyl\Services\Minecraft\Mods\CurseForgeModService;
use Pterodactyl\Services\Minecraft\Mods\MinecraftModProvider;

class MinecraftModInstallerController extends ClientApiController
{
    /**
     * MinecraftModInstallerController constructor.
     */
    public function __construct(private DaemonFileRepository $daemonFileRepository)
    {
        parent::__construct();
    }

    /**
     * Returns searched Minecraft mods.
     */
    public function index(Request $request, Server $server): array
    {
        if (!$request->user()->can(Permission::ACTION_FILE_READ, $server)) {
            throw new AuthorizationException();
        }
        $validated = $request->validate([
            'provider' => ['required', Rule::enum(MinecraftModProvider::class)],
            'page' => 'required|numeric|integer|min:1',
            'page_size' => 'required|numeric|integer|max:50', 
            'search_query' => 'nullable|string',
            'minecraft_version' => 'nullable|string',
            'mod_loader' => 'nullable|string',
            'sort' => 'nullable|string',
        ]);

        $provider = MinecraftModProvider::from($validated['provider']);
        $page = (int) $validated['page'];
        $pageSize = (int) $validated['page_size'];
        $searchQuery = $validated['search_query'] ?? '';
        $minecraftVersion = $validated['minecraft_version'] ?? '';
        $modLoader = $validated['mod_loader'] ?? '';
        $sort = $validated['sort'] ?? 'relevance';

        $service = $this->getModService($provider);

        $data = $service->search(compact('searchQuery', 'pageSize', 'page', 'minecraftVersion', 'modLoader', 'sort'));

        $mods = $data['data'];

        return [
            'object' => 'list',
            'data' => $mods,
            'meta' => [
                'pagination' => [
                    'total' => $data['total'],
                    'count' => count($mods),
                    'per_page' => $pageSize,
                    'current_page' => $page,
                    'total_pages' => ceil($data['total'] / $pageSize),
                    'links' => [],
                ],
            ],
        ];
    }

    /**
     * Returns a mod's installable versions.
     */
    public function versions(Request $request, Server $server, string $modId): array
    {
        if (!$request->user()->can(Permission::ACTION_FILE_READ, $server)) {
            throw new AuthorizationException();
        }
        $validated = $request->validate([
            'provider' => ['required', Rule::enum(MinecraftModProvider::class)],
            'mod_loader' => 'nullable|string',
            'minecraft_version' => 'nullable|string',
        ]);

        $provider = MinecraftModProvider::from($validated['provider']);
        $modLoader = $validated['mod_loader'] ?? null;
        $minecraftVersion = $validated['minecraft_version'] ?? null;

        $service = $this->getModService($provider);

        
        $modDetails = $service->getModDetails($modId);
        $versions = $service->versions($modId, $modLoader, $minecraftVersion);

        return [
            'project' => $modDetails,
            'versions' => $versions,
        ];
    }

    protected function getModService(MinecraftModProvider $provider)
    {
        $class = match ($provider) {
            MinecraftModProvider::CurseForge => CurseForgeModService::class,
            MinecraftModProvider::Modrinth => ModrinthModService::class,
        };

        return app($class);
    }

    /**
     * Install a mod.
     */
    public function install(Request $request, Server $server)
    {
        if (!$request->user()->can(Permission::ACTION_FILE_CREATE, $server)) {
            throw new AuthorizationException();
        }

        $validated = $request->validate([
            'provider' => ['required', Rule::enum(MinecraftModProvider::class)],
            'mod_id' => 'required|string',
            'version' => 'required|string',
        ]);
        
        $provider = MinecraftModProvider::from($validated['provider']);
        $modId = $validated['mod_id'];
        $versionId = $validated['version'];

        $service = $this->getModService($provider);
        $downloadDetails = $service->getDownloadDetails($modId, $versionId);

        try {
            
            $pullOptions = [
                'foreground' => true,
                'filename' => $downloadDetails['fileName'] ?? null,
            ];
            
            
            if (isset($downloadDetails['use_header'])) {
                $pullOptions['use_header'] = $downloadDetails['use_header'];
            } else {
                $pullOptions['use_header'] = true; 
            }
            
            
            foreach ($downloadDetails as $key => $value) {
                if (!in_array($key, ['downloadUrl', 'fileName', 'use_header'])) {
                    $pullOptions[$key] = $value;
                }
            }
            
            
            logger()->info('Attempting to download mod', [
                'provider' => $provider->value,
                'mod_id' => $modId,
                'version_id' => $versionId,
                'download_url' => $downloadDetails['downloadUrl'],
                'file_name' => $downloadDetails['fileName'] ?? null,
            ]);
            
            $this->daemonFileRepository->setServer($server)->pull(
                $downloadDetails['downloadUrl'],
                '/mods',
                $pullOptions
            );
        } catch (\Exception $e) {
            
            logger()->error('Failed to download mod', [
                'provider' => $provider->value,
                'mod_id' => $modId,
                'version_id' => $versionId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            throw new DisplayException('You need to download this mod manually at ' . $downloadDetails['downloadUrl']);
        }

        return response()->noContent();
    }

    /**
     * Returns normalized mod versions from `mods/` hashes.
     *
     * @return array{identified: array<array{id: string, project_id: string, name: string, provider: string}>, other: array<string>}
     */
    public function getInstalledModsVersions(Server $server, MinecraftSoftwareService $minecraftSoftwareService): array
    {
        return $minecraftSoftwareService->setServer($server)->getInstalledProjectsVersions('mods');
    }

    /**
     * Get Minecraft versions for filtering.
     */
    public function getMinecraftVersions(Request $request, Server $server): array
    {
        $validated = $request->validate([
            'provider' => ['required', Rule::enum(MinecraftModProvider::class)],
        ]);

        $provider = MinecraftModProvider::from($validated['provider']);
        $service = $this->getModService($provider);

        return $service->getMinecraftVersions();
    }

    /**
     * Get mod loaders for filtering.
     */
    public function getModLoaders(Request $request, Server $server): array
    {
        $validated = $request->validate([
            'provider' => ['required', Rule::enum(MinecraftModProvider::class)],
        ]);

        $provider = MinecraftModProvider::from($validated['provider']);
        $service = $this->getModService($provider);

        return $service->getModLoaders();
    }
}
