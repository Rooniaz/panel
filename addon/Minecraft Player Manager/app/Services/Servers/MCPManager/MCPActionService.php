<?php
namespace Pterodactyl\Services\Servers\MCPManager;
use Illuminate\Support\Str;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Cache;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Repositories\Wings\DaemonCommandRepository;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Players\Nbt\Service as NbtService;
class MCPActionService
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
     * @var NbtService
     */
    private $nbtService;
    /**
     * MCPActionService constructor.
     *
     * @param DaemonCommandRepository $commandRepository
     * @param DaemonFileRepository $fileRepository
     * @param NbtService $nbtService
     */
    public function __construct(
        DaemonCommandRepository $commandRepository,
        DaemonFileRepository $fileRepository,
        NbtService $nbtService = null
    ) {
        $this->commandRepository = $commandRepository;
        $this->fileRepository = $fileRepository;
        $this->nbtService = $nbtService;
    }
    /**
     * Get banned players from banned-players.json.
     *
     * @param Server $server
     * @return array
     */
    public function getBannedPlayers(Server $server): array
    {
        try {
            $content = $this->fileRepository->setServer($server)->getContent('banned-players.json');
            $data = json_decode($content, true);
            if (!is_array($data)) {
                return [];
            }
            $players = [];
            foreach ($data as $entry) {
                $players[] = [
                    'name' => $entry['name'] ?? 'Unknown',
                    'uuid' => $entry['uuid'] ?? null,
                    'reason' => $entry['reason'] ?? null,
                    'avatar' => $this->getPlayerAvatar($entry['name'] ?? 'Unknown', $entry['uuid'] ?? null),
                ];
            }
            return $players;
        } catch (\Exception $e) {
            return [];
        }
    }
    /**
     * Get whitelisted players from whitelist.json.
     *
     * @param Server $server
     * @return array
     */
    public function getWhitelistedPlayers(Server $server): array
    {
        try {
            $content = $this->fileRepository->setServer($server)->getContent('whitelist.json');
            $data = json_decode($content, true);
            if (!is_array($data)) {
                return [];
            }
            $players = [];
            foreach ($data as $entry) {
                $players[] = [
                    'name' => $entry['name'] ?? 'Unknown',
                    'uuid' => $entry['uuid'] ?? null,
                    'avatar' => $this->getPlayerAvatar($entry['name'] ?? 'Unknown', $entry['uuid'] ?? null),
                ];
            }
            return $players;
        } catch (\Exception $e) {
            return [];
        }
    }
    /**
     * Get op players from ops.json.
     *
     * @param Server $server
     * @return array
     */
    public function getOpPlayers(Server $server): array
    {
        try {
            $content = $this->fileRepository->setServer($server)->getContent('ops.json');
            $data = json_decode($content, true);
            if (!is_array($data)) {
                return [];
            }
            $players = [];
            foreach ($data as $entry) {
                $players[] = [
                    'name' => $entry['name'] ?? 'Unknown',
                    'uuid' => $entry['uuid'] ?? null,
                    'avatar' => $this->getPlayerAvatar($entry['name'] ?? 'Unknown', $entry['uuid'] ?? null),
                ];
            }
            return $players;
        } catch (\Exception $e) {
            return [];
        }
    }
    /**
     * Get banned IPs from banned-ips.json.
     *
     * @param Server $server
     * @return array
     */
    public function getBannedIps(Server $server): array
    {
        try {
            $content = $this->fileRepository->setServer($server)->getContent('banned-ips.json');
            $data = json_decode($content, true);
            if (!is_array($data)) {
                return [];
            }
            $bannedIps = [];
            foreach ($data as $entry) {
                $bannedIps[] = [
                    'ip' => $entry['ip'] ?? 'Unknown',
                    'reason' => $entry['reason'] ?? null,
                ];
            }
            return $bannedIps;
        } catch (\Exception $e) {
            return [];
        }
    }
    /**
     * Get player avatar URL.
     *
     * @param string $name
     * @param string|null $uuid
     * @return string
     */
    private function getPlayerAvatar(string $name, ?string $uuid = null): string
    {
        if ($uuid) {
            $uuid = str_replace('-', '', $uuid);
            return "https://crafatar.com/avatars/{$uuid}?overlay=true&size=64";
        }
        return "https://mc-heads.net/avatar/{$name}/64";
    }
    /**
     * Add player to whitelist.
     *
     * @param Server $server
     * @param string $uuid
     * @param string $name
     * @return void
     * @throws \Exception
     */
    public function whitelistPlayer(Server $server, string $uuid, string $name): void
    {
        $this->commandRepository->setServer($server)->send("whitelist add {$name}");
        $this->clearCache($server);
    }
    /**
     * Remove player from whitelist.
     *
     * @param Server $server
     * @param string $uuid
     * @param string|null $name
     * @return void
     * @throws \Exception
     */
    public function unwhitelistPlayer(Server $server, string $uuid, ?string $name = null): void
    {
        if ($name) {
            $this->commandRepository->setServer($server)->send("whitelist remove {$name}");
        } else {
            $whitelistedPlayers = $this->getWhitelistedPlayers($server);
            foreach ($whitelistedPlayers as $player) {
                if ($player['uuid'] === $uuid) {
                    $this->commandRepository->setServer($server)->send("whitelist remove {$player['name']}");
                    break;
                }
            }
        }
        $this->clearCache($server);
    }
    /**
     * Ban a player.
     *
     * @param Server $server
     * @param string $uuid
     * @param string $name
     * @param string|null $reason
     * @return void
     * @throws \Exception
     */
    public function banPlayer(Server $server, string $uuid, string $name, ?string $reason = null): void
    {
        if ($reason) {
            $this->commandRepository->setServer($server)->send("ban {$name} {$reason}");
        } else {
            $this->commandRepository->setServer($server)->send("ban {$name}");
        }
        $this->clearCache($server);
    }
    /**
     * Unban a player.
     *
     * @param Server $server
     * @param string $uuid
     * @return void
     * @throws \Exception
     */
    public function unbanPlayer(Server $server, string $uuid): void
    {
        $bannedPlayers = $this->getBannedPlayers($server);
        foreach ($bannedPlayers as $player) {
            if ($player['uuid'] === $uuid) {
                $this->commandRepository->setServer($server)->send("pardon {$player['name']}");
                break;
            }
        }
        $this->clearCache($server);
    }
    /**
     * Add player to operators.
     *
     * @param Server $server
     * @param string $uuid
     * @param string $name
     * @return void
     * @throws \Exception
     */
    public function opPlayer(Server $server, string $uuid, string $name): void
    {
        $this->commandRepository->setServer($server)->send("op {$name}");
        $this->clearCache($server);
    }
    /**
     * Remove player from operators.
     *
     * @param Server $server
     * @param string $uuid
     * @param string|null $name
     * @return void
     * @throws \Exception
     */
    public function deopPlayer(Server $server, string $uuid, ?string $name = null): void
    {
        if ($name) {
            $this->commandRepository->setServer($server)->send("deop {$name}");
        } else {
            $opPlayers = $this->getOpPlayers($server);
            foreach ($opPlayers as $player) {
                if ($player['uuid'] === $uuid) {
                    $this->commandRepository->setServer($server)->send("deop {$player['name']}");
                    break;
                }
            }
        }
        $this->clearCache($server);
    }
    /**
     * Clear player inventory.
     *
     * @param Server $server
     * @param string $uuid
     * @param string|null $name
     * @return void
     * @throws \Exception
     */
    public function clearPlayerInventory(Server $server, string $uuid, ?string $name = null): void
    {
        if ($name) {
            $this->commandRepository->setServer($server)->send("clear {$name}");
        } else {
            $players = $this->getAllPlayers($server);
            foreach ($players as $player) {
                if ($player['uuid'] === $uuid) {
                    $this->commandRepository->setServer($server)->send("clear {$player['name']}");
                    break;
                }
            }
        }
    }
    /**
     * Wipe player data.
     *
     * @param Server $server
     * @param string $uuid
     * @param string|null $name
     * @return void
     * @throws \Exception
     */
    public function wipePlayerData(Server $server, string $uuid, ?string $name = null): void
    {
        if (!Str::isUuid($uuid)) {
            throw new DisplayException('Invalid UUID provided.');
        }
        if ($name) {
            try {
                $this->commandRepository->setServer($server)->send("kick {$name} \"Player data being wiped - Please rejoin in a moment\"");
                sleep(1);
            } catch (\Exception $e) {
            }
        }
        $filePatterns = [
            "playerdata/{$uuid}.dat",
            "playerdata/{$uuid}.dat_old",
            "stats/{$uuid}.json",
            "advancements/{$uuid}.json",
            "world/playerdata/{$uuid}.dat",
            "world/playerdata/{$uuid}.dat_old",
            "world/stats/{$uuid}.json",
            "world/advancements/{$uuid}.json"
        ];
        $deletedFiles = [];
        foreach ($filePatterns as $pattern) {
            try {
                $directory = dirname($pattern);
                $fileName = basename($pattern);
                $root = $directory === '.' ? '/' : $directory;
                $this->fileRepository->setServer($server)->deleteFiles($root, [$fileName]);
                $deletedFiles[] = $pattern;
            } catch (\Throwable $e) {
                \Log::debug("Could not delete file {$pattern} during wipe: " . $e->getMessage());
            }
        }
        try {
            $worlds = $this->getDetectedWorlds($server);
            foreach ($worlds as $world) {
                if ($world['name'] !== 'world') {
                    $worldFiles = [
                        "{$world['name']}/playerdata/{$uuid}.dat",
                        "{$world['name']}/playerdata/{$uuid}.dat_old",
                        "{$world['name']}/stats/{$uuid}.json",
                        "{$world['name']}/advancements/{$uuid}.json"
                    ];
                    foreach ($worldFiles as $pattern) {
                        try {
                            $directory = dirname($pattern);
                            $fileName = basename($pattern);
                            $this->fileRepository->setServer($server)->deleteFiles($directory, [$fileName]);
                            $deletedFiles[] = $pattern;
                        } catch (\Throwable $e) {
                            \Log::debug("Could not delete world file {$pattern} during wipe: " . $e->getMessage());
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            \Log::error('Failed to get detected worlds during player wipe: ' . $e->getMessage());
        }
        Cache::forget("server:{$server->uuid}:fast_query");
        \Log::info("Wiped player data for UUID {$uuid}, deleted " . count($deletedFiles) . " files");
    }
    /**
     * Change player gamemode.
     *
     * @param Server $server
     * @param string $uuid
     * @param int $gamemode
     * @param string|null $name
     * @return void
     * @throws \Exception
     */
    public function changePlayerGamemode(Server $server, string $uuid, int $gamemode, ?string $name = null): void
    {
        if (!in_array($gamemode, [0, 1, 2, 3])) {
            throw new DisplayException('Invalid gamemode specified.');
        }
        $gamemodeNames = [
            0 => 'survival',
            1 => 'creative',
            2 => 'adventure',
            3 => 'spectator',
        ];
        if ($name) {
            $this->commandRepository->setServer($server)->send("gamemode {$gamemodeNames[$gamemode]} {$name}");
        } else {
            $players = $this->getAllPlayers($server);
            foreach ($players as $player) {
                if ($player['uuid'] === $uuid) {
                    $this->commandRepository->setServer($server)->send("gamemode {$gamemodeNames[$gamemode]} {$player['name']}");
                    break;
                }
            }
        }
        $this->clearCache($server);
    }
    /**
     * Kick player with reason.
     *
     * @param Server $server
     * @param string $name
     * @param string $reason
     * @return void
     * @throws \Exception
     */
    public function kickPlayerWithReason(Server $server, string $name, string $reason): void
    {
        $this->commandRepository->setServer($server)->send("kick {$name} {$reason}");
    }
    /**
     * Ban player with reason.
     *
     * @param Server $server
     * @param string $name
     * @param string $reason
     * @return void
     * @throws \Exception
     */
    public function banPlayerWithReason(Server $server, string $name, string $reason): void
    {
        $this->commandRepository->setServer($server)->send("ban {$name} {$reason}");
        $this->clearCache($server);
    }
    /**
     * Ban IP.
     *
     * @param Server $server
     * @param string $uuid
     * @param string $name
     * @param string|null $reason
     * @return void
     * @throws \Exception
     */
    public function banIp(Server $server, string $uuid, string $name, ?string $reason = null): void
    {
        if (empty($name)) {
            throw new DisplayException('Player name is required.');
        }
        $command = "banip {$name}";
        if (!empty($reason)) {
            $command .= " {$reason}";
        }
        $this->commandRepository->setServer($server)->send($command);
        $this->clearCache($server);
    }
    /**
     * Unban IP.
     *
     * @param Server $server
     * @param string $name
     * @return void
     * @throws \Exception
     */
    public function unbanIp(Server $server, string $name): void
    {
        $this->commandRepository->setServer($server)->send("unbanip {$name}");
        $this->clearCache($server);
    }
    /**
     * Give an item to a player.
     *
     * @param Server $server
     * @param string $uuid
     * @param string $player
     * @param string $item
     * @param int $amount
     * @param int $metadata
     * @param int|null $slot
     * @param string|null $type
     * @throws \Exception
     */
    public function giveItem(Server $server, string $uuid, string $player, string $item, int $amount = 1, int $metadata = 0, ?int $slot = null, ?string $type = null): void
    {
        if (empty($player)) {
            throw new DisplayException('Player name is required.');
        }
        if (empty($item)) {
            throw new DisplayException('Item name is required.');
        }
        if ($amount < 1) {
            throw new DisplayException('Amount must be at least 1.');
        }
        if ($slot !== null && $type !== null) {
            $itemCommand = "$item $amount";
            if ($metadata > 0) {
            }
            $slotId = '';
            if ($type === 'inventory') {
                $slotId = "container.{$slot}";
            } elseif ($type === 'armor') {
                $armorSlots = [
                    0 => 'armor.head',
                    1 => 'armor.chest',
                    2 => 'armor.legs',
                    3 => 'armor.feet',
                ];
                if (isset($armorSlots[$slot])) {
                    $slotId = $armorSlots[$slot];
                }
            } elseif ($type === 'offhand') {
                $slotId = 'weapon.offhand';
            } elseif ($type === 'ender_chest') {
                $slotId = "enderchest.{$slot}";
            }
            if (!empty($slotId)) {
                $command = "minecraft:item replace entity {$player} {$slotId} with {$itemCommand}";
                $this->commandRepository->setServer($server)->send($command);
                return;
            }
        }
        $command = "minecraft:give $player $item $amount";
        if ($metadata > 0) {
            $command .= " $metadata";
        }
        $this->commandRepository->setServer($server)->send($command);
    }
    /**
     * Add an effect to a player.
     *
     * @param Server $server
     * @param string $uuid
     * @param string $player
     * @param string $effect
     * @param int $duration
     * @param int $amplifier
     * @throws \Exception
     */
    public function addEffect(Server $server, string $uuid, string $player, string $effect, int $duration = 30, int $amplifier = 1): void
    {
        if (empty($player)) {
            throw new DisplayException('Player name is required.');
        }
        if (empty($effect)) {
            throw new DisplayException('Effect name is required.');
        }
        if ($duration < 1) {
            throw new DisplayException('Duration must be at least 1 second.');
        }
        if ($amplifier < 0) {
            throw new DisplayException('Amplifier must be at least 0.');
        }
        $ticks = $duration * 20;
        $this->commandRepository->setServer($server)->send("minecraft:effect give $player $effect $ticks $amplifier");
    }
    /**
     * Clear all effects from a player.
     *
     * @param Server $server
     * @param string $uuid
     * @param string $player
     * @throws \Exception
     */
    public function clearEffect(Server $server, string $uuid, string $player): void
    {
        if (empty($player)) {
            throw new DisplayException('Player name is required.');
        }
        $this->commandRepository->setServer($server)->send("effect clear $player");
    }
    /**
     * Unban player IP.
     *
     * @param Server $server
     * @param string $name
     * @return void
     * @throws \Exception
     */
    public function unbanPlayerIp(Server $server, string $name): void
    {
        throw new DisplayException('Unbanning player IP by name is not supported. Please use the IP address directly.');
    }
    /**
     * Whisper to player.
     *
     * @param Server $server
     * @param string $name
     * @param string $message
     * @return void
     * @throws \Exception
     */
    public function whisperPlayer(Server $server, string $name, string $message): void
    {
        if (empty($name)) {
            throw new DisplayException('Player name is required.');
        }
        $this->commandRepository->setServer($server)->send("tell {$name} {$message}");
    }
    /**
     * Teleport player.
     *
     * @param Server $server
     * @param string $name
     * @param string $target
     * @return void
     * @throws \Exception
     */
    public function teleportPlayer(Server $server, string $name, string $target): void
    {
        if (strpos($target, ' ') !== false) {
            $this->commandRepository->setServer($server)->send("tp {$name} {$target}");
        } else {
            $this->commandRepository->setServer($server)->send("tp {$name} {$target}");
        }
    }
    /**
     * Kill player.
     *
     * @param Server $server
     * @param string $name
     * @return void
     * @throws \Exception
     */
    public function killPlayer(Server $server, string $name): void
    {
        $this->commandRepository->setServer($server)->send("kill {$name}");
    }
    /**
     * Remove player item.
     *
     * @param Server $server
     * @param string $name
     * @param int $slot
     * @param string $type
     * @return void
     * @throws \Exception
     */
    public function removePlayerItem(Server $server, string $name, int $slot, string $type): void
    {
        if ($type === 'inventory') {
            $this->commandRepository->setServer($server)->send("minecraft:item replace entity {$name} container.{$slot} with minecraft:air");
        } elseif ($type === 'armor') {
            $armorSlots = [
                0 => 'armor.head',
                1 => 'armor.chest',
                2 => 'armor.legs',
                3 => 'armor.feet'
            ];
            if (isset($armorSlots[$slot])) {
                $this->commandRepository->setServer($server)->send("minecraft:item replace entity {$name} {$armorSlots[$slot]} with minecraft:air");
            }
        } elseif ($type === 'offhand') {
            $this->commandRepository->setServer($server)->send("minecraft:item replace entity {$name} weapon.offhand with minecraft:air");
        } elseif ($type === 'ender_chest') {
            $this->commandRepository->setServer($server)->send("minecraft:item replace entity {$name} enderchest.{$slot} with minecraft:air");
        }
    }
    /**
     * Get player items.
     *
     * @param Server $server
     * @param string $uuid
     * @param string $world
     * @return array
     * @throws \Exception
     */
    public function getPlayerItems(Server $server, string $uuid, string $world = 'world'): array
    {
        try {
            $playerDataPath = $world . '/playerdata/' . $uuid . '.dat';
            $playerData = $this->fileRepository->setServer($server)->getContent($playerDataPath);
            if (!$playerData) {
                return ['error' => "Player data file not found in world '{$world}'. The player may need to join this world first."];
            }
            $decompressedData = zlib_decode($playerData);
            if ($decompressedData === false) {
                return ['error' => 'Failed to decompress player data file. The file may be corrupted.'];
            }
            $tree = $this->nbtService->readString($decompressedData);
            if (!$tree) {
                return ['error' => 'Failed to parse NBT data. The player data file may be corrupted or incompatible.'];
            }
            $statsData = [];
            try {
                $statsPath = $world . '/stats/' . $uuid . '.json';
                $statsContent = $this->fileRepository->setServer($server)->getContent($statsPath);
                if ($statsContent) {
                    $statsData = json_decode($statsContent, true) ?? [];
                }
            } catch (\Exception $e) {
            }
            $inventoryData = $this->processInventoryData($tree);
            $nbtArray = $this->convertNodeToArray($tree);
            $statsData = $this->processPlayerStats($statsData, $nbtArray);
            $posNode = $tree->findChildByName('Pos');
            if ($posNode) {
                $posValue = $posNode->getValue();
            }
            if ($posNode && method_exists($posNode, 'getChildren')) {
                $posChildren = $posNode->getChildren();
                if (count($posChildren) === 3) {
                    $statsData['position'] = [
                        floor($posChildren[0]->getValue()),
                        floor($posChildren[1]->getValue()),
                        floor($posChildren[2]->getValue()),
                    ];
                }
            }
            $inventoryData['inventory'] = $this->normalizeItems($inventoryData['inventory']);
            $inventoryData['ender_chest'] = $this->normalizeItems($inventoryData['ender_chest']);
            $inventoryData['offhand'] = $this->normalizeItems($inventoryData['offhand']);
            $inventoryData['armor'] = $this->normalizeItems(array_filter($inventoryData['armor']));
            return [
                'inventory' => $inventoryData['inventory'],
                'ender_chest' => $inventoryData['ender_chest'],
                'offhand' => $inventoryData['offhand'],
                'armor' => $inventoryData['armor'],
                'player_avatar' => $this->getPlayerAvatar('', $uuid),
                'player_stats' => $statsData,
            ];
        } catch (\Exception $e) {
            return ['error' => 'Failed to get player items: ' . $e->getMessage()];
        }
    }
    /**
     * Convert NBT Node to array
     * 
     * @param mixed $node
     * @return array
     */
    private function convertNodeToArray($node): array
    {
        $result = [];
        if (method_exists($node, 'getChildren')) {
            foreach ($node->getChildren() as $child) {
                $name = $child->getName();
                if (method_exists($child, 'getChildren') && count($child->getChildren()) > 0) {
                    $result[$name] = $this->convertNodeToArray($child);
                } else {
                    $result[$name] = $child->getValue();
                }
            }
        }
        return $result;
    }
    /**
     * Process inventory data from NBT data
     *
     * @param mixed $tree NBT Node object
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
        if ($inventoryNode && method_exists($inventoryNode, 'getChildren') && $inventoryNode->getChildren()) {
            foreach ($inventoryNode->getChildren() as $itemNode) {
                $item = $this->parseNbtItem($itemNode);
                if (!empty($item['id']) && $item['id'] !== 'minecraft:air') {
                    $slot = $item['slot'] ?? -1;
                    if ($slot >= 100 && $slot <= 103) {
                        $armor[103 - $slot] = $item;
                    } elseif ($slot == -106) {
                        $offhand[] = $item;
                    } else {
                        $inventory[] = $item;
                    }
                }
            }
        }
        if ($enderItemsNode && method_exists($enderItemsNode, 'getChildren') && $enderItemsNode->getChildren()) {
            foreach ($enderItemsNode->getChildren() as $itemNode) {
                $item = $this->parseNbtItem($itemNode);
                if (!empty($item['id']) && $item['id'] !== 'minecraft:air') {
                    $enderChest[] = $item;
                }
            }
        }
        $equipmentNode = $tree->findChildByName('equipment');
        if ($equipmentNode && method_exists($equipmentNode, 'getChildren') && $equipmentNode->getChildren()) {
            $offhandNode = $equipmentNode->findChildByName('offhand');
            if ($offhandNode) {
                $offhandItem = $this->parseNbtItem($offhandNode);
                if (!empty($offhandItem['id']) && $offhandItem['id'] !== 'minecraft:air') {
                    $offhand[] = $offhandItem;
                }
            }
            $armorPieces = [
                'head' => 3,
                'chest' => 2,
                'legs' => 1,
                'feet' => 0
            ];
            foreach ($armorPieces as $piece => $index) {
                $pieceNode = $equipmentNode->findChildByName($piece);
                if ($pieceNode) {
                    $armorItem = $this->parseNbtItem($pieceNode);
                    if (!empty($armorItem['id']) && $armorItem['id'] !== 'minecraft:air') {
                        $armor[$index] = $armorItem;
                    }
                }
            }
        } else {
            $handItemsNode = $tree->findChildByName('HandItems');
            if ($handItemsNode && method_exists($handItemsNode, 'getChildren') && $handItemsNode->getChildren()) {
                $handItems = $handItemsNode->getChildren();
                if (isset($handItems[1])) {
                    $offhandItem = $this->parseNbtItem($handItems[1]);
                    if (!empty($offhandItem['id']) && $offhandItem['id'] !== 'minecraft:air') {
                        $offhand[] = $offhandItem;
                    }
                }
            }
            $armorItemsNode = $tree->findChildByName('ArmorItems');
            if ($armorItemsNode && method_exists($armorItemsNode, 'getChildren') && $armorItemsNode->getChildren()) {
                $armorItems = $armorItemsNode->getChildren();
                for ($i = 0; $i < 4; $i++) {
                    if (isset($armorItems[$i])) {
                        $armorItem = $this->parseNbtItem($armorItems[$i]);
                        if (!empty($armorItem['id']) && $armorItem['id'] !== 'minecraft:air') {
                            $armor[$i] = $armorItem;
                        }
                    }
                }
            }
        }
        return [
            'inventory' => $inventory,
            'ender_chest' => $enderChest,
            'offhand' => $offhand,
            'armor' => $armor,
        ];
    }
    /**
     * Parse NBT item node
     * 
     * @param mixed $itemNode
     * @return array
     */
    private function parseNbtItem($itemNode): array
    {
        if (!method_exists($itemNode, 'findChildByName')) {
            return ['id' => '', 'count' => 0];
        }
        $idNode = $itemNode->findChildByName('id');
        $id = $idNode ? $idNode->getValue() : '';
        if (empty($id)) {
            $idNode = $itemNode->findChildByName('Id');
            $id = $idNode ? $idNode->getValue() : '';
        }
        if (empty($id)) {
            return ['id' => '', 'count' => 0];
        }
        $countNode = $itemNode->findChildByName('Count') ?: $itemNode->findChildByName('count');
        $count = $countNode ? $countNode->getValue() : 1;
        if ($count === null || $count === 0) {
            $count = 1;
        }
        $slotNode = $itemNode->findChildByName('Slot') ?: $itemNode->findChildByName('slot');
        $slot = $slotNode ? $slotNode->getValue() : null;
        $damageNode = $itemNode->findChildByName('Damage') ?: $itemNode->findChildByName('damage');
        $damage = $damageNode ? $damageNode->getValue() : null;
        $item = [
            'id' => htmlspecialchars($id, ENT_QUOTES, 'UTF-8'),
            'count' => $count,
            'slot' => $slot,
        ];
        if ($damage !== null) {
            $item['damage'] = $damage;
        }
        $maxDamageNode = $itemNode->findChildByName('MaxDamage') ?: $itemNode->findChildByName('maxDamage');
        if ($maxDamageNode) {
            $item['maxDamage'] = $maxDamageNode->getValue();
        }
        $tagNode = $itemNode->findChildByName('tag');
        if ($tagNode && method_exists($tagNode, 'getChildren')) {
            $item['tag'] = [];
            $enchNode = $tagNode->findChildByName('Enchantments') ?: $tagNode->findChildByName('ench');
            if ($enchNode && method_exists($enchNode, 'getChildren')) {
                $item['enchantments'] = [];
                foreach ($enchNode->getChildren() as $enchChild) {
                    $enchId = $enchChild->findChildByName('id');
                    $enchLvl = $enchChild->findChildByName('lvl');
                    if ($enchId && $enchLvl) {
                        $item['enchantments'][] = [
                            'id' => $enchId->getValue(),
                            'lvl' => $enchLvl->getValue()
                        ];
                    }
                }
            }
            $displayNode = $tagNode->findChildByName('display');
            if ($displayNode && method_exists($displayNode, 'getChildren')) {
                $nameNode = $displayNode->findChildByName('Name');
                if ($nameNode) {
                    $item['displayName'] = $nameNode->getValue();
                }
            }
            $blockEntityTag = $tagNode->findChildByName('BlockEntityTag');
            if ($blockEntityTag && method_exists($blockEntityTag, 'getChildren')) {
                $itemsNode = $blockEntityTag->findChildByName('Items');
                if ($itemsNode && method_exists($itemsNode, 'getChildren')) {
                    $item['shulker_contents'] = [];
                    foreach ($itemsNode->getChildren() as $shulkerItemNode) {
                        $shulkerItem = $this->parseShulkerItem($shulkerItemNode);
                        if (!empty($shulkerItem['id']) && $shulkerItem['id'] !== 'minecraft:air') {
                            $item['shulker_contents'][] = $shulkerItem;
                        }
                    }
                }
            }
            foreach ($tagNode->getChildren() as $tagChild) {
                $tagName = $tagChild->getName();
                $tagValue = $tagChild->getValue();
                if (is_object($tagValue)) {
                    $tagValue = json_encode($tagValue);
                }
                $item['tag'][$tagName] = htmlspecialchars($tagValue, ENT_QUOTES, 'UTF-8');
            }
        }
        $componentsNode = $itemNode->findChildByName('components');
        if ($componentsNode && method_exists($componentsNode, 'getChildren')) {
            $containerNode = $componentsNode->findChildByName('minecraft:container');
            if ($containerNode && method_exists($containerNode, 'getChildren')) {
                $item['shulker_contents'] = [];
                foreach ($containerNode->getChildren() as $containerSlot) {
                    $slotItemNode = $containerSlot->findChildByName('item');
                    if ($slotItemNode) {
                        $shulkerItem = $this->parseShulkerItem($slotItemNode);
                        $containerSlotNode = $containerSlot->findChildByName('slot');
                        if ($containerSlotNode) {
                            $shulkerItem['slot'] = $containerSlotNode->getValue();
                        }
                        if (!empty($shulkerItem['id']) && $shulkerItem['id'] !== 'minecraft:air') {
                            $item['shulker_contents'][] = $shulkerItem;
                        }
                    }
                }
            }
            $customNameNode = $componentsNode->findChildByName('minecraft:custom_name');
            if ($customNameNode) {
                $item['displayName'] = $customNameNode->getValue();
            }
            $enchantmentsNode = $componentsNode->findChildByName('minecraft:enchantments');
            if ($enchantmentsNode && method_exists($enchantmentsNode, 'getChildren')) {
                $levelsNode = $enchantmentsNode->findChildByName('levels');
                if ($levelsNode && method_exists($levelsNode, 'getChildren')) {
                    $item['enchantments'] = [];
                    foreach ($levelsNode->getChildren() as $enchChild) {
                        $item['enchantments'][] = [
                            'id' => $enchChild->getName(),
                            'lvl' => $enchChild->getValue()
                        ];
                    }
                }
            }
        }
        return $item;
    }
    /**
     * Parse Shulker Box item (simplified version without recursive shulker parsing)
     * 
     * @param mixed $itemNode
     * @return array
     */
    private function parseShulkerItem($itemNode): array
    {
        if (!method_exists($itemNode, 'findChildByName')) {
            return ['id' => '', 'count' => 0];
        }
        $idNode = $itemNode->findChildByName('id');
        $id = $idNode ? $idNode->getValue() : '';
        if (empty($id)) {
            $idNode = $itemNode->findChildByName('Id');
            $id = $idNode ? $idNode->getValue() : '';
        }
        if (empty($id)) {
            return ['id' => '', 'count' => 0];
        }
        $countNode = $itemNode->findChildByName('Count') ?: $itemNode->findChildByName('count');
        $count = $countNode ? $countNode->getValue() : 1;
        if ($count === null || $count === 0) {
            $count = 1;
        }
        $slotNode = $itemNode->findChildByName('Slot') ?: $itemNode->findChildByName('slot');
        $slot = $slotNode ? $slotNode->getValue() : null;
        $item = [
            'id' => htmlspecialchars($id, ENT_QUOTES, 'UTF-8'),
            'count' => $count,
            'slot' => $slot,
        ];
        $tagNode = $itemNode->findChildByName('tag');
        if ($tagNode && method_exists($tagNode, 'getChildren')) {
            $displayNode = $tagNode->findChildByName('display');
            if ($displayNode && method_exists($displayNode, 'getChildren')) {
                $nameNode = $displayNode->findChildByName('Name');
                if ($nameNode) {
                    $item['displayName'] = $nameNode->getValue();
                }
            }
            $enchNode = $tagNode->findChildByName('Enchantments') ?: $tagNode->findChildByName('ench');
            if ($enchNode && method_exists($enchNode, 'getChildren')) {
                $item['enchantments'] = [];
                foreach ($enchNode->getChildren() as $enchChild) {
                    $enchId = $enchChild->findChildByName('id');
                    $enchLvl = $enchChild->findChildByName('lvl');
                    if ($enchId && $enchLvl) {
                        $item['enchantments'][] = [
                            'id' => $enchId->getValue(),
                            'lvl' => $enchLvl->getValue()
                        ];
                    }
                }
            }
        }
        $componentsNode = $itemNode->findChildByName('components');
        if ($componentsNode && method_exists($componentsNode, 'getChildren')) {
            $customNameNode = $componentsNode->findChildByName('minecraft:custom_name');
            if ($customNameNode) {
                $item['displayName'] = $customNameNode->getValue();
            }
            $enchantmentsNode = $componentsNode->findChildByName('minecraft:enchantments');
            if ($enchantmentsNode && method_exists($enchantmentsNode, 'getChildren')) {
                $levelsNode = $enchantmentsNode->findChildByName('levels');
                if ($levelsNode && method_exists($levelsNode, 'getChildren')) {
                    $item['enchantments'] = [];
                    foreach ($levelsNode->getChildren() as $enchChild) {
                        $item['enchantments'][] = [
                            'id' => $enchChild->getName(),
                            'lvl' => $enchChild->getValue()
                        ];
                    }
                }
            }
        }
        return $item;
    }
    /**
     * Normalize items to ensure consistent format
     * 
     * @param array $items
     * @return array
     */
    private function normalizeItems(array $items): array
    {
        $normalized = [];
        foreach ($items as $item) {
            if (empty($item) || empty($item['id'])) continue;
            if (strpos($item['id'], 'minecraft:') === false) {
                $item['id'] = 'minecraft:' . $item['id'];
            }
            if (!isset($item['count']) || !is_numeric($item['count'])) {
                $item['count'] = 1;
            }
            if (!isset($item['slot']) && isset($item['Slot'])) {
                $item['slot'] = $item['Slot'];
                unset($item['Slot']);
            }
            if (!isset($item['damage']) && isset($item['Damage'])) {
                $item['damage'] = $item['Damage'];
                unset($item['Damage']);
            }
            if (isset($item['tag']) && is_array($item['tag'])) {
                if (isset($item['tag']['Enchantments']) && is_array($item['tag']['Enchantments'])) {
                    $item['enchantments'] = [];
                    foreach ($item['tag']['Enchantments'] as $ench) {
                        if (isset($ench['id']) && isset($ench['lvl'])) {
                            $item['enchantments'][] = [
                                'id' => $ench['id'],
                                'lvl' => $ench['lvl']
                            ];
                        }
                    }
                }
                if (isset($item['tag']['display']) && isset($item['tag']['display']['Name'])) {
                    $item['displayName'] = $item['tag']['display']['Name'];
                }
            }
            if (isset($item['shulker_contents']) && is_array($item['shulker_contents'])) {
                $normalizedShulkerContents = [];
                foreach ($item['shulker_contents'] as $shulkerItem) {
                    if (empty($shulkerItem) || empty($shulkerItem['id'])) continue;
                    if (strpos($shulkerItem['id'], 'minecraft:') === false) {
                        $shulkerItem['id'] = 'minecraft:' . $shulkerItem['id'];
                    }
                    if (!isset($shulkerItem['count']) || !is_numeric($shulkerItem['count'])) {
                        $shulkerItem['count'] = 1;
                    }
                    $normalizedShulkerContents[] = $shulkerItem;
                }
                $item['shulker_contents'] = $normalizedShulkerContents;
            }
            $normalized[] = $item;
        }
        return $normalized;
    }
    /**
     * Process player stats.
     *
     * @param array $stats
     * @param array $nbtData
     * @return array
     */
    private function processPlayerStats(array $stats, array $nbtData): array
    {
        $result = [
            'raw_stats_data' => $stats,
        ];
        if (isset($nbtData['Health'])) {
            $result['health'] = $nbtData['Health'];
        }
        if (isset($nbtData['foodLevel'])) {
            $result['food_level'] = $nbtData['foodLevel'];
        }
        if (isset($nbtData['foodSaturationLevel'])) {
            $result['food_saturation'] = $nbtData['foodSaturationLevel'];
        }
        if (isset($nbtData['XpLevel'])) {
            $result['xp_level'] = $nbtData['XpLevel'];
        }
        if (isset($nbtData['XpP'])) {
            $result['xp_progress'] = $nbtData['XpP'];
        }
        if (isset($nbtData['ActiveEffects'])) {
            $result['active_effects'] = $nbtData['ActiveEffects'];
        }
        if (isset($nbtData['playerGameType'])) {
            $gamemodes = [
                0 => 'survival',
                1 => 'creative',
                2 => 'adventure',
                3 => 'spectator',
            ];
            $result['gamemode'] = $gamemodes[$nbtData['playerGameType']] ?? 'unknown';
        }
        if (isset($nbtData['Pos'])) {
            $result['position'] = [
                'x' => $nbtData['Pos'][0] ?? 0,
                'y' => $nbtData['Pos'][1] ?? 0,
                'z' => $nbtData['Pos'][2] ?? 0,
            ];
        }
        if (isset($nbtData['Dimension'])) {
            $result['world'] = $nbtData['Dimension'];
        }
        if (isset($stats['stats']['minecraft:custom']['minecraft:time_since_death'])) {
            $result['last_death'] = $stats['stats']['minecraft:custom']['minecraft:time_since_death'];
        }
        if (isset($stats['stats']['minecraft:custom']['minecraft:time_since_rest'])) {
            $result['sleep_timer'] = $stats['stats']['minecraft:custom']['minecraft:time_since_rest'];
        }
        if (isset($stats['stats']['minecraft:custom']['minecraft:deaths'])) {
            $result['deaths'] = $stats['stats']['minecraft:custom']['minecraft:deaths'];
        }
        if (isset($stats['stats']['minecraft:custom']['minecraft:player_kills'])) {
            $result['player_kills'] = $stats['stats']['minecraft:custom']['minecraft:player_kills'];
        }
        if (isset($result['deaths']) && isset($result['player_kills']) && $result['deaths'] > 0) {
            $result['kdr'] = $result['player_kills'] / $result['deaths'];
        }
        if (isset($stats['stats']['minecraft:custom']['minecraft:play_time']) || isset($stats['stats']['minecraft:custom']['minecraft:play_one_minute'])) {
            $playTime = $stats['stats']['minecraft:custom']['minecraft:play_time'] ?? $stats['stats']['minecraft:custom']['minecraft:play_one_minute'] ?? 0;
            $result['play_time_seconds'] = $playTime / 20;
        }
        return $result;
    }
    /**
     * Get detected worlds.
     *
     * @param Server $server
     * @return array
     * @throws \Exception
     */
    public function getDetectedWorlds(Server $server): array
    {
        try {
            $files = $this->fileRepository->setServer($server)->getDirectory('/');
            $worlds = [];
            foreach ($files['contents'] as $file) {
                if ($file['directory'] && !in_array($file['name'], ['.', '..', 'plugins', 'logs', 'libraries', 'crash-reports'])) {
                    try {
                        $levelDat = $this->fileRepository->setServer($server)->getContent("{$file['name']}/level.dat");
                        if ($levelDat) {
                            $hasPlayerData = false;
                            try {
                                $playerDataDir = $this->fileRepository->setServer($server)->getDirectory("{$file['name']}/playerdata");
                                $hasPlayerData = !empty($playerDataDir['contents']);
                            } catch (\Exception $e) {
                            }
                            $hasStats = false;
                            try {
                                $statsDir = $this->fileRepository->setServer($server)->getDirectory("{$file['name']}/stats");
                                $hasStats = !empty($statsDir['contents']);
                            } catch (\Exception $e) {
                            }
                            $worlds[] = [
                                'name' => $file['name'],
                                'display_name' => $this->formatWorldName($file['name']),
                                'has_player_data' => $hasPlayerData,
                                'has_stats' => $hasStats,
                            ];
                        }
                    } catch (\Exception $e) {
                    }
                }
            }
            return $worlds;
        } catch (\Exception $e) {
            throw new DisplayException('Failed to detect worlds: ' . $e->getMessage());
        }
    }
    /**
     * Format world name for display.
     *
     * @param string $name
     * @return string
     */
    private function formatWorldName(string $name): string
    {
        $specialNames = [
            'world' => 'Overworld',
            'world_nether' => 'The Nether',
            'world_the_end' => 'The End',
            'DIM-1' => 'The Nether',
            'DIM1' => 'The End',
        ];
        if (isset($specialNames[$name])) {
            return $specialNames[$name];
        }
        return ucfirst(str_replace('_', ' ', $name));
    }
    /**
     * Update player stats.
     *
     * @param Server $server
     * @param string $uuid
     * @param string $playerName
     * @param array $updates
     * @return void
     * @throws \Exception
     */
    public function updatePlayerStats(Server $server, string $uuid, string $playerName, array $updates): void
    {
        if (isset($updates['gamemode'])) {
            $gamemodes = [
                'survival' => 0,
                'creative' => 1,
                'adventure' => 2,
                'spectator' => 3,
            ];
            $gamemode = is_numeric($updates['gamemode']) ? (int) $updates['gamemode'] : $gamemodes[$updates['gamemode']] ?? 0;
            $this->changePlayerGamemode($server, $uuid, $gamemode, $playerName);
        }
        if (isset($updates['health']) && is_numeric($updates['health'])) {
            $health = (int) $updates['health'];
            $this->commandRepository->setServer($server)->send("effect clear {$playerName}");
            $this->commandRepository->setServer($server)->send("attribute {$playerName} minecraft:generic.max_health base set {$health}");
            $this->commandRepository->setServer($server)->send("effect give {$playerName} minecraft:instant_health 1 10");
        }
        if (isset($updates['food_level']) && is_numeric($updates['food_level'])) {
            $food = (int) $updates['food_level'];
            $this->commandRepository->setServer($server)->send("effect give {$playerName} minecraft:saturation 1 {$food} true");
        }
        if (isset($updates['xp_level']) && is_numeric($updates['xp_level'])) {
            $xp = (int) $updates['xp_level'];
            $this->commandRepository->setServer($server)->send("xp set {$playerName} {$xp} levels");
        }
        if (isset($updates['position']) && is_array($updates['position'])) {
            $x = $updates['position']['x'] ?? 0;
            $y = $updates['position']['y'] ?? 0;
            $z = $updates['position']['z'] ?? 0;
            $this->commandRepository->setServer($server)->send("tp {$playerName} {$x} {$y} {$z}");
        }
    }
    /**
     * Get all players from various sources.
     *
     * @param Server $server
     * @return array
     */
    private function getAllPlayers(Server $server): array
    {
        $players = [];
        $bannedPlayers = $this->getBannedPlayers($server);
        $whitelistedPlayers = $this->getWhitelistedPlayers($server);
        $opPlayers = $this->getOpPlayers($server);
        $allPlayers = array_merge($bannedPlayers, $whitelistedPlayers, $opPlayers);
        $uniquePlayers = [];
        $uuids = [];
        foreach ($allPlayers as $player) {
            if (!isset($player['uuid']) || !in_array($player['uuid'], $uuids)) {
                $uniquePlayers[] = $player;
                if (isset($player['uuid'])) {
                    $uuids[] = $player['uuid'];
                }
            }
        }
        return $uniquePlayers;
    }
    /**
     * Clear cache for a server.
     *
     * @param Server $server
     * @return void
     */
    private function clearCache(Server $server): void
    {
        Cache::forget("server:{$server->uuid}:fast_query");
    }
    /**
     * Validate UUID format.
     *
     * @param string $uuid
     * @return bool
     */
    private function isValidUuid(string $uuid): bool
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid) ||
            preg_match('/^[0-9a-f]{32}$/i', $uuid);
    }
    /**
     * Modify a player's stat.
     *
     * @param Server $server
     * @param string $uuid
     * @param string $playerName
     * @param string $stat
     * @param int $amount
     * @return void
     * @throws \Exception
     */
    public function modifyPlayerStat(Server $server, string $uuid, string $playerName, string $stat, int $amount): void
    {
        if (empty($playerName)) {
            throw new DisplayException('Player name is required.');
        }
        switch ($stat) {
            case 'health':
                if ($amount > 0) {
                    $this->commandRepository->setServer($server)->send("effect give {$playerName} minecraft:instant_health 1 0");
                    $this->commandRepository->setServer($server)->send("damage {$playerName} 2");
                } else {
                    $this->commandRepository->setServer($server)->send("damage {$playerName} 2");
                }
                break;
            case 'hunger':
                if ($amount > 0) {
                    $this->commandRepository->setServer($server)->send("effect give {$playerName} minecraft:saturation 1 1");
                } else {
                    $this->commandRepository->setServer($server)->send("effect give {$playerName} minecraft:hunger 1 255");
                }
                break;
            case 'experience':
                $this->commandRepository->setServer($server)->send("experience add {$playerName} {$amount} levels");
                break;
            default:
                throw new DisplayException('Invalid stat specified.');
        }
        $this->clearCache($server);
    }
}
