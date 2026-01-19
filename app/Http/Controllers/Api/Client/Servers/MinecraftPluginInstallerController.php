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
use Pterodactyl\Services\Minecraft\Plugins\HangarPluginService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Services\Minecraft\Plugins\ModrinthPluginService;
use Pterodactyl\Services\Minecraft\Plugins\SpigotMCPluginService;
use Pterodactyl\Services\Minecraft\Plugins\CurseForgePluginService;
use Pterodactyl\Services\Minecraft\Plugins\MinecraftPluginProvider;

class MinecraftPluginInstallerController extends ClientApiController
{
    /**
     * MinecraftPluginInstallerController constructor.
     */
    public function __construct(private DaemonFileRepository $daemonFileRepository)
    {
        parent::__construct();
    }

    /**
     * Returns searched Minecraft plugins.
     */
    public function index(Request $request, Server $server): array
    {
        if (!$request->user()->can(Permission::ACTION_FILE_READ, $server)) {
            throw new AuthorizationException();
        }
        $validated = $request->validate([
            'provider' => ['required', Rule::enum(MinecraftPluginProvider::class)],
            'page' => 'required|numeric|integer|min:1',
            'page_size' => 'required|numeric|integer|max:50', 
            'search_query' => 'nullable|string',
            'minecraft_version' => 'nullable|string',
            'plugin_loader' => 'nullable|string',
            'sort' => 'nullable|string',
        ]);

        $provider = MinecraftPluginProvider::from($validated['provider']);
        $page = (int) $validated['page'];
        $pageSize = (int) $validated['page_size'];
        $searchQuery = $validated['search_query'] ?? '';
        $minecraftVersion = $validated['minecraft_version'] ?? '';
        $pluginLoader = $validated['plugin_loader'] ?? '';
        $sort = $validated['sort'] ?? 'relevance';

        $service = $this->getPluginService($provider);
        if ($provider === MinecraftPluginProvider::Hangar) {
            $pageSize = min($pageSize, $service::MAX_PAGE_SIZE);
        }

        $data = $service->search(compact('searchQuery', 'pageSize', 'page', 'minecraftVersion', 'pluginLoader', 'sort'));

        $plugins = $data['data'];

        return [
            'object' => 'list',
            'data' => $plugins,
            'meta' => [
                'pagination' => [
                    'total' => $data['total'],
                    'count' => count($plugins),
                    'per_page' => $pageSize,
                    'current_page' => $page,
                    'total_pages' => ceil($data['total'] / $pageSize),
                    'links' => [],
                ],
            ],
        ];
    }

    /**
     * Returns a plugin's installable versions.
     */
    public function versions(Request $request, Server $server, string $pluginId): array
    {
        if (!$request->user()->can(Permission::ACTION_FILE_READ, $server)) {
            throw new AuthorizationException();
        }
        $validated = $request->validate([
            'provider' => ['required', Rule::enum(MinecraftPluginProvider::class)],
            'plugin_loader' => 'nullable|string',
            'minecraft_version' => 'nullable|string',
        ]);

        $provider = MinecraftPluginProvider::from($validated['provider']);
        $pluginLoader = $validated['plugin_loader'] ?? null;
        $minecraftVersion = $validated['minecraft_version'] ?? null;

        $service = $this->getPluginService($provider);

        
        $pluginDetails = $service->getPluginDetails($pluginId);
        $versions = $service->versions($pluginId, $pluginLoader, $minecraftVersion);

        return [
            'project' => $pluginDetails,
            'versions' => $versions,
        ];
    }

    protected function getPluginService(MinecraftPluginProvider $provider)
    {
        $class = match ($provider) {
            MinecraftPluginProvider::CurseForge => CurseForgePluginService::class,
            MinecraftPluginProvider::Hangar => HangarPluginService::class,
            MinecraftPluginProvider::Modrinth => ModrinthPluginService::class,
            MinecraftPluginProvider::SpigotMC => SpigotMCPluginService::class,
        };

        return app($class);
    }

    /**
     * Install a plugin.
     */
    public function install(Request $request, Server $server)
    {
        if (!$request->user()->can(Permission::ACTION_FILE_CREATE, $server)) {
            throw new AuthorizationException();
        }

        $validated = $request->validate([
            'provider' => ['required', Rule::enum(MinecraftPluginProvider::class)],
            'plugin_id' => 'required|string',
            'version' => 'required|string',
        ]);
        
        $provider = MinecraftPluginProvider::from($validated['provider']);
        $pluginId = $validated['plugin_id'];
        $versionId = $validated['version'];

        $service = $this->getPluginService($provider);
        $downloadDetails = $service->getDownloadDetails($pluginId, $versionId);

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
            
            
            logger()->info('Attempting to download plugin', [
                'provider' => $provider->value,
                'plugin_id' => $pluginId,
                'version_id' => $versionId,
                'download_url' => $downloadDetails['downloadUrl'],
                'file_name' => $downloadDetails['fileName'] ?? null,
            ]);
            
            $this->daemonFileRepository->setServer($server)->pull(
                $downloadDetails['downloadUrl'],
                '/plugins',
                $pullOptions
            );
        } catch (\Exception $e) {
            
            logger()->error('Failed to download plugin', [
                'provider' => $provider->value,
                'plugin_id' => $pluginId,
                'version_id' => $versionId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            throw new DisplayException('You need to download this plugin manually at ' . $downloadDetails['downloadUrl']);
        }

        return response()->noContent();
    }

    /**
     * Returns normalized mod versions from `plugins/` hashes.
     *
     * @return array{identified: array<array{id: string, project_id: string, name: string, provider: string}>, other: array<string>}
     */
    public function getInstalledPluginsVersions(Server $server, MinecraftSoftwareService $minecraftSoftwareService): array
    {
        return $minecraftSoftwareService->setServer($server)->getInstalledProjectsVersions('plugins');
    }

    /**
     * Get Minecraft versions for filtering.
     */
    public function getMinecraftVersions(Request $request, Server $server): array
    {
        $validated = $request->validate([
            'provider' => ['required', Rule::enum(MinecraftPluginProvider::class)],
        ]);

        $provider = MinecraftPluginProvider::from($validated['provider']);
        $service = $this->getPluginService($provider);

        return $service->getMinecraftVersions();
    }

    /**
     * Get plugin loaders for filtering.
     */
    public function getPluginLoaders(Request $request, Server $server): array
    {
        $validated = $request->validate([
            'provider' => ['required', Rule::enum(MinecraftPluginProvider::class)],
        ]);

        $provider = MinecraftPluginProvider::from($validated['provider']);
        $service = $this->getPluginService($provider);

        return $service->getPluginLoaders();
    }
}
