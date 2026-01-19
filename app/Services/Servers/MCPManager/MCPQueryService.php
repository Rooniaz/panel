<?php
namespace Pterodactyl\Services\Servers\MCPManager;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Cache;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Repositories\Wings\DaemonCommandRepository;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Players\Query\MinecraftQuery;
use Pterodactyl\Players\Query\MinecraftPing;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;
class MCPQueryService
{
    /**
     * @var DaemonCommandRepository
     */
    private $commandRepository;
    /**
     * @var DaemonFileRepository
     */
    private $fileRepository;
    /**
     * @var MCPActionService
     */
    private $mcpActionService;
    /**
     * @var \Pterodactyl\Players\Nbt\Service
     */
    private $nbtService;
    /**
     * @var \Pterodactyl\Repositories\Wings\DaemonPowerRepository
     */
    private $powerRepository;
    /**
     * @var \Pterodactyl\Players\Nbt\DataHandler
     */
    private $nbtDataHandler;
    /**
     * MCPQueryService constructor.
     *
     * @param MCPActionService $mcpActionService
     * @param DaemonCommandRepository $commandRepository
     * @param DaemonFileRepository $fileRepository
     * @param DaemonPowerRepository $powerRepository
     * @param \Pterodactyl\Players\Nbt\Service $nbtService
     * @param \Pterodactyl\Players\Nbt\DataHandler $nbtDataHandler = null
     */
    public function __construct(
        MCPActionService $mcpActionService,
        DaemonCommandRepository $commandRepository,
        DaemonFileRepository $fileRepository,
        DaemonPowerRepository $powerRepository,
        \Pterodactyl\Players\Nbt\Service $nbtService,
        \Pterodactyl\Players\Nbt\DataHandler $nbtDataHandler = null
    ) {
        $this->mcpActionService = $mcpActionService;
        $this->commandRepository = $commandRepository;
        $this->fileRepository = $fileRepository;
        $this->powerRepository = $powerRepository;
        $this->nbtService = $nbtService;
        $this->nbtDataHandler = $nbtDataHandler;
    }
    /**
     * Checks the bukkit.yml file for the autosave setting and updates it if necessary.
     *
     * @param \Pterodactyl\Models\Server $server
     * @throws \Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function checkAndApplyAutosave(Server $server)
    {
        $filePath = 'bukkit.yml';
        try {
            $content = $this->fileRepository->setServer($server)->getContent($filePath);
        } catch (\Exception $e) {
            return;
        }
        if (preg_match('/^\s*autosave:\s*20\s*$/m', $content)) {
            return;
        }
        if (preg_match('/^\s*autosave:/m', $content)) {
            $newContent = preg_replace('/^(\s*autosave:).*$/m', '$1 20', $content);
        } else {
            return; 
        }
        if ($newContent !== $content) {
            $this->fileRepository->setServer($server)->putContent($filePath, $newContent);
            $this->powerRepository->setServer($server)->send('restart');
        }
    }
    /**
     * Parse NBT item data.
     *
     * @param \Pterodactyl\Players\Nbt\Node $itemNode
     * @return array
     */
    private function parseNbtItem($itemNode): array
    {
        $item = [];
        if (!$itemNode) {
            return $item;
        }
        $idNode = $itemNode->findChildByName('id');
        if ($idNode) {
            $item['id'] = $idNode->getValue();
        }
        $countNode = $itemNode->findChildByName('Count');
        if ($countNode) {
            $item['count'] = $countNode->getValue();
        }
        $slotNode = $itemNode->findChildByName('Slot');
        if ($slotNode) {
            $item['slot'] = $slotNode->getValue();
        }
        $damageNode = $itemNode->findChildByName('Damage');
        if ($damageNode) {
            $item['damage'] = $damageNode->getValue();
        }
        $tagNode = $itemNode->findChildByName('tag');
        if ($tagNode) {
            $displayNode = $tagNode->findChildByName('display');
            if ($displayNode) {
                $nameNode = $displayNode->findChildByName('Name');
                if ($nameNode) {
                    $item['displayName'] = $nameNode->getValue();
                }
                $loreNode = $displayNode->findChildByName('Lore');
                if ($loreNode && $loreNode->getChildren()) {
                    $item['lore'] = [];
                    foreach ($loreNode->getChildren() as $loreLineNode) {
                        $item['lore'][] = $loreLineNode->getValue();
                    }
                }
            }
            $enchNode = $tagNode->findChildByName('Enchantments');
            if ($enchNode && $enchNode->getChildren()) {
                $item['enchantments'] = [];
                foreach ($enchNode->getChildren() as $enchantmentNode) {
                    $enchantment = [];
                    $idNode = $enchantmentNode->findChildByName('id');
                    if ($idNode) {
                        $enchantment['id'] = $idNode->getValue();
                    }
                    $lvlNode = $enchantmentNode->findChildByName('lvl');
                    if ($lvlNode) {
                        $enchantment['level'] = $lvlNode->getValue();
                    }
                    if (!empty($enchantment)) {
                        $item['enchantments'][] = $enchantment;
                    }
                }
            }
        }
        return $item;
    }
    /**
     * Process inventory data from NBT tree.
     *
     * @param \Pterodactyl\Players\Nbt\Node $tree
     * @return array
     */
    private function processInventoryData($tree): array
    {
        $inventoryNode = $tree->findChildByName('Inventory');
        $enderItemsNode = $tree->findChildByName('EnderItems');
        $inventory = [];
        $enderChest = [];
        $offhand = [];
        $armor = [null, null, null, null];
        if ($inventoryNode && $inventoryNode->getChildren()) {
            foreach ($inventoryNode->getChildren() as $itemNode) {
                $item = $this->parseNbtItem($itemNode);
                if (!empty($item['id'])) {
                    $slot = $item['slot'] ?? -1;
                    if ($slot >= 100 && $slot <= 103) {
                        $armorIndex = 103 - $slot;
                        $armor[$armorIndex] = $item;
                    } elseif ($slot == -106) {
                        $offhand[] = $item;
                    } else {
                        $inventory[] = $item;
                    }
                }
            }
        }
        if ($enderItemsNode && $enderItemsNode->getChildren()) {
            foreach ($enderItemsNode->getChildren() as $itemNode) {
                $item = $this->parseNbtItem($itemNode);
                if (!empty($item['id'])) {
                    $enderChest[] = $item;
                }
            }
        }
        return [
            'inventory' => $inventory,
            'ender_chest' => $enderChest,
            'armor' => array_filter($armor),
            'offhand' => $offhand,
        ];
    }
    /**
     * Extract player NBT data.
     *
     * @param \Pterodactyl\Players\Nbt\Node $tree
     * @return array
     */
    private function extractPlayerNBTData($tree): array
    {
        $data = [];
        $healthNode = $tree->findChildByName('Health');
        if ($healthNode) {
            $data['health'] = $healthNode->getValue();
        }
        $foodLevelNode = $tree->findChildByName('foodLevel');
        if ($foodLevelNode) {
            $data['food_level'] = $foodLevelNode->getValue();
        }
        $foodSaturationNode = $tree->findChildByName('foodSaturationLevel');
        if ($foodSaturationNode) {
            $data['food_saturation'] = $foodSaturationNode->getValue();
        }
        $xpLevelNode = $tree->findChildByName('XpLevel');
        if ($xpLevelNode) {
            $data['xp_level'] = $xpLevelNode->getValue();
        }
        $xpPNode = $tree->findChildByName('XpP');
        if ($xpPNode) {
            $data['xp_progress'] = $xpPNode->getValue();
        }
        $posNode = $tree->findChildByName('Pos');
        if ($posNode && $posNode->getChildren()) {
            $posChildren = $posNode->getChildren();
            if (count($posChildren) === 3) {
                $data['position'] = [
                    $posChildren[0]->getValue(),
                    $posChildren[1]->getValue(),
                    $posChildren[2]->getValue(),
                ];
            }
        }
        $inventoryData = $this->processInventoryData($tree);
        $data = array_merge($data, $inventoryData);
        return $data;
    }
    /**
     * Get fast query data for a server.
     *
     * @param Server $server
     * @return array
     * @throws \Exception
     */
    public function getFastQueryData(Server $server): array
    {
        $cacheKey = "server:{$server->uuid}:fast_query";
        $cacheTtl = 2; // 2 seconds for faster updates 
        return Cache::remember($cacheKey, $cacheTtl, function () use ($server) {
            try {
                return $this->queryServerData($server);
            } catch (\Exception $e) {
                return $this->getFallbackData($server);
            }
        });
    }
    /**
     * Clear the cache for a server.
     *
     * @param Server $server
     * @return void
     */
    public function clearCache(Server $server): void
    {
        Cache::forget("server:{$server->uuid}:fast_query");
        Cache::forget("server:{$server->uuid}:server_type");
    }
    /**
     * Query server data using MinecraftQuery and MinecraftPing.
     *
     * @param Server $server
     * @return array
     * @throws \Exception
     */
    private function queryServerData(Server $server): array
    {
        $allocation = $server->allocation;
        $ip = $allocation->ip;
        $port = $allocation->port;
        try {
            $query = new MinecraftQuery();
            $query->Connect($ip, $port, 3); 
            $info = $query->GetInfo();
            $players = $query->GetPlayers();
            if (!$info) {
                throw new \Exception('Failed to get server info via Query');
            }
            $onlinePlayers = [];
            if (is_array($players)) {
                foreach ($players as $playerName) {
                    $uuid = null;
                    $avatar = null;
                    $additionalData = $this->getAdditionalPlayerData($server);
                    foreach ($additionalData['all'] as $player) {
                        if ($player['name'] === $playerName && isset($player['uuid'])) {
                            $uuid = $player['uuid'];
                            $avatar = $player['avatar'] ?? null;
                            break;
                        }
                    }
                    if (!$uuid) {
                        try {
                            $url = "https://api.mojang.com/users/profiles/minecraft/{$playerName}";
                            $ch = curl_init();
                            curl_setopt($ch, CURLOPT_URL, $url);
                            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                            curl_setopt($ch, CURLOPT_TIMEOUT, 3);
                            $response = curl_exec($ch);
                            curl_close($ch);
                            $data = json_decode($response, true);
                            if (isset($data['id'])) {
                                $uuid = $data['id'];
                            }
                        } catch (\Exception $e) {
                        }
                    }
                    $onlinePlayers[] = [
                        'name' => $playerName,
                        'uuid' => $uuid,
                        'avatar' => $avatar ?: $this->getPlayerAvatar($playerName, $uuid),
                    ];
                }
            }
            $additionalData = $this->getAdditionalPlayerData($server);
            return [
                'info' => [
                    'hostname' => $info['HostName'] ?? '',
                    'gametype' => $info['GameType'] ?? '',
                    'version' => [
                        'name' => $info['Version'] ?? '',
                        'protocol' => $info['Protocol'] ?? 0,
                    ],
                    'plugins' => $info['Plugins'] ?? [],
                    'map' => $info['Map'] ?? '',
                    'numplayers' => $info['Players'] ?? 0,
                    'maxplayers' => $info['MaxPlayers'] ?? 0,
                    'hostport' => $info['HostPort'] ?? $port,
                    'hostip' => $info['HostIp'] ?? $ip,
                    'ip' => $ip,
                    'port' => $port,
                ],
                'players' => [
                    'online' => $onlinePlayers,
                    'all' => $additionalData['all'] ?? [],
                    'banned' => $additionalData['banned'] ?? [],
                    'whitelisted' => $additionalData['whitelisted'] ?? [],
                    'ops' => $additionalData['ops'] ?? [],
                    'banned_ips' => $additionalData['banned_ips'] ?? [],
                    'counts' => $additionalData['counts'] ?? [],
                    'max' => $info['MaxPlayers'] ?? 0,
                    'current' => $info['Players'] ?? 0,
                ],
                'server_info' => $this->getServerType($server),
            ];
        } catch (\Exception $e) {
            try {
                $ping = new MinecraftPing($ip, $port, 3);
                $pingData = $ping->Query();
                $ping->Close();
                if (!$pingData) {
                    throw new \Exception('Failed to get server info via Ping');
                }
                $onlinePlayers = [];
                if (isset($pingData['players']['sample']) && is_array($pingData['players']['sample'])) {
                    foreach ($pingData['players']['sample'] as $player) {
                        $uuid = $player['id'] ?? null;
                        if (!$uuid) {
                            $additionalData = $this->getAdditionalPlayerData($server);
                            foreach ($additionalData['all'] as $existingPlayer) {
                                if ($existingPlayer['name'] === $player['name'] && isset($existingPlayer['uuid'])) {
                                    $uuid = $existingPlayer['uuid'];
                                    break;
                                }
                            }
                            if (!$uuid) {
                                try {
                                    $url = "https://api.mojang.com/users/profiles/minecraft/{$player['name']}";
                                    $ch = curl_init();
                                    curl_setopt($ch, CURLOPT_URL, $url);
                                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                                    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
                                    $response = curl_exec($ch);
                                    curl_close($ch);
                                    $data = json_decode($response, true);
                                    if (isset($data['id'])) {
                                        $uuid = $data['id'];
                                    }
                                } catch (\Exception $e) {
                                }
                            }
                        }
                        $onlinePlayers[] = [
                            'name' => $player['name'],
                            'uuid' => $uuid,
                            'avatar' => $this->getPlayerAvatar($player['name'], $uuid),
                        ];
                    }
                }
                $additionalData = $this->getAdditionalPlayerData($server);
                $motdData = $this->processMotd($pingData['description'] ?? '');
                return [
                    'info' => [
                        'hostname' => $motdData['formatted'] ?? '',
                        'version' => [
                            'name' => $pingData['version']['name'] ?? '',
                            'protocol' => $pingData['version']['protocol'] ?? 0,
                        ],
                        'numplayers' => $pingData['players']['online'] ?? 0,
                        'maxplayers' => $pingData['players']['max'] ?? 0,
                        'hostport' => $port,
                        'hostip' => $ip,
                        'ip' => $ip,
                        'port' => $port,
                        'motd' => $motdData,
                    ],
                    'players' => [
                        'online' => $onlinePlayers,
                        'all' => $additionalData['all'] ?? [],
                        'banned' => $additionalData['banned'] ?? [],
                        'whitelisted' => $additionalData['whitelisted'] ?? [],
                        'ops' => $additionalData['ops'] ?? [],
                        'banned_ips' => $additionalData['banned_ips'] ?? [],
                        'counts' => $additionalData['counts'] ?? [],
                        'max' => $pingData['players']['max'] ?? 0,
                        'current' => $pingData['players']['online'] ?? 0,
                    ],
                    'server_info' => $this->getServerType($server),
                ];
            } catch (\Exception $pingException) {
                return $this->getFallbackData($server);
            }
        }
    }
    /**
     * Get fallback data from server files and logs.
     *
     * @param Server $server
     * @return array
     */
    private function getFallbackData(Server $server): array
    {
        try {
            $onlinePlayers = [];
            $version = null;
            $maxPlayers = null;
            
            // Try to detect version from various sources
            try {
                // Method 1: version.json
                $versionJson = $this->fileRepository->setServer($server)->getContent('version.json');
                if ($versionJson) {
                    $versionData = json_decode($versionJson, true);
                    if (isset($versionData['name'])) {
                        $version = $versionData['name'];
                    }
                }
            } catch (\Exception $e) {
            }
            
            // Method 2: server.properties (from motd)
            if (!$version) {
                try {
                    $serverProps = $this->fileRepository->setServer($server)->getContent('server.properties');
                    if ($serverProps && preg_match('/motd=(.+)/i', $serverProps, $matches)) {
                        $motd = trim($matches[1]);
                        if (preg_match('/(\d+\.\d+(?:\.\d+)?)/', $motd, $versionMatches)) {
                            $version = $versionMatches[1];
                        }
                    }
                    // Get max players from server.properties
                    if (preg_match('/max-players=(\d+)/i', $serverProps, $maxMatches)) {
                        $maxPlayers = (int) $maxMatches[1];
                    }
                } catch (\Exception $e) {
                }
            }
            
            // Method 3: Environment variables
            if (!$version) {
                try {
                    $envVars = ['MC_VERSION', 'MINECRAFT_VERSION', 'VANILLA_VERSION'];
                    foreach ($envVars as $var) {
                        $value = $server->variables()->where('env_variable', $var)->first();
                        if ($value && $value->server_value) {
                            $version = $value->server_value;
                            break;
                        }
                    }
                } catch (\Exception $e) {
                }
            }
            
            // Try to get online players from server logs
            try {
                // Check if server is running first
                if (!$server->isInstalled() || $server->isSuspended()) {
                    \Log::debug('Server not installed or suspended, skipping player detection', [
                        'server_uuid' => $server->uuid,
                        'is_installed' => $server->isInstalled(),
                        'is_suspended' => $server->isSuspended(),
                    ]);
                } else {
                    // Send list command to get current online players
                    $listCommandSent = false;
                    try {
                        $this->commandRepository->setServer($server)->send('list');
                        $listCommandSent = true;
                        usleep(800000); // Wait 0.8 seconds for command output to appear in logs
                        \Log::debug('List command sent successfully', ['server_uuid' => $server->uuid]);
                    } catch (\Exception $e) {
                        \Log::warning('Failed to send list command', ['server_uuid' => $server->uuid, 'error' => $e->getMessage()]);
                    }
                    
                    // Try to get online players from server logs (last 300 lines for better detection)
                    $logs = $this->fileRepository->setServer($server)->getContent('logs/latest.log');
                    if ($logs) {
                        $logLines = explode("\n", $logs);
                        $recentLogs = array_slice($logLines, -300); // Last 300 lines for better detection
                        $onlinePlayerNames = [];
                        
                        \Log::debug('Parsing logs for online players', [
                            'server_uuid' => $server->uuid,
                            'total_log_lines' => count($logLines),
                            'recent_log_lines' => count($recentLogs),
                            'list_command_sent' => $listCommandSent,
                        ]);
                    
                    // First pass: Find "There are X of a max Y players online:" and check next line for player names
                    for ($i = 0; $i < count($recentLogs); $i++) {
                        $line = $recentLogs[$i];
                        // Check if this line is "There are X of a max Y players online:" (without player names on same line)
                        if (preg_match('/\[.*?\]\s*\[.*?INFO.*?\]:\s*There are \d+ of a max \d+ players online:\s*$/i', $line)) {
                            // Check next line for player name
                            if (isset($recentLogs[$i + 1])) {
                                $nextLine = $recentLogs[$i + 1];
                                // Format: "[HH:MM:SS] [Server thread/INFO]: PlayerName"
                                if (preg_match('/\[.*?\]\s*\[.*?INFO.*?\]:\s*([A-Za-z0-9_]+)$/i', $nextLine, $nameMatches)) {
                                    $playerName = trim($nameMatches[1]);
                                    // Validate it's a player name (not a system message)
                                    if (!empty($playerName) && 
                                        strlen($playerName) >= 1 && 
                                        strlen($playerName) <= 16 &&
                                        !preg_match('/^(There|Running|Can\'t|Time|Did|or|is|the|system|server|overloaded|change|behind|skipping|ticks|logged|joined|left|lost|connection|game|players|online|max|of|a|list)$/i', $playerName) &&
                                        !in_array($playerName, $onlinePlayerNames)) {
                                        $onlinePlayerNames[] = $playerName;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Second pass: Look for list command output with players on same line
                    foreach ($recentLogs as $line) {
                        // Pattern 0: List command output with players on same line
                        // Format: "[HH:MM:SS] [Server thread/INFO]: There are X of a max Y players online: PlayerName1, PlayerName2"
                        if (preg_match('/\[.*?\]\s*\[.*?INFO.*?\]:\s*There are \d+ of a max \d+ players online:\s*(.+)/i', $line, $matches)) {
                            $playerList = trim($matches[1]);
                            if (!empty($playerList)) {
                                $players = array_map('trim', explode(',', $playerList));
                                foreach ($players as $playerName) {
                                    $playerName = trim($playerName);
                                    if (!empty($playerName) && !in_array($playerName, $onlinePlayerNames)) {
                                        $onlinePlayerNames[] = $playerName;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Third pass: Look for player join messages
                    foreach ($recentLogs as $line) {
                        // Pattern 1: Standard join message
                        // Format: "[HH:MM:SS] [Server thread/INFO]: Hookhe joined the game"
                        if (preg_match('/\[.*?\]\s*\[.*?INFO.*?\]:\s*(.+?)\s+joined the game/i', $line, $matches)) {
                            $playerName = trim($matches[1]);
                            if (!empty($playerName) && !in_array($playerName, $onlinePlayerNames)) {
                                $onlinePlayerNames[] = $playerName;
                            }
                        }
                        // Pattern 2: Login message (Minecraft 1.7.x style)
                        // Format: "[HH:MM:SS] [Server thread/INFO]: Hookhe[/172.22.0.1:39328] logged in"
                        elseif (preg_match('/\[.*?\]\s*\[.*?INFO.*?\]:\s*([^\s\/]+)\s*\[.*?\]\s*logged in/i', $line, $matches)) {
                            $playerName = trim($matches[1]);
                            if (!empty($playerName) && !in_array($playerName, $onlinePlayerNames)) {
                                $onlinePlayerNames[] = $playerName;
                            }
                        }
                    }
                    
                    // Remove players who have left the game (only if they disconnected AFTER joining)
                    // We need to track join/disconnect order, so we'll use a simple approach:
                    // If a player joined and then left, remove them. But if they joined recently, keep them.
                    $joinTimes = [];
                    $disconnectTimes = [];
                    
                    foreach ($recentLogs as $index => $line) {
                        // Track joins
                        if (preg_match('/\[.*?\]\s*\[.*?INFO.*?\]:\s*(.+?)\s+joined the game/i', $line, $matches) ||
                            preg_match('/\[.*?\]\s*\[.*?INFO.*?\]:\s*([^\s\/]+)\s*\[.*?\]\s*logged in/i', $line, $matches)) {
                            $playerName = trim($matches[1]);
                            if (!isset($joinTimes[$playerName]) || $index > $joinTimes[$playerName]) {
                                $joinTimes[$playerName] = $index;
                            }
                        }
                        // Track disconnects
                        if (preg_match('/\[.*?\]\s*\[.*?INFO.*?\]:\s*(.+?)\s+left the game/i', $line, $matches) ||
                            preg_match('/\[.*?\]\s*\[.*?INFO.*?\]:\s*(.+?)\s+lost connection/i', $line, $matches)) {
                            $playerName = trim($matches[1]);
                            if (!isset($disconnectTimes[$playerName]) || $index > $disconnectTimes[$playerName]) {
                                $disconnectTimes[$playerName] = $index;
                            }
                        }
                    }
                    
                    // Remove players who disconnected after joining (or disconnected more recently than joined)
                    foreach ($onlinePlayerNames as $key => $playerName) {
                        if (isset($disconnectTimes[$playerName])) {
                            $disconnectIndex = $disconnectTimes[$playerName];
                            $joinIndex = $joinTimes[$playerName] ?? -1;
                            // If player disconnected after joining, remove them
                            if ($disconnectIndex > $joinIndex) {
                                unset($onlinePlayerNames[$key]);
                            }
                        }
                    }
                    $onlinePlayerNames = array_values($onlinePlayerNames);
                    
                    // Match detected online player names with known players from additionalData
                    $additionalData = $this->getAdditionalPlayerData($server);
                    foreach ($onlinePlayerNames as $playerName) {
                        $playerData = null;
                        // Try to find in additionalData
                        foreach ($additionalData['all'] as $player) {
                            if (strcasecmp($player['name'], $playerName) === 0) {
                                $playerData = $player;
                                break;
                            }
                        }
                        
                        // If not found, create basic player data
                        if (!$playerData) {
                            $playerData = [
                                'name' => $playerName,
                                'uuid' => null,
                                'avatar' => $this->getPlayerAvatar($playerName),
                            ];
                        }
                        
                        $onlinePlayers[] = $playerData;
                    }
                    
                    if (!empty($onlinePlayerNames)) {
                        \Log::info('Online players detected from logs', [
                            'server_uuid' => $server->uuid,
                            'players' => $onlinePlayerNames,
                            'count' => count($onlinePlayerNames),
                        ]);
                    } else {
                        \Log::debug('No online players detected from logs', [
                            'server_uuid' => $server->uuid,
                            'list_command_sent' => $listCommandSent,
                        ]);
                    }
                } else {
                    \Log::warning('Logs file not found or empty', ['server_uuid' => $server->uuid]);
                }
                }
            } catch (\Exception $e) {
                \Log::error('Failed to detect online players from logs', [
                    'server_uuid' => $server->uuid,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
            
            $additionalData = $this->getAdditionalPlayerData($server);
            
            // Build info array with version
            $info = [
                'hostname' => 'Minecraft Server',
                'ip' => $server->allocation->ip,
                'port' => $server->allocation->port,
            ];
            
            if ($version) {
                $info['version'] = [
                    'name' => $version,
                    'protocol' => 0,
                ];
            }
            
            return [
                'info' => $info,
                'players' => [
                    'online' => $onlinePlayers,
                    'all' => $additionalData['all'] ?? [],
                    'banned' => $additionalData['banned'] ?? [],
                    'whitelisted' => $additionalData['whitelisted'] ?? [],
                    'ops' => $additionalData['ops'] ?? [],
                    'banned_ips' => $additionalData['banned_ips'] ?? [],
                    'counts' => $additionalData['counts'] ?? [],
                    'max' => $maxPlayers,
                    'current' => count($onlinePlayers),
                ],
                'server_info' => $this->getServerType($server),
            ];
        } catch (\Exception $e) {
            return [
                'info' => [
                    'hostname' => 'Minecraft Server',
                    'ip' => $server->allocation->ip,
                    'port' => $server->allocation->port,
                ],
                'players' => [
                    'online' => [],
                    'all' => [],
                    'banned' => [],
                    'whitelisted' => [],
                    'ops' => [],
                    'banned_ips' => [],
                    'max' => 0,
                    'current' => 0,
                ],
                'server_info' => [
                    'type' => 'unknown',
                    'is_proxy' => false,
                    'proxy_servers' => [],
                ],
                'error' => 'Failed to query server data: ' . $e->getMessage(),
            ];
        }
    }
    /**
     * Get player avatar URL from name or UUID.
     *
     * @param string $name Player name
     * @param string|null $uuid Player UUID
     * @return string Avatar URL
     */
    private function getPlayerAvatar(string $name, ?string $uuid = null): string
    {
        if ($uuid) {
            return "https://crafatar.com/avatars/{$uuid}?size=64&overlay=true";
        }
        try {
            $url = "https://api.mojang.com/users/profiles/minecraft/{$name}";
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 3);
            $response = curl_exec($ch);
            curl_close($ch);
            $data = json_decode($response, true);
            if (isset($data['id'])) {
                return "https://crafatar.com/avatars/{$data['id']}?size=64&overlay=true";
            }
        } catch (\Exception $e) {
        }
        return "https://crafatar.com/avatars/8667ba71-b85a-4004-af54-457a9734eed7?size=64&overlay=true";
    }
    /**
     * Get additional player data from server files.
     *
     * @param Server $server
     * @return array
     */
    private function getAdditionalPlayerData(Server $server): array
    {
        $bannedPlayers = $this->mcpActionService->getBannedPlayers($server);
        $whitelistedPlayers = $this->mcpActionService->getWhitelistedPlayers($server);
        $opPlayers = $this->mcpActionService->getOpPlayers($server);
        $bannedIps = $this->mcpActionService->getBannedIPs($server);
        $allPlayers = $this->getAllPlayers($server);
        return [
            'all' => $allPlayers,
            'banned' => $bannedPlayers,
            'whitelisted' => $whitelistedPlayers,
            'ops' => $opPlayers,
            'banned_ips' => $bannedIps,
            'counts' => [
                'banned' => count($bannedPlayers),
                'whitelisted' => count($whitelistedPlayers),
                'ops' => count($opPlayers),
                'banned_ips' => count($bannedIps),
                'all' => count($allPlayers),
            ],
        ];
    }
    private function getAllPlayers(Server $server): array
    {
        try {
            $userCacheContent = $this->fileRepository->setServer($server)->getContent('usercache.json');
            $userCacheData = json_decode($userCacheContent, true);
            if (!is_array($userCacheData)) {
                return [];
            }
            $allPlayers = [];
            foreach ($userCacheData as $entry) {
                if (isset($entry['uuid']) && isset($entry['name'])) {
                    $allPlayers[] = [
                        'name' => htmlspecialchars($entry['name'], ENT_QUOTES, 'UTF-8'),
                        'uuid' => htmlspecialchars($entry['uuid'], ENT_QUOTES, 'UTF-8'),
                        'avatar' => $this->getPlayerAvatar($entry['name'], $entry['uuid']),
                    ];
                }
            }
            usort($allPlayers, function ($a, $b) {
                return strcasecmp($a['name'], $b['name']);
            });
            return $allPlayers;
        } catch (\Exception $e) {
            return [];
        }
    }
    /**
     * Process MOTD data.
     *
     * @param mixed $motd
     * @return array
     */
    private function processMotd($motd): array
    {
        $result = [
            'raw' => '',
            'formatted' => '',
            'segments' => [],
        ];
        if (is_string($motd)) {
            $result['raw'] = $motd;
            $result['formatted'] = $this->stripMinecraftFormatting($motd);
            $result['segments'] = [
                [
                    'text' => $result['formatted'],
                ],
            ];
        } elseif (is_array($motd) && isset($motd['text'])) {
            $result['raw'] = json_encode($motd);
            $result['formatted'] = $motd['text'];
            $result['segments'] = [
                [
                    'text' => $motd['text'],
                    'color' => $motd['color'] ?? null,
                    'formats' => isset($motd['bold']) || isset($motd['italic']) || isset($motd['underlined']) ? 
                        array_filter([
                            $motd['bold'] ? 'bold' : null,
                            $motd['italic'] ? 'italic' : null,
                            $motd['underlined'] ? 'underlined' : null,
                        ]) : null,
                ],
            ];
        } elseif (is_array($motd) && isset($motd['extra'])) {
            $result['raw'] = json_encode($motd);
            $result['formatted'] = '';
            $result['segments'] = [];
            foreach ($motd['extra'] as $segment) {
                if (isset($segment['text'])) {
                    $result['formatted'] .= $segment['text'];
                    $result['segments'][] = [
                        'text' => $segment['text'],
                        'color' => $segment['color'] ?? null,
                        'formats' => isset($segment['bold']) || isset($segment['italic']) || isset($segment['underlined']) ? 
                            array_filter([
                                $segment['bold'] ? 'bold' : null,
                                $segment['italic'] ? 'italic' : null,
                                $segment['underlined'] ? 'underlined' : null,
                            ]) : null,
                    ];
                }
            }
        }
        return $result;
    }
    /**
     * Strip Minecraft formatting codes from text.
     *
     * @param string $text
     * @return string
     */
    private function stripMinecraftFormatting(string $text): string
    {
        return preg_replace('/§[0-9a-fk-or]/i', '', $text);
    }
    /**
     * Get server type information.
     *
     * @param Server $server
     * @return array
     */
    public function getServerType(Server $server): array
    {
        $cacheKey = "server:{$server->uuid}:server_type";
        $cacheTtl = 3600; 
        return Cache::remember($cacheKey, $cacheTtl, function () use ($server) {
            try {
                $isProxy = $this->detectIfProxy($server);
                $proxyServers = $isProxy ? $this->detectProxyServers($server) : [];
                return [
                    'type' => $isProxy ? 'proxy' : 'vanilla',
                    'is_proxy' => $isProxy,
                    'proxy_servers' => $proxyServers,
                ];
            } catch (\Exception $e) {
                return [
                    'type' => 'unknown',
                    'is_proxy' => false,
                    'proxy_servers' => [],
                ];
            }
        });
    }
    /**
     * Detect if server is a proxy.
     *
     * @param Server $server
     * @return bool
     */
    private function detectIfProxy(Server $server): bool
    {
        try {
            $files = $this->fileRepository->setServer($server)->getDirectory('/');
            foreach ($files['contents'] as $file) {
                $filename = $file['name'];
                if (in_array($filename, ['config.yml', 'velocity.toml', 'bungeecord.yml', 'waterfall.yml'])) {
                    return true;
                }
            }
            return false;
        } catch (\Exception $e) {
            return false;
        }
    }
    /**
     * Detect proxy servers.
     *
     * @param Server $server
     * @return array
     */
    private function detectProxyServers(Server $server): array
    {
        try {
            $servers = [];
            $files = $this->fileRepository->setServer($server)->getDirectory('/');
            foreach ($files['contents'] as $file) {
                $filename = $file['name'];
                if ($filename === 'config.yml') {
                    $content = $this->fileRepository->setServer($server)->getContent('config.yml');
                    if (preg_match('/servers:\s*\n([\s\S]+?)(?:\n\w|$)/m', $content, $matches)) {
                        $serversSection = $matches[1];
                        preg_match_all('/(\w+):\s*\n\s+motd: [\'"](.+?)[\'"]\s*\n\s+address: [\'"](.+?)[\'"]/m', $serversSection, $serverMatches, PREG_SET_ORDER);
                        foreach ($serverMatches as $match) {
                            $servers[] = $match[1];
                        }
                    }
                } elseif ($filename === 'velocity.toml') {
                    $content = $this->fileRepository->setServer($server)->getContent('velocity.toml');
                    if (preg_match('/\[servers\]([\s\S]+?)(?:\n\[|\n$)/m', $content, $matches)) {
                        $serversSection = $matches[1];
                        preg_match_all('/(\w+) = \{/m', $serversSection, $serverMatches, PREG_SET_ORDER);
                        foreach ($serverMatches as $match) {
                            $servers[] = $match[1];
                        }
                    }
                }
            }
            return $servers;
        } catch (\Exception $e) {
            return [];
        }
    }
    /**
     * Get player advancements.
     *
     * @param Server $server
     * @param string $uuid
     * @return array
     * @throws DisplayException
     */
    public function getPlayerAdvancements(Server $server, string $uuid): array
    {
        try {
            $uuid = basename($uuid);
            $filePath = 'world/advancements/' . $uuid . '.json';
            $content = $this->fileRepository->setServer($server)->getContent($filePath);
            $advancements = json_decode($content, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new DisplayException('Failed to parse advancements JSON.');
            }
            return $advancements;
        } catch (\Exception $e) {
            return [];
        }
    }
}
