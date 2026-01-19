<?php
namespace Pterodactyl\Http\Controllers\Api\Client\Servers;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Jobs\Minecraft\InstallBedrockAddonJob;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Services\Minecraft\Addons\CurseForgeBedrockService;
class BedrockAddonController extends ClientApiController
{
    public function __construct(
        protected CurseForgeBedrockService $curseForgeBedrockService
    ) {
        parent::__construct();
        $this->curseForgeBedrockService = $curseForgeBedrockService;
    }
    /**
     * Get addons list.
     */
    public function index(Request $request, Server $server)
    {
        $query = $request->input('query');
        $page = max(1, (int) $request->input('page', 1));
        $requestedPerPage = (int) $request->input('perPage', 24);
        $allowedPageSizes = [12, 24, 48];
        $perPage = in_array($requestedPerPage, $allowedPageSizes) ? $requestedPerPage : 24;
        $addonType = $request->input('type');
        $gameVersion = $request->input('version');
        $sort = $request->input('sort', 'relevancy');
        $sortMapping = [
            'relevancy' => 'popularity',
            'popularity' => 'popularity',
            'totalDownloads' => 'totalDownloads',
            'lastUpdated' => 'lastUpdated',
        ];
        $providerSort = $sortMapping[$sort] ?? $sortMapping['relevancy'];
        $classId = $addonType;
        $result = $this->curseForgeBedrockService->searchAddons($query, $page, $perPage, $providerSort, $classId, $gameVersion);
        $result['pagination']['perPage'] = $perPage;
        return $result;
    }
    /**
     * Get filter options for addons.
     */
    public function filters(Request $request, Server $server)
    {
        $result = $this->getBedrockFilters();
        return new JsonResponse($result);
    }
    /**
     * Get Bedrock filter options.
     */
    private function getBedrockFilters(): array
    {
        $cacheKey = 'bedrock:filters';
        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () {
            $addonTypes = [
                '4984' => 'Addons',
                '6913' => 'Maps',
                '6929' => 'Texture Packs',
                '6940' => 'Scripts',
                '6925' => 'Skins',
            ];
            try {
                $versions = $this->getBedrockVersions();
            } catch (\Exception $e) {
                $versions = [];
            }
            return [
                'types' => $addonTypes,
                'versions' => $versions,
            ];
        });
    }
    /**
     * Helper method to get Minecraft Bedrock versions.
     *
     * @return array
     */
    private function getBedrockVersions(): array
    {
        try {
            $client = new \GuzzleHttp\Client([
                'base_uri' => 'https://api.curseforge.com/v1/',
                'headers' => [
                    'Accept' => 'application/json',
                    'x-api-key' => config('services.curseforge_api_key'),
                    'User-Agent' => 'Pterodactyl/BedrockAddonInstaller',
                ],
                'verify' => true,
            ]);
            $response = $client->get('games/78022/versions');
            $versionsData = json_decode($response->getBody()->getContents(), true);
            $bedrockVersions = [];
            if (isset($versionsData['data'][0]['versions'])) {
                $bedrockVersions = $versionsData['data'][0]['versions'];
            }
            usort($bedrockVersions, function ($a, $b) {
                return version_compare($b, $a);
            });
            return $bedrockVersions;
        } catch (\Exception $e) {
            throw $e;
        }
    }
    /**
     * Get addon versions.
     */
    public function versions(Request $request, Server $server)
    {
        $addonId = $request->input('addonId');
        if (!$addonId) {
            return new JsonResponse(['error' => 'addonId is required'], 400);
        }
        $result = $this->curseForgeBedrockService->getAddonFiles((int) $addonId);
        return new JsonResponse([
            'files' => $result['items'] ?? [],
        ]);
    }
    /**
     * Install a Bedrock addon in the background.
     */
    public function install(Request $request, Server $server)
    {
        if (!$request->user()->can(Permission::ACTION_FILE_CREATE, $server)) {
            throw new AuthorizationException();
        }
        $validated = $request->validate([
            'fileId' => 'required|integer',
            'addonId' => 'required|integer',
            'addonType' => 'required|string|in:addon,map,texture_pack,script,skin',
            'addonName' => 'nullable|string|max:255',
        ]);
        $this->dispatch(new InstallBedrockAddonJob(
            $server,
            $validated['addonId'],
            $validated['fileId'],
            $validated['addonType'],
            $validated['addonName'] ?? ''
        ));
        Activity::event('server:bedrock.addon.install.started')
            ->property('addon_id', $validated['addonId'])
            ->property('file_id', $validated['fileId'])
            ->property('addon_type', $validated['addonType'])
            ->log();
        return new JsonResponse(['message' => 'Addon installation has been queued.'], Response::HTTP_ACCEPTED);
    }
    /**
     * Get installed addons from server.
     * Optimized: only reads 2 config files from world directory.
     */
    public function installed(Request $request, Server $server): array
    {
        $fileRepository = app()->make(DaemonFileRepository::class);
        $installedAddons = [];
        $worlds = [];
        try {
            try {
                $fileRepository->setServer($server)->getDirectory('/');
            } catch (\Exception $e) {
                return [
                    'success' => false,
                    'addons' => [],
                    'worlds' => [],
                    'error' => 'Server daemon not accessible'
                ];
            }
            $behaviorConfig = $this->readPackConfig($fileRepository, $server, 'world_behavior_packs.json');
            $resourceConfig = $this->readPackConfig($fileRepository, $server, 'world_resource_packs.json');
            foreach ($behaviorConfig as $index => $configPack) {
                $packId = $configPack['pack_id'] ?? '';
                $version = $configPack['version'] ?? [0, 0, 0];
                $name = $configPack['name'] ?? 'Behavior Pack';
                $path = $configPack['path'] ?? 'behavior_packs';
                $hasIcon = $configPack['has_icon'] ?? false;
                if (empty($packId))
                    continue;
                if (is_array($version)) {
                    $version = implode('.', $version);
                }
                $installedAddons[] = [
                    'uuid' => $packId,
                    'name' => $name,
                    'version' => $version,
                    'type' => 'behavior',
                    'priority' => $index,
                    'enabled' => true,
                    'path' => $path,
                    'has_icon' => $hasIcon,
                ];
            }
            foreach ($resourceConfig as $index => $configPack) {
                $packId = $configPack['pack_id'] ?? '';
                $version = $configPack['version'] ?? [0, 0, 0];
                $name = $configPack['name'] ?? 'Resource Pack';
                $path = $configPack['path'] ?? 'resource_packs';
                $hasIcon = $configPack['has_icon'] ?? false;
                if (empty($packId))
                    continue;
                if (is_array($version)) {
                    $version = implode('.', $version);
                }
                $installedAddons[] = [
                    'uuid' => $packId,
                    'name' => $name,
                    'version' => $version,
                    'type' => 'resource',
                    'priority' => $index,
                    'enabled' => true,
                    'path' => $path,
                    'has_icon' => $hasIcon,
                ];
            }
            try {
                $worlds = $this->getWorlds($fileRepository, $server);
            } catch (\Exception $e) {
            }
            return [
                'success' => true,
                'addons' => $installedAddons,
                'worlds' => $worlds,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'addons' => [],
                'worlds' => [],
                'error' => 'Failed to get installed addons: ' . $e->getMessage()
            ];
        }
    }
    /**
     * Read pack config file from world directory.
     */
    protected function readPackConfig(DaemonFileRepository $fileRepository, Server $server, string $configFile): array
    {
        try {
            $worldName = $this->getWorldName($fileRepository, $server);
            $configPath = '/worlds/' . $worldName . '/' . $configFile;
            $content = $fileRepository->setServer($server)->getContent($configPath);
            $config = json_decode($content, true);
            return is_array($config) ? $config : [];
        } catch (\Exception $e) {
            return [];
        }
    }
    /**
     * Delete an addon.
     */
    public function delete(Request $request, Server $server, string $addonType, string $addonName)
    {
        if (!$request->user()->can(Permission::ACTION_FILE_DELETE, $server)) {
            throw new AuthorizationException();
        }
        try {
            $fileRepository = app()->make(DaemonFileRepository::class);
            $directory = match ($addonType) {
                'behavior' => 'behavior_packs',
                'resource' => 'resource_packs',
                'map' => 'worlds',
                'script' => 'behavior_packs',
                'skin' => 'skin_packs',
                default => throw new \InvalidArgumentException('Invalid addon type'),
            };
            $fileRepository->setServer($server)->deleteFiles('/', [$directory . '/' . $addonName]);
            $this->removePackFromConfig($fileRepository, $server, $addonName, $addonType);
            Activity::event('server:bedrock.addon.delete')
                ->property('addon_name', $addonName)
                ->property('addon_type', $addonType)
                ->log();
            return new JsonResponse(['message' => 'Addon deleted successfully']);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Failed to delete addon'], 500);
        }
    }
    /**
     * Update addon priority.
     */
    public function priority(Request $request, Server $server)
    {
        if (!$request->user()->can(Permission::ACTION_FILE_UPDATE, $server)) {
            throw new AuthorizationException();
        }
        $validated = $request->validate([
            'behavior_packs' => 'nullable|array',
            'behavior_packs.*.pack_id' => 'required|string',
            'behavior_packs.*.version' => 'required',
            'resource_packs' => 'nullable|array',
            'resource_packs.*.pack_id' => 'required|string',
            'resource_packs.*.version' => 'required',
        ]);
        try {
            $fileRepository = app()->make(DaemonFileRepository::class);
            $worldName = $this->getWorldName($fileRepository, $server);
            $worldDir = 'worlds/' . $worldName;
            if (isset($validated['behavior_packs'])) {
                $existingConfig = $this->readPackConfig($fileRepository, $server, 'world_behavior_packs.json');
                $packs = $this->formatPacksForConfigWithMeta($validated['behavior_packs'], $existingConfig);
                $configContent = json_encode($packs, JSON_PRETTY_PRINT);
                $fileRepository->setServer($server)->putContent('/' . $worldDir . '/world_behavior_packs.json', $configContent);
            }
            if (isset($validated['resource_packs'])) {
                $existingConfig = $this->readPackConfig($fileRepository, $server, 'world_resource_packs.json');
                $packs = $this->formatPacksForConfigWithMeta($validated['resource_packs'], $existingConfig);
                $configContent = json_encode($packs, JSON_PRETTY_PRINT);
                $fileRepository->setServer($server)->putContent('/' . $worldDir . '/world_resource_packs.json', $configContent);
            }
            return new JsonResponse(['message' => 'Addon priority updated successfully']);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Failed to update addon priority'], 500);
        }
    }
    /**
     * Set default world.
     */
    public function setDefaultWorld(Request $request, Server $server)
    {
        if (!$request->user()->can(Permission::ACTION_FILE_UPDATE, $server)) {
            throw new AuthorizationException();
        }
        $validated = $request->validate([
            'world_name' => 'required|string|max:255',
        ]);
        $worldName = $validated['world_name'];
        try {
            $fileRepository = app()->make(DaemonFileRepository::class);
            $content = $fileRepository->setServer($server)->getContent('/server.properties');
            $lines = explode("\n", $content);
            $updatedLines = [];
            foreach ($lines as $line) {
                if (str_starts_with($line, 'level-name=')) {
                    $updatedLines[] = 'level-name=' . $worldName;
                } else {
                    $updatedLines[] = $line;
                }
            }
            $newContent = implode("\n", $updatedLines);
            $fileRepository->setServer($server)->putContent('/server.properties', $newContent);
            Activity::event('server:bedrock.world.set_default')
                ->property('world_name', $worldName)
                ->log();
            return new JsonResponse(['message' => 'Default world set successfully']);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Failed to set default world'], 500);
        }
    }
    /**
     * Delete world.
     */
    public function deleteWorld(Request $request, Server $server, string $worldName)
    {
        if (!$request->user()->can(Permission::ACTION_FILE_DELETE, $server)) {
            throw new AuthorizationException();
        }
        try {
            $fileRepository = app()->make(DaemonFileRepository::class);
            $fileRepository->setServer($server)->deleteFiles('/', ['worlds/' . $worldName]);
            Activity::event('server:bedrock.world.delete')
                ->property('world_name', $worldName)
                ->log();
            return new JsonResponse(['message' => 'World deleted successfully']);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Failed to delete world'], 500);
        }
    }
    /**
     * Get worlds list.
     */
    private function getWorlds($fileRepository, Server $server): array
    {
        try {
            try {
                $fileRepository->setServer($server)->getDirectory('/worlds');
            } catch (\Exception $e) {
                return [];
            }
            $files = $fileRepository->setServer($server)->getDirectory('/worlds');
            $worlds = [];
            $defaultWorld = $this->getWorldName($fileRepository, $server);
            foreach ($files as $file) {
                if (isset($file['mode']) && str_starts_with($file['mode'], 'd')) {
                    $worlds[] = [
                        'name' => $file['name'],
                        'isDefault' => $file['name'] === $defaultWorld,
                    ];
                }
            }
            return $worlds;
        } catch (\Exception $e) {
            return [];
        }
    }
    /**
     * Get installed packs from config file.
     */
    private function getInstalledPacks($fileRepository, Server $server, string $configFile): array
    {
        try {
            $worldName = $this->getWorldName($fileRepository, $server);
            $configPath = 'worlds/' . $worldName . '/' . $configFile;
            $configContent = $fileRepository->getContent('/' . $configPath);
            $packs = json_decode($configContent, true) ?? [];
            return array_map(function ($pack) {
                return [
                    'uuid' => $pack['pack_id'] ?? '',
                    'name' => $pack['name'] ?? 'Unknown Pack',
                    'version' => $pack['version'] ?? [0, 0, 0],
                    'path' => $pack['path'] ?? '',
                    'has_icon' => $pack['has_icon'] ?? false,
                    'type' => str_contains($configFile, 'behavior') ? 'behavior' : 'resource',
                ];
            }, $packs);
        } catch (\Exception $e) {
            return [];
        }
    }
    /**
     * Remove pack from config file.
     */
    private function removePackFromConfig($fileRepository, Server $server, string $packName, string $addonType): void
    {
        $configFile = $addonType === 'behavior'
            ? 'world_behavior_packs.json'
            : 'world_resource_packs.json';
        $worldName = $this->getWorldName($fileRepository, $server);
        $configPath = 'worlds/' . $worldName . '/' . $configFile;
        try {
            $configContent = $fileRepository->getContent('/' . $configPath);
            $packs = json_decode($configContent, true) ?? [];
            $packs = array_filter($packs, function ($pack) use ($packName) {
                $packPath = $pack['path'] ?? '';
                $packNameFromPath = basename($packPath);
                return $packNameFromPath !== $packName;
            });
            $configContent = json_encode(array_values($packs), JSON_PRETTY_PRINT);
            $fileRepository->putContent('/' . $configPath, $configContent);
        } catch (\Exception $e) {
        }
    }
    /**
     * Get addon icon.
     */
    public function getIcon(Request $request, Server $server)
    {
        if (!$request->user()->can(Permission::ACTION_FILE_READ, $server)) {
            throw new AuthorizationException();
        }
        $path = $request->query('path');
        if (!$path) {
            return new JsonResponse(['error' => 'Path is required'], 400);
        }
        try {
            $fileRepository = app()->make(DaemonFileRepository::class);
            $iconPath = '/' . ltrim($path, '/') . '/pack_icon.png';
            try {
                $iconContent = $fileRepository->setServer($server)->getContent($iconPath);
                return response($iconContent)
                    ->header('Content-Type', 'image/png')
                    ->header('Cache-Control', 'public, max-age=3600');
            } catch (\Exception $e) {
                $iconPath = '/' . ltrim($path, '/') . '/pack_icon.jpg';
                try {
                    $iconContent = $fileRepository->setServer($server)->getContent($iconPath);
                    return response($iconContent)
                        ->header('Content-Type', 'image/jpeg')
                        ->header('Cache-Control', 'public, max-age=3600');
                } catch (\Exception $e2) {
                    return new JsonResponse(['error' => 'Icon not found'], 404);
                }
            }
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Failed to get addon icon'], 500);
        }
    }
    /**
     * Get the world name from server.properties.
     * Defaults to 'Bedrock level' if not found.
     */
    protected function getWorldName($fileRepository, Server $server): string
    {
        try {
            $content = $fileRepository->setServer($server)->getContent('/server.properties');
            if (preg_match('/^level-name=(.+)$/m', $content, $matches)) {
                $worldName = trim($matches[1]);
                if (!empty($worldName)) {
                    return $worldName;
                }
            }
        } catch (\Exception $e) {
        }
        return 'Bedrock level';
    }
    /**
     * Format packs for config with metadata from existing config.
     */
    protected function formatPacksForConfigWithMeta(array $packs, array $existingConfig): array
    {
        $existingByUuid = [];
        foreach ($existingConfig as $existing) {
            $packId = $existing['pack_id'] ?? '';
            if (!empty($packId)) {
                $existingByUuid[$packId] = $existing;
            }
        }
        $formatted = [];
        foreach ($packs as $pack) {
            $packId = $pack['pack_id'];
            $version = $pack['version'];
            if (is_string($version)) {
                $version = array_map('intval', explode('.', $version));
            }
            $entry = [
                'pack_id' => $packId,
                'version' => $version,
            ];
            if (isset($existingByUuid[$packId])) {
                $existing = $existingByUuid[$packId];
                if (isset($existing['name'])) {
                    $entry['name'] = $existing['name'];
                }
                if (isset($existing['path'])) {
                    $entry['path'] = $existing['path'];
                }
                if (isset($existing['has_icon'])) {
                    $entry['has_icon'] = $existing['has_icon'];
                }
            }
            $formatted[] = $entry;
        }
        return $formatted;
    }
}
