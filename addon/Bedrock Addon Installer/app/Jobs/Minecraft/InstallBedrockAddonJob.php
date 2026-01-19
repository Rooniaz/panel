<?php
namespace Pterodactyl\Jobs\Minecraft;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Exceptions\Repository\Daemon\FileNotFoundException;
use Pterodactyl\Exceptions\PterodactylException;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Services\Minecraft\Addons\CurseForgeBedrockService;
use Exception;
class InstallBedrockAddonJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public Server $server;
    public string $addonId;
    public string $versionId;
    public string $addonType;
    public string $addonName;
    public int $tries = 1;
    public int $timeout = 600;
    public string $jobIdentifier;
    public function __construct(Server $server, string $addonId, string $versionId, string $addonType, string $addonName = '')
    {
        $this->server = $server;
        $this->addonId = $addonId;
        $this->versionId = $versionId;
        $this->addonType = $addonType;
        $this->addonName = $addonName;
        $this->jobIdentifier = 'addon_' . uniqid();
    }
    public function getJobIdentifier(): string
    {
        return $this->jobIdentifier;
    }
    /**
     * Follow redirects to get the final URL
     */
    private function returnFinalRedirect(string $url, int $max = 5, int $used = 0, string|null $prev = null): string
    {
        if ($used >= $max) {
            return $url;
        }
        if (str_starts_with($url, '/')) {
            $host = parse_url($prev, PHP_URL_HOST);
            if (!$host) {
                throw new \Exception('Failed to determine host.');
            }
            $url = sprintf('%s://%s%s', parse_url($prev, PHP_URL_SCHEME), $host, $url);
        }
        $response = get_headers($url, true);
        if (!$response) {
            throw new \Exception('Failed to query URL.');
        }
        $response = array_change_key_case($response, CASE_LOWER);
        if (array_key_exists('location', $response)) {
            try {
                if (is_array($response['location'])) {
                    return $this->returnFinalRedirect($response['location'][count($response['location']) - 1], $max, $used + 1, $url);
                } else {
                    return $this->returnFinalRedirect($response['location'], $max, $used + 1, $url);
                }
            } catch (\Throwable $e) {
                return $url;
            }
        }
        return $url;
    }
    /**
     * Execute the job.
     */
    public function handle(
        CurseForgeBedrockService $curseForgeService,
        DaemonFileRepository $repository
    ): void {
        $filename = 'unknown';
        try {
            $repository->setServer($this->server);
            $downloadParams = $curseForgeService->getDownloadUrl($this->addonId, $this->versionId);
            $filename = $downloadParams['filename'];
            Cache::put("addon_install:{$this->jobIdentifier}", [
                'job_id' => $this->jobIdentifier,
                'filename' => $filename,
                'server_id' => $this->server->id,
                'addon_type' => $this->addonType,
                'status' => 'downloading'
            ], 3600);
            $realUrl = $this->returnFinalRedirect($downloadParams['url']);
            $repository->pull(
                $realUrl,
                '/',
                [
                    'filename' => $filename,
                    'use_header' => false,
                    'foreground' => true
                ]
            );
            sleep(2);
            $files = $repository->setServer($this->server)->getDirectory('/');
            $addonFile = collect($files)->firstWhere('name', $filename);
            if (!$addonFile || $addonFile['size'] <= 0) {
                throw new \Exception('Downloaded file not found or empty');
            }
            Cache::put("addon_install:{$this->jobIdentifier}", [
                'job_id' => $this->jobIdentifier,
                'filename' => $filename,
                'server_id' => $this->server->id,
                'addon_type' => $this->addonType,
                'status' => 'extracting'
            ], 3600);
            $this->installByType($repository, $filename);
            Cache::put("addon_install:{$this->jobIdentifier}", [
                'job_id' => $this->jobIdentifier,
                'filename' => $filename,
                'server_id' => $this->server->id,
                'addon_type' => $this->addonType,
                'status' => 'completed'
            ], 3600);
        } catch (\Exception $e) {
            Cache::put("addon_install:{$this->jobIdentifier}", [
                'job_id' => $this->jobIdentifier,
                'filename' => $filename,
                'server_id' => $this->server->id,
                'addon_type' => $this->addonType,
                'status' => 'failed',
                'error' => $e->getMessage()
            ], 3600);
        }
    }
    /**
     * Install content based on addon type.
     */
    protected function installByType(DaemonFileRepository $repository, string $filename): void
    {
        $packName = $this->sanitizeName($this->addonName ?: pathinfo($filename, PATHINFO_FILENAME));
        $this->deleteExistingAddon($repository, $packName);
        switch ($this->addonType) {
            case 'map':
                $this->installMap($repository, $filename);
                break;
            case 'texture_pack':
                $this->installTexturePack($repository, $filename);
                break;
            case 'script':
                $this->installScript($repository, $filename);
                break;
            case 'skin':
                $this->installSkinPack($repository, $filename);
                break;
            case 'addon':
            default:
                $this->installAddon($repository, $filename);
                break;
        }
    }
    /**
     * Delete existing addon if it exists.
     */
    protected function deleteExistingAddon(DaemonFileRepository $repository, string $packName): void
    {
        $directories = [
            'behavior_packs',
            'resource_packs',
            'worlds',
            'skin_packs',
        ];
        $namesToCheck = [
            $packName,
            $packName . '_BP',
            $packName . '_RP',
        ];
        foreach ($directories as $dir) {
            try {
                $files = $repository->setServer($this->server)->getDirectory('/' . $dir);
                foreach ($files as $file) {
                    $isDirectory = isset($file['mode']) && str_starts_with($file['mode'], 'd');
                    if ($isDirectory && in_array($file['name'], $namesToCheck)) {
                        try {
                            $repository->setServer($this->server)->deleteFiles('/' . $dir, [$file['name']]);
                        } catch (\Exception $e) {
                        }
                    }
                }
            } catch (\Exception $e) {
            }
        }
    }
    /**
     * Install addon (behavior/resource pack combo or single pack).
     * Detects actual content type from manifest and installs accordingly.
     */
    protected function installAddon(DaemonFileRepository $repository, string $filename): void
    {
        $this->ensureDirectoryExists($repository, 'behavior_packs');
        $this->ensureDirectoryExists($repository, 'resource_packs');
        $tempDir = 'temp_addon_' . time();
        $this->ensureDirectoryExists($repository, $tempDir);
        $repository->setServer($this->server)->renameFiles('/', [
            ['from' => $filename, 'to' => $tempDir . '/' . $filename]
        ]);
        $repository->setServer($this->server)->decompressFile('/' . $tempDir, $filename);
        try {
            $repository->setServer($this->server)->deleteFiles('/' . $tempDir, [$filename]);
        } catch (\Exception $e) {
        }
        sleep(2);
        $this->processExtractedAddonPacks($repository, $tempDir);
        try {
            $repository->setServer($this->server)->deleteFiles('/', [$tempDir]);
        } catch (\Exception $e) {
        }
    }
    /**
     * Process extracted addon packs and move to appropriate directories.
     * Handles both single packs and multi-pack addons.
     */
    protected function processExtractedAddonPacks(DaemonFileRepository $repository, string $tempDir): void
    {
        try {
            $files = $repository->setServer($this->server)->getDirectory('/' . $tempDir);
            $hasRootManifest = false;
            $directories = [];
            $mcpackFiles = [];
            foreach ($files as $file) {
                if ($file['name'] === 'manifest.json') {
                    $hasRootManifest = true;
                }
                $isDirectory = isset($file['mode']) && (str_starts_with($file['mode'], 'd') || $file['mode'] === 'd');
                if ($isDirectory) {
                    $directories[] = $file['name'];
                }
                if (preg_match('/\.(mcpack|zip)$/i', $file['name'])) {
                    $mcpackFiles[] = $file['name'];
                }
            }
            if (!empty($mcpackFiles)) {
                foreach ($mcpackFiles as $mcpack) {
                    try {
                        $repository->setServer($this->server)->decompressFile('/' . $tempDir, $mcpack);
                        $repository->setServer($this->server)->deleteFiles('/' . $tempDir, [$mcpack]);
                    } catch (\Exception $e) {
                    }
                }
                sleep(2);
                $files = $repository->setServer($this->server)->getDirectory('/' . $tempDir);
                $directories = [];
                $hasRootManifest = false;
                foreach ($files as $file) {
                    if ($file['name'] === 'manifest.json') {
                        $hasRootManifest = true;
                    }
                    $isDirectory = isset($file['mode']) && (str_starts_with($file['mode'], 'd') || $file['mode'] === 'd');
                    if ($isDirectory) {
                        $directories[] = $file['name'];
                    }
                }
            }
            if ($hasRootManifest) {
                $packType = $this->determinePackType($repository, $tempDir);
                $targetBaseDir = $packType === 'data' ? 'behavior_packs' : 'resource_packs';
                $packName = $this->sanitizeName($this->addonName ?: 'pack_' . time());
                $targetDir = $targetBaseDir . '/' . $packName;
                $this->ensureDirectoryExists($repository, $targetBaseDir);
                try {
                    $repository->setServer($this->server)->renameFiles('/', [
                        ['from' => $tempDir, 'to' => $targetDir]
                    ]);
                } catch (\Exception $e) {
                    return;
                }
                sleep(1);
                $this->addPackToConfig($repository, $targetDir, $packType === 'data' ? 'world_behavior_packs.json' : 'world_resource_packs.json');
                return;
            }
            if (count($directories) === 1) {
                $subDir = $directories[0];
                $subDirPath = $tempDir . '/' . $subDir;
                $packType = $this->determinePackType($repository, $subDirPath);
                $targetBaseDir = $packType === 'data' ? 'behavior_packs' : 'resource_packs';
                $packName = $this->sanitizeName($this->addonName ?: $subDir);
                $targetDir = $targetBaseDir . '/' . $packName;
                $this->ensureDirectoryExists($repository, $targetBaseDir);
                try {
                    $repository->setServer($this->server)->renameFiles('/', [
                        ['from' => $subDirPath, 'to' => $targetDir]
                    ]);
                    sleep(2);
                    $this->addPackToConfig($repository, $targetDir, $packType === 'data' ? 'world_behavior_packs.json' : 'world_resource_packs.json');
                } catch (\Exception $e) {
                }
                return;
            }
            $this->ensureDirectoryExists($repository, 'behavior_packs');
            $this->ensureDirectoryExists($repository, 'resource_packs');
            $packBaseName = $this->sanitizeName($this->addonName ?: 'addon_' . time());
            $installedPacks = [];
            foreach ($directories as $name) {
                $packPath = $tempDir . '/' . $name;
                $packType = $this->determinePackType($repository, $packPath);
                $targetBaseDir = $packType === 'data' ? 'behavior_packs' : 'resource_packs';
                $targetPackName = $packBaseName . '_' . ($packType === 'data' ? 'BP' : 'RP');
                $targetDir = $targetBaseDir . '/' . $targetPackName;
                try {
                    $this->ensureDirectoryExists($repository, $targetBaseDir);
                    $repository->setServer($this->server)->renameFiles('/', [
                        ['from' => $tempDir . '/' . $name, 'to' => $targetDir]
                    ]);
                    $installedPacks[] = ['dir' => $targetDir, 'type' => $packType];
                } catch (\Exception $e) {
                }
            }
            sleep(3);
            foreach ($installedPacks as $pack) {
                $configFile = $pack['type'] === 'data' ? 'world_behavior_packs.json' : 'world_resource_packs.json';
                $this->addPackToConfig($repository, $pack['dir'], $configFile);
                sleep(1);
            }
        } catch (\Exception $e) {
        }
    }
    /**
     * Install a map/world.
     */
    protected function installMap(DaemonFileRepository $repository, string $filename): void
    {
        $this->ensureDirectoryExists($repository, 'worlds');
        $worldName = $this->sanitizeName($this->addonName ?: pathinfo($filename, PATHINFO_FILENAME));
        $worldDir = 'worlds/' . $worldName;
        $this->ensureDirectoryExists($repository, $worldDir);
        $repository->setServer($this->server)->renameFiles('/', [
            ['from' => $filename, 'to' => $worldDir . '/' . $filename]
        ]);
        $repository->setServer($this->server)->decompressFile('/' . $worldDir, $filename);
        try {
            $repository->setServer($this->server)->deleteFiles('/' . $worldDir, [$filename]);
        } catch (\Exception $e) {
        }
    }
    /**
     * Install a texture/resource pack.
     */
    protected function installTexturePack(DaemonFileRepository $repository, string $filename): void
    {
        $this->ensureDirectoryExists($repository, 'resource_packs');
        $packName = $this->sanitizeName($this->addonName ?: pathinfo($filename, PATHINFO_FILENAME));
        $packDir = 'resource_packs/' . $packName;
        $this->ensureDirectoryExists($repository, $packDir);
        $repository->setServer($this->server)->renameFiles('/', [
            ['from' => $filename, 'to' => $packDir . '/' . $filename]
        ]);
        $repository->setServer($this->server)->decompressFile('/' . $packDir, $filename);
        try {
            $repository->setServer($this->server)->deleteFiles('/' . $packDir, [$filename]);
        } catch (\Exception $e) {
        }
        sleep(2);
        $this->flattenNestedDirectory($repository, $packDir);
        sleep(1);
        $this->addPackToConfig($repository, $packDir, 'world_resource_packs.json');
    }
    /**
     * Install a script/behavior pack.
     * Handles both single packs and multi-pack (behavior + resource) scripts.
     */
    protected function installScript(DaemonFileRepository $repository, string $filename): void
    {
        $this->ensureDirectoryExists($repository, 'behavior_packs');
        $this->ensureDirectoryExists($repository, 'resource_packs');
        $tempDir = 'temp_script_' . time();
        $this->ensureDirectoryExists($repository, $tempDir);
        $repository->setServer($this->server)->renameFiles('/', [
            ['from' => $filename, 'to' => $tempDir . '/' . $filename]
        ]);
        $repository->setServer($this->server)->decompressFile('/' . $tempDir, $filename);
        try {
            $repository->setServer($this->server)->deleteFiles('/' . $tempDir, [$filename]);
        } catch (\Exception $e) {
        }
        sleep(2);
        $this->processExtractedAddonPacks($repository, $tempDir);
        try {
            $repository->setServer($this->server)->deleteFiles('/', [$tempDir]);
        } catch (\Exception $e) {
        }
    }
    /**
     * Install a skin pack.
     */
    protected function installSkinPack(DaemonFileRepository $repository, string $filename): void
    {
        $this->ensureDirectoryExists($repository, 'skin_packs');
        $packName = $this->sanitizeName($this->addonName ?: pathinfo($filename, PATHINFO_FILENAME));
        $packDir = 'skin_packs/' . $packName;
        $this->ensureDirectoryExists($repository, $packDir);
        $repository->setServer($this->server)->renameFiles('/', [
            ['from' => $filename, 'to' => $packDir . '/' . $filename]
        ]);
        $repository->setServer($this->server)->decompressFile('/' . $packDir, $filename);
        try {
            $repository->setServer($this->server)->deleteFiles('/' . $packDir, [$filename]);
        } catch (\Exception $e) {
        }
    }
    /**
     * Determine pack type from manifest.json.
     * Also searches in subdirectories if manifest not found at root.
     * Falls back to folder structure detection if manifest is unreadable.
     */
    protected function determinePackType(DaemonFileRepository $repository, string $packPath): string
    {
        $type = $this->readManifestType($repository, $packPath);
        if ($type !== null) {
            return $type;
        }
        $hasBehaviorIndicators = false;
        $hasResourceIndicators = false;
        try {
            $files = $repository->setServer($this->server)->getDirectory('/' . $packPath);
            foreach ($files as $file) {
                $name = strtolower($file['name']);
                $isDirectory = isset($file['mode']) && str_starts_with($file['mode'], 'd');
                if (in_array($name, ['scripts', 'functions', 'entities', 'items', 'blocks', 'recipes', 'loot_tables', 'trading'])) {
                    $hasBehaviorIndicators = true;
                }
                if (in_array($name, ['textures', 'models', 'sounds', 'ui', 'font', 'particles', 'render_controllers'])) {
                    $hasResourceIndicators = true;
                }
                if ($isDirectory) {
                    $type = $this->readManifestType($repository, $packPath . '/' . $file['name']);
                    if ($type !== null) {
                        return $type;
                    }
                }
            }
        } catch (\Exception $e) {
        }
        if ($hasBehaviorIndicators && !$hasResourceIndicators) {
            return 'data';
        }
        return 'resources';
    }
    /**
     * Read manifest type from a specific path.
     */
    protected function readManifestType(DaemonFileRepository $repository, string $packPath): ?string
    {
        try {
            $manifestContent = $repository->setServer($this->server)->getContent('/' . $packPath . '/manifest.json');
            $manifestContent = $this->stripJsonComments($manifestContent);
            $manifest = json_decode($manifestContent, true);
            if (!$manifest) {
                return null;
            }
            $modules = $manifest['modules'] ?? [];
            foreach ($modules as $module) {
                $type = $module['type'] ?? '';
                if (in_array($type, ['data', 'script', 'client_data'])) {
                    return 'data';
                }
            }
            return 'resources';
        } catch (\Exception $e) {
            return null;
        }
    }
    /**
     * Strip comments and control characters from JSON content.
     * Handles both single-line and multi-line comments.
     */
    protected function stripJsonComments(string $content): string
    {
        $bom = pack('H*', 'EFBBBF');
        $content = preg_replace("/^$bom/", '', $content);
        $bom16le = pack('H*', 'FFFE');
        $content = preg_replace("/^$bom16le/", '', $content);
        $bom16be = pack('H*', 'FEFF');
        $content = preg_replace("/^$bom16be/", '', $content);
        $content = preg_replace('#/\*.*?\*/#s', '', $content);
        $content = preg_replace('#^\s*//.*$#m', '', $content);
        $content = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $content);
        if (!mb_check_encoding($content, 'UTF-8')) {
            $content = mb_convert_encoding($content, 'UTF-8', 'auto');
        }
        return trim($content);
    }
    /**
     * Get the world name from server.properties.
     * Defaults to 'Bedrock level' if not found.
     */
    protected function getWorldName(DaemonFileRepository $repository): string
    {
        try {
            $content = $repository->setServer($this->server)->getContent('/server.properties');
            $lines = explode("\n", $content);
            foreach ($lines as $line) {
                $line = trim($line);
                if (str_starts_with($line, 'level-name=')) {
                    $worldName = trim(substr($line, strlen('level-name=')));
                    if (!empty($worldName)) {
                        return $worldName;
                    }
                }
            }
        } catch (\Exception $e) {
        }
        return 'default';
    }
    /**
     * Sanitize name for use as directory name.
     */
    protected function sanitizeName(string $name): string
    {
        $name = preg_replace('/[<>:"\/\|?*&!@#$%^()+=\[\]{};\',`~]/', '', $name);
        $name = preg_replace('/\s+/', '_', $name);
        $name = preg_replace('/_+/', '_', $name);
        $name = trim($name, '_');
        $name = substr($name, 0, 100);
        return $name ?: 'addon_' . time();
    }
    /**
     * Flatten nested directory structure.
     * If pack was extracted as packDir/subFolder/manifest.json, move contents up.
     */
    protected function flattenNestedDirectory(DaemonFileRepository $repository, string $packDir): void
    {
        try {
            $files = $repository->setServer($this->server)->getDirectory('/' . $packDir);
            $directories = [];
            $hasManifest = false;
            foreach ($files as $file) {
                if ($file['name'] === 'manifest.json') {
                    $hasManifest = true;
                    break;
                }
                if ($file['mode'] === 'd') {
                    $directories[] = $file['name'];
                }
            }
            if (!$hasManifest && count($directories) === 1) {
                $subDir = $directories[0];
                $subDirPath = $packDir . '/' . $subDir;
                $subFiles = $repository->setServer($this->server)->getDirectory('/' . $subDirPath);
                foreach ($subFiles as $file) {
                    try {
                        $repository->setServer($this->server)->renameFiles('/' . $subDirPath, [
                            ['from' => $file['name'], 'to' => '/' . $packDir . '/' . $file['name']]
                        ]);
                    } catch (\Exception $e) {
                    }
                }
                try {
                    $repository->setServer($this->server)->deleteFiles('/' . $packDir, [$subDir]);
                } catch (\Exception $e) {
                }
            }
        } catch (\Exception $e) {
        }
    }
    /**
     * Ensure a directory exists on the server.
     */
    protected function ensureDirectoryExists(DaemonFileRepository $repository, string $directory): void
    {
        try {
            $repository->setServer($this->server)->getDirectory('/' . $directory);
        } catch (\Exception $e) {
            try {
                $repository->setServer($this->server)->createDirectory('/', $directory);
            } catch (\Exception $e) {
            }
        }
    }
    /**
     * Check if pack has an icon file.
     */
    protected function checkPackIcon(DaemonFileRepository $repository, string $packPath): bool
    {
        try {
            $files = $repository->setServer($this->server)->getDirectory('/' . $packPath);
            foreach ($files as $file) {
                if ($file['name'] === 'pack_icon.png') {
                    return true;
                }
            }
        } catch (\Exception $e) {
        }
        return false;
    }
    /**
     * Add a single pack to config file.
     */
    protected function addPackToConfig(DaemonFileRepository $repository, string $packDir, string $configFile): void
    {
        try {
            $packInfo = $this->readPackManifest($repository, $packDir);
            if (!$packInfo || empty($packInfo['uuid'])) {
                return;
            }
            $worldName = $this->getWorldName($repository);
            $worldDir = 'worlds/' . $worldName;
            $this->ensureDirectoryExists($repository, 'worlds');
            $this->ensureDirectoryExists($repository, $worldDir);
            $configPath = $worldDir . '/' . $configFile;
            $existingPacks = [];
            try {
                $configContent = $repository->setServer($this->server)->getContent('/' . $configPath);
                $existingPacks = json_decode($configContent, true) ?? [];
            } catch (\Exception $e) {
            }
            $packExists = false;
            foreach ($existingPacks as $pack) {
                if (($pack['pack_id'] ?? '') === $packInfo['uuid']) {
                    $packExists = true;
                    break;
                }
            }
            if (!$packExists) {
                $versionParts = explode('.', $packInfo['version']);
                $hasIcon = $this->checkPackIcon($repository, $packDir);
                $existingPacks[] = [
                    'pack_id' => $packInfo['uuid'],
                    'version' => array_map('intval', $versionParts),
                    'name' => $packInfo['name'] ?? 'Unknown Pack',
                    'path' => $packDir,
                    'has_icon' => $hasIcon,
                ];
                $configContent = json_encode($existingPacks, JSON_PRETTY_PRINT);
                $repository->setServer($this->server)->putContent('/' . $configPath, $configContent);
            } else {
            }
        } catch (\Exception $e) {
        }
    }
    /**
     * Read pack manifest.json to get pack info.
     */
    protected function readPackManifest(DaemonFileRepository $repository, string $packPath): ?array
    {
        try {
            $manifestContent = $repository->setServer($this->server)->getContent('/' . $packPath . '/manifest.json');
            $manifestContent = $this->stripJsonComments($manifestContent);
            $manifest = json_decode($manifestContent, true);
            if (!$manifest) {
                return null;
            }
            $header = $manifest['header'] ?? [];
            $version = $header['version'] ?? [0, 0, 0];
            if (is_array($version)) {
                $version = implode('.', $version);
            }
            $minEngineVersion = $header['min_engine_version'] ?? [];
            if (is_array($minEngineVersion)) {
                $minEngineVersion = implode('.', $minEngineVersion);
            }
            return [
                'uuid' => $header['uuid'] ?? null,
                'name' => $header['name'] ?? 'Unknown Pack',
                'description' => $header['description'] ?? '',
                'version' => $version,
                'min_engine_version' => $minEngineVersion,
            ];
        } catch (\Exception $e) {
            return null;
        }
    }
}
