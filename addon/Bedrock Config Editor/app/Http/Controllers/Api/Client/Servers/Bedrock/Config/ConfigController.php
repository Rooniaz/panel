<?php
namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Bedrock\Config;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
/**
 * NBT Reader for Minecraft Bedrock level.dat files.
 * Bedrock uses little-endian NBT format with an 8-byte header.
 */
class NbtReader
{
    private string $data;
    private int $offset = 0;
    public const TAG_END = 0;
    public const TAG_BYTE = 1;
    public const TAG_SHORT = 2;
    public const TAG_INT = 3;
    public const TAG_LONG = 4;
    public const TAG_FLOAT = 5;
    public const TAG_DOUBLE = 6;
    public const TAG_BYTE_ARRAY = 7;
    public const TAG_STRING = 8;
    public const TAG_LIST = 9;
    public const TAG_COMPOUND = 10;
    public const TAG_INT_ARRAY = 11;
    public const TAG_LONG_ARRAY = 12;
    public function __construct(string $data)
    {
        $this->data = $data;
        $this->offset = 0;
    }
    /**
     * Parse Bedrock level.dat file.
     * Bedrock level.dat has an 8-byte header before the NBT data.
     */
    public function parse(): array
    {
        $this->offset = 8;
        $tagType = $this->readByte();
        if ($tagType !== self::TAG_COMPOUND) {
            throw new \Exception('Invalid NBT: Root tag must be compound');
        }
        $name = $this->readString();
        $data = $this->readCompound();
        return [
            'name' => $name,
            'data' => $data,
        ];
    }
    private function readByte(): int
    {
        $value = ord($this->data[$this->offset]);
        $this->offset += 1;
        return $value;
    }
    private function readSignedByte(): int
    {
        $value = unpack('c', substr($this->data, $this->offset, 1))[1];
        $this->offset += 1;
        return $value;
    }
    private function readShort(): int
    {
        $value = unpack('v', substr($this->data, $this->offset, 2))[1];
        $this->offset += 2;
        if ($value >= 0x8000) {
            $value -= 0x10000;
        }
        return $value;
    }
    private function readInt(): int
    {
        $value = unpack('V', substr($this->data, $this->offset, 4))[1];
        $this->offset += 4;
        if ($value >= 0x80000000) {
            $value -= 0x100000000;
        }
        return $value;
    }
    private function readLong(): int
    {
        $value = unpack('P', substr($this->data, $this->offset, 8))[1];
        $this->offset += 8;
        return $value;
    }
    private function readFloat(): float
    {
        $value = unpack('g', substr($this->data, $this->offset, 4))[1];
        $this->offset += 4;
        return $value;
    }
    private function readDouble(): float
    {
        $value = unpack('e', substr($this->data, $this->offset, 8))[1];
        $this->offset += 8;
        return $value;
    }
    private function readString(): string
    {
        $length = $this->readShort();
        if ($length < 0) {
            $length = 0;
        }
        $value = substr($this->data, $this->offset, $length);
        $this->offset += $length;
        return $value;
    }
    private function readByteArray(): array
    {
        $length = $this->readInt();
        $value = [];
        for ($i = 0; $i < $length; $i++) {
            $value[] = $this->readSignedByte();
        }
        return $value;
    }
    private function readIntArray(): array
    {
        $length = $this->readInt();
        $value = [];
        for ($i = 0; $i < $length; $i++) {
            $value[] = $this->readInt();
        }
        return $value;
    }
    private function readLongArray(): array
    {
        $length = $this->readInt();
        $value = [];
        for ($i = 0; $i < $length; $i++) {
            $value[] = $this->readLong();
        }
        return $value;
    }
    private function readList(): array
    {
        $listType = $this->readByte();
        $length = $this->readInt();
        $value = [];
        for ($i = 0; $i < $length; $i++) {
            $value[] = $this->readTagValue($listType);
        }
        return [
            '_listType' => $listType,
            '_values' => $value,
        ];
    }
    private function readCompound(): array
    {
        $value = [];
        while (true) {
            $tagType = $this->readByte();
            if ($tagType === self::TAG_END) {
                break;
            }
            $name = $this->readString();
            $tagValue = $this->readTagValue($tagType);
            $value[$name] = [
                '_type' => $tagType,
                '_value' => $tagValue,
            ];
        }
        return $value;
    }
    private function readTagValue(int $tagType): mixed
    {
        return match ($tagType) {
            self::TAG_BYTE => $this->readSignedByte(),
            self::TAG_SHORT => $this->readShort(),
            self::TAG_INT => $this->readInt(),
            self::TAG_LONG => $this->readLong(),
            self::TAG_FLOAT => $this->readFloat(),
            self::TAG_DOUBLE => $this->readDouble(),
            self::TAG_BYTE_ARRAY => $this->readByteArray(),
            self::TAG_STRING => $this->readString(),
            self::TAG_LIST => $this->readList(),
            self::TAG_COMPOUND => $this->readCompound(),
            self::TAG_INT_ARRAY => $this->readIntArray(),
            self::TAG_LONG_ARRAY => $this->readLongArray(),
            default => throw new \Exception("Unknown tag type: {$tagType}"),
        };
    }
}
/**
 * NBT Writer for Minecraft Bedrock level.dat files.
 * Bedrock uses little-endian NBT format with an 8-byte header.
 */
class NbtWriter
{
    private string $buffer = '';
    public const TAG_END = 0;
    public const TAG_BYTE = 1;
    public const TAG_SHORT = 2;
    public const TAG_INT = 3;
    public const TAG_LONG = 4;
    public const TAG_FLOAT = 5;
    public const TAG_DOUBLE = 6;
    public const TAG_BYTE_ARRAY = 7;
    public const TAG_STRING = 8;
    public const TAG_LIST = 9;
    public const TAG_COMPOUND = 10;
    public const TAG_INT_ARRAY = 11;
    public const TAG_LONG_ARRAY = 12;
    /**
     * Write NBT data to Bedrock level.dat format.
     */
    public function write(array $nbtData): string
    {
        $this->buffer = '';
        $this->writeByte(self::TAG_COMPOUND);
        $this->writeString($nbtData['name'] ?? '');
        $this->writeCompound($nbtData['data']);
        $nbtLength = strlen($this->buffer);
        $header = pack('V', 10) . pack('V', $nbtLength);
        return $header . $this->buffer;
    }
    private function writeByte(int $value): void
    {
        $this->buffer .= chr($value & 0xFF);
    }
    private function writeSignedByte(int $value): void
    {
        $this->buffer .= pack('c', $value);
    }
    private function writeShort(int $value): void
    {
        $this->buffer .= pack('v', $value & 0xFFFF);
    }
    private function writeInt(int $value): void
    {
        $this->buffer .= pack('V', $value);
    }
    private function writeLong(int $value): void
    {
        $this->buffer .= pack('P', $value);
    }
    private function writeFloat(float $value): void
    {
        $this->buffer .= pack('g', $value);
    }
    private function writeDouble(float $value): void
    {
        $this->buffer .= pack('e', $value);
    }
    private function writeString(string $value): void
    {
        $this->writeShort(strlen($value));
        $this->buffer .= $value;
    }
    private function writeByteArray(array $value): void
    {
        $this->writeInt(count($value));
        foreach ($value as $byte) {
            $this->writeSignedByte($byte);
        }
    }
    private function writeIntArray(array $value): void
    {
        $this->writeInt(count($value));
        foreach ($value as $int) {
            $this->writeInt($int);
        }
    }
    private function writeLongArray(array $value): void
    {
        $this->writeInt(count($value));
        foreach ($value as $long) {
            $this->writeLong($long);
        }
    }
    private function writeList(array $value): void
    {
        $listType = $value['_listType'] ?? self::TAG_END;
        $values = $value['_values'] ?? [];
        $this->writeByte($listType);
        $this->writeInt(count($values));
        foreach ($values as $item) {
            $this->writeTagValue($listType, $item);
        }
    }
    private function writeCompound(array $value): void
    {
        foreach ($value as $name => $tag) {
            if (!isset($tag['_type']) || !array_key_exists('_value', $tag)) {
                continue;
            }
            $this->writeByte($tag['_type']);
            $this->writeString($name);
            $this->writeTagValue($tag['_type'], $tag['_value']);
        }
        $this->writeByte(self::TAG_END);
    }
    private function writeTagValue(int $tagType, mixed $value): void
    {
        match ($tagType) {
            self::TAG_BYTE => $this->writeSignedByte($value),
            self::TAG_SHORT => $this->writeShort($value),
            self::TAG_INT => $this->writeInt($value),
            self::TAG_LONG => $this->writeLong($value),
            self::TAG_FLOAT => $this->writeFloat($value),
            self::TAG_DOUBLE => $this->writeDouble($value),
            self::TAG_BYTE_ARRAY => $this->writeByteArray($value),
            self::TAG_STRING => $this->writeString($value),
            self::TAG_LIST => $this->writeList($value),
            self::TAG_COMPOUND => $this->writeCompound($value),
            self::TAG_INT_ARRAY => $this->writeIntArray($value),
            self::TAG_LONG_ARRAY => $this->writeLongArray($value),
            default => throw new \Exception("Unknown tag type: {$tagType}"),
        };
    }
}
/**
 * Service for reading and writing Bedrock level.dat files.
 */
class LevelDatService
{
    /**
     * Known experiment flags in Bedrock.
     * These are stored inside the 'experiments' compound tag in level.dat
     */
    public const EXPERIMENTS = [
        'gametest' => [
            'name' => 'Beta APIs',
            'description' => 'Enables Beta APIs (GameTest Framework) for addon scripting',
        ],
        'data_driven_biomes' => [
            'name' => 'Custom Biomes',
            'description' => 'Enables custom biome definitions through JSON',
        ],
        'upcoming_creator_features' => [
            'name' => 'Upcoming Creator Features',
            'description' => 'Enables experimental creator features before official release',
        ],
        'villager_trades_rebalance' => [
            'name' => 'Villager Trade Rebalancing',
            'description' => 'Enables rebalanced villager trading',
        ],
        'experimental_creator_cameras' => [
            'name' => 'Experimental Creator Camera Features',
            'description' => 'Enables experimental camera features for creators',
        ],
        'jigsaw_structures' => [
            'name' => 'Data-Driven Jigsaw Structures',
            'description' => 'Enables data-driven jigsaw structure generation',
        ],
        'y_2025_drop_3' => [
            'name' => 'Drop 3 2025',
            'description' => 'Enables features from the 2025 Drop 3 update',
        ],
    ];
    /**
     * World settings definitions with their types and display info.
     */
    public const WORLD_SETTINGS = [
        'LevelName' => ['type' => 'string', 'name' => 'World Name', 'category' => 'general'],
        'GameType' => ['type' => 'int', 'name' => 'Game Mode', 'category' => 'general', 'options' => [
            0 => 'Survival', 1 => 'Creative', 2 => 'Adventure', 3 => 'Spectator'
        ]],
        'Difficulty' => ['type' => 'int', 'name' => 'Difficulty', 'category' => 'general', 'options' => [
            0 => 'Peaceful', 1 => 'Easy', 2 => 'Normal', 3 => 'Hard'
        ]],
        'ForceGameType' => ['type' => 'byte', 'name' => 'Force Game Mode', 'category' => 'general'],
        'isHardcore' => ['type' => 'byte', 'name' => 'Hardcore Mode', 'category' => 'general'],
        'RandomSeed' => ['type' => 'long', 'name' => 'World Seed', 'category' => 'general'],
        'educationFeaturesEnabled' => ['type' => 'byte', 'name' => 'Education Features', 'category' => 'features'],
        'cheatsEnabled' => ['type' => 'byte', 'name' => 'Cheats Enabled', 'category' => 'features'],
        'commandsEnabled' => ['type' => 'byte', 'name' => 'Commands Enabled', 'category' => 'features'],
        'hasBeenLoadedInCreative' => ['type' => 'byte', 'name' => 'Loaded In Creative', 'category' => 'features'],
        'startWithMapEnabled' => ['type' => 'byte', 'name' => 'Start With Map', 'category' => 'features'],
        'bonusChestEnabled' => ['type' => 'byte', 'name' => 'Bonus Chest', 'category' => 'features'],
        'commandblockoutput' => ['type' => 'byte', 'name' => 'Command Block Output', 'category' => 'gamerules'],
        'commandblocksenabled' => ['type' => 'byte', 'name' => 'Command Blocks Enabled', 'category' => 'gamerules'],
        'sendcommandfeedback' => ['type' => 'byte', 'name' => 'Send Command Feedback', 'category' => 'gamerules'],
        'functioncommandlimit' => ['type' => 'int', 'name' => 'Function Command Limit', 'category' => 'gamerules'],
        'maxcommandchainlength' => ['type' => 'int', 'name' => 'Max Command Chain Length', 'category' => 'gamerules'],
        'dodaylightcycle' => ['type' => 'byte', 'name' => 'Daylight Cycle', 'category' => 'gamerules'],
        'doweathercycle' => ['type' => 'byte', 'name' => 'Weather Cycle', 'category' => 'gamerules'],
        'randomtickspeed' => ['type' => 'int', 'name' => 'Random Tick Speed', 'category' => 'gamerules'],
        'domobloot' => ['type' => 'byte', 'name' => 'Mob Loot', 'category' => 'gamerules'],
        'domobspawning' => ['type' => 'byte', 'name' => 'Mob Spawning', 'category' => 'gamerules'],
        'mobgriefing' => ['type' => 'byte', 'name' => 'Mob Griefing', 'category' => 'gamerules'],
        'doinsomnia' => ['type' => 'byte', 'name' => 'Insomnia (Phantoms)', 'category' => 'gamerules'],
        'dotiledrops' => ['type' => 'byte', 'name' => 'Tile Drops', 'category' => 'gamerules'],
        'doentitydrops' => ['type' => 'byte', 'name' => 'Entity Drops', 'category' => 'gamerules'],
        'dofiretick' => ['type' => 'byte', 'name' => 'Fire Spread', 'category' => 'gamerules'],
        'tntexplodes' => ['type' => 'byte', 'name' => 'TNT Explodes', 'category' => 'gamerules'],
        'tntexplosiondropdecay' => ['type' => 'byte', 'name' => 'TNT Explosion Drop Decay', 'category' => 'gamerules'],
        'respawnblocksexplode' => ['type' => 'byte', 'name' => 'Respawn Blocks Explode', 'category' => 'gamerules'],
        'pvp' => ['type' => 'byte', 'name' => 'PvP', 'category' => 'gamerules'],
        'keepinventory' => ['type' => 'byte', 'name' => 'Keep Inventory', 'category' => 'gamerules'],
        'doimmediaterespawn' => ['type' => 'byte', 'name' => 'Immediate Respawn', 'category' => 'gamerules'],
        'naturalregeneration' => ['type' => 'byte', 'name' => 'Natural Regeneration', 'category' => 'gamerules'],
        'playerssleepingpercentage' => ['type' => 'int', 'name' => 'Players Sleeping Percentage', 'category' => 'gamerules'],
        'dolimitedcrafting' => ['type' => 'byte', 'name' => 'Limited Crafting', 'category' => 'gamerules'],
        'recipesunlock' => ['type' => 'byte', 'name' => 'Recipes Unlock', 'category' => 'gamerules'],
        'drowningdamage' => ['type' => 'byte', 'name' => 'Drowning Damage', 'category' => 'gamerules'],
        'falldamage' => ['type' => 'byte', 'name' => 'Fall Damage', 'category' => 'gamerules'],
        'firedamage' => ['type' => 'byte', 'name' => 'Fire Damage', 'category' => 'gamerules'],
        'freezedamage' => ['type' => 'byte', 'name' => 'Freeze Damage', 'category' => 'gamerules'],
        'showcoordinates' => ['type' => 'byte', 'name' => 'Show Coordinates', 'category' => 'gamerules'],
        'showdaysplayed' => ['type' => 'byte', 'name' => 'Show Days Played', 'category' => 'gamerules'],
        'showdeathmessages' => ['type' => 'byte', 'name' => 'Show Death Messages', 'category' => 'gamerules'],
        'showtags' => ['type' => 'byte', 'name' => 'Show Tags', 'category' => 'gamerules'],
        'locatorbar' => ['type' => 'byte', 'name' => 'Locator Bar', 'category' => 'gamerules'],
        'SpawnX' => ['type' => 'int', 'name' => 'Spawn X', 'category' => 'spawn'],
        'SpawnY' => ['type' => 'int', 'name' => 'Spawn Y', 'category' => 'spawn'],
        'SpawnZ' => ['type' => 'int', 'name' => 'Spawn Z', 'category' => 'spawn'],
        'spawnradius' => ['type' => 'int', 'name' => 'Spawn Radius', 'category' => 'spawn'],
    ];
    public function __construct(
        protected DaemonFileRepository $fileRepository,
    ) {}
    /**
     * Get the default world name from server.properties.
     */
    public function getDefaultWorldName(Server $server): ?string
    {
        try {
            $content = $this->fileRepository->setServer($server)->getContent('/server.properties');
            if (preg_match('/^level-name=(.+)$/m', $content, $matches)) {
                return trim($matches[1]);
            }
        } catch (\Exception $e) {
            Log::debug('Could not read server.properties: ' . $e->getMessage());
        }
        return null;
    }
    /**
     * Get level.dat path for a world.
     */
    public function getLevelDatPath(string $worldName): string
    {
        return "/worlds/{$worldName}/level.dat";
    }
    /**
     * Read and parse level.dat file.
     */
    public function readLevelDat(Server $server, string $worldName): ?array
    {
        try {
            $path = $this->getLevelDatPath($worldName);
            $content = $this->fileRepository->setServer($server)->getContent($path);
            $reader = new NbtReader($content);
            return $reader->parse();
        } catch (\Exception $e) {
            Log::warning('Failed to read level.dat: ' . $e->getMessage());
            return null;
        }
    }
    /**
     * Write level.dat file.
     */
    public function writeLevelDat(Server $server, string $worldName, array $nbtData): bool
    {
        try {
            $path = $this->getLevelDatPath($worldName);
            $writer = new NbtWriter();
            $content = $writer->write($nbtData);
            $this->fileRepository->setServer($server)->putContent($path, $content);
            $verifyContent = $this->fileRepository->setServer($server)->getContent($path);
            if (strlen($verifyContent) !== strlen($content)) {
                Log::error('level.dat verification failed: size mismatch', [
                    'written' => strlen($content),
                    'read_back' => strlen($verifyContent),
                ]);
                return false;
            }
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to write level.dat: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }
    /**
     * Get experiments status from level.dat.
     * Experiments are stored in the 'experiments' compound tag.
     * This method reads ALL experiments from level.dat, not just predefined ones.
     */
    public function getExperiments(Server $server, string $worldName): array
    {
        $nbtData = $this->readLevelDat($server, $worldName);
        if (!$nbtData) {
            Log::warning('Could not read level.dat for experiments');
            return [];
        }
        $experiments = [];
        $data = $nbtData['data'] ?? [];
        $experimentsData = [];
        if (isset($data['experiments']) && isset($data['experiments']['_value'])) {
            $experimentsData = $data['experiments']['_value'];
        }
        Log::debug('Level.dat experiments data:', ['experiments' => array_keys($experimentsData)]);
        foreach (self::EXPERIMENTS as $key => $info) {
            $enabled = false;
            if (isset($experimentsData[$key])) {
                $value = $experimentsData[$key]['_value'] ?? 0;
                $enabled = (bool) $value;
            }
            $experiments[$key] = [
                'key' => $key,
                'name' => $info['name'],
                'description' => $info['description'],
                'enabled' => $enabled,
            ];
        }
        $skipKeys = ['experiments_ever_used', 'saved_with_toggled_experiments'];
        foreach ($experimentsData as $key => $valueData) {
            if (in_array($key, $skipKeys)) {
                continue;
            }
            if (!isset($experiments[$key])) {
                $value = $valueData['_value'] ?? 0;
                $enabled = (bool) $value;
                $friendlyName = ucwords(str_replace(['_', '-'], ' ', $key));
                $experiments[$key] = [
                    'key' => $key,
                    'name' => $friendlyName,
                    'description' => 'Experimental feature: ' . $friendlyName,
                    'enabled' => $enabled,
                ];
            }
        }
        return $experiments;
    }
    /**
     * Update experiments in level.dat.
     * Experiments are stored in the 'experiments' compound tag.
     * Supports both predefined and dynamically discovered experiments.
     */
    public function updateExperiments(Server $server, string $worldName, array $experimentUpdates): bool
    {
        $nbtData = $this->readLevelDat($server, $worldName);
        if (!$nbtData) {
            Log::error('Could not read level.dat for updating experiments');
            return false;
        }
        $hasEnabledExperiments = false;
        if (!isset($nbtData['data']['experiments'])) {
            $nbtData['data']['experiments'] = [
                '_type' => NbtReader::TAG_COMPOUND,
                '_value' => [],
            ];
        }
        $experimentsData = &$nbtData['data']['experiments']['_value'];
        $skipKeys = ['experiments_ever_used', 'saved_with_toggled_experiments'];
        foreach ($experimentUpdates as $key => $enabled) {
            if (in_array($key, $skipKeys)) {
                continue;
            }
            $experimentsData[$key] = [
                '_type' => NbtReader::TAG_BYTE,
                '_value' => $enabled ? 1 : 0,
            ];
            if ($enabled) {
                $hasEnabledExperiments = true;
            }
        }
        foreach ($experimentsData as $key => $valueData) {
            if (in_array($key, $skipKeys)) {
                continue;
            }
            if (($valueData['_value'] ?? 0)) {
                $hasEnabledExperiments = true;
                break;
            }
        }
        $experimentsData['experiments_ever_used'] = [
            '_type' => NbtReader::TAG_BYTE,
            '_value' => $hasEnabledExperiments ? 1 : 0,
        ];
        $experimentsData['saved_with_toggled_experiments'] = [
            '_type' => NbtReader::TAG_BYTE,
            '_value' => $hasEnabledExperiments ? 1 : 0,
        ];
        Log::debug('Saving experiments:', ['experiments' => array_keys($experimentsData)]);
        $result = $this->writeLevelDat($server, $worldName, $nbtData);
        if ($result) {
            $verifyData = $this->readLevelDat($server, $worldName);
            if ($verifyData) {
                $verifyExperiments = $verifyData['data']['experiments']['_value'] ?? [];
            }
        }
        return $result;
    }
    /**
     * Get world settings from level.dat.
     */
    public function getWorldSettings(Server $server, string $worldName): array
    {
        $nbtData = $this->readLevelDat($server, $worldName);
        if (!$nbtData) {
            Log::warning('Could not read level.dat for world settings');
            return [];
        }
        $settings = [];
        $data = $nbtData['data'] ?? [];
        Log::debug('Level.dat keys:', ['keys' => array_keys($data)]);
        foreach (self::WORLD_SETTINGS as $key => $info) {
            if (isset($data[$key])) {
                $settings[$key] = [
                    'key' => $key,
                    'value' => $data[$key]['_value'] ?? null,
                    'nbt_type' => $data[$key]['_type'] ?? null,
                    'name' => $info['name'],
                    'type' => $info['type'],
                    'category' => $info['category'],
                    'options' => $info['options'] ?? null,
                ];
            }
        }
        return $settings;
    }
    /**
     * Update world settings in level.dat.
     */
    public function updateWorldSettings(Server $server, string $worldName, array $settingsUpdates): bool
    {
        $nbtData = $this->readLevelDat($server, $worldName);
        if (!$nbtData) {
            Log::error('Could not read level.dat for updating settings');
            return false;
        }
        foreach ($settingsUpdates as $key => $value) {
            if (!isset(self::WORLD_SETTINGS[$key])) {
                continue;
            }
            $info = self::WORLD_SETTINGS[$key];
            $nbtType = match ($info['type']) {
                'byte' => NbtReader::TAG_BYTE,
                'short' => NbtReader::TAG_SHORT,
                'int' => NbtReader::TAG_INT,
                'long' => NbtReader::TAG_LONG,
                'float' => NbtReader::TAG_FLOAT,
                'double' => NbtReader::TAG_DOUBLE,
                'string' => NbtReader::TAG_STRING,
                default => NbtReader::TAG_INT,
            };
            $typedValue = match ($info['type']) {
                'byte' => (int) $value,
                'short' => (int) $value,
                'int' => (int) $value,
                'long' => (int) $value,
                'float' => (float) $value,
                'double' => (float) $value,
                'string' => (string) $value,
                default => $value,
            };
            $nbtData['data'][$key] = [
                '_type' => $nbtType,
                '_value' => $typedValue,
            ];
        }
        Log::debug('Saving world settings:', ['keys' => array_keys($settingsUpdates)]);
        $result = $this->writeLevelDat($server, $worldName, $nbtData);
        if ($result) {
            $verifyData = $this->readLevelDat($server, $worldName);
            if ($verifyData) {
            }
        }
        return $result;
    }
}
class ConfigController extends ClientApiController
{
    private LevelDatService $levelDatService;
    public function __construct(
        private DaemonFileRepository $fileRepository,
    ) {
        parent::__construct();
        $this->levelDatService = new LevelDatService($fileRepository);
    }
    /**
     * Get server.properties content.
     */
    public function getProperties(Request $request, Server $server): array
    {
        try {
            $content = $this->fileRepository->setServer($server)->getContent('/server.properties');
            $parsed = $this->parseProperties($content);
            return [
                'success' => true,
                'content' => $parsed,
                'raw' => $content,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'server.properties not found',
                'content' => [],
                'raw' => '',
            ];
        }
    }
    /**
     * Save server.properties content.
     * Preserves original file format and only updates changed values.
     */
    public function saveProperties(Request $request, Server $server): array
    {
        $data = $request->validate([
            'contents' => 'nullable|array',
            'raw_content' => 'nullable|string',
        ]);
        try {
            if (isset($data['raw_content'])) {
                $content = $data['raw_content'];
            } else {
                $originalContent = '';
                try {
                    $originalContent = $this->fileRepository->setServer($server)->getContent('/server.properties');
                } catch (\Exception $e) {
                }
                if (!empty($originalContent)) {
                    $content = $this->updatePropertiesPreservingFormat($originalContent, $data['contents'] ?? []);
                } else {
                    $content = $this->stringifyProperties($data['contents'] ?? []);
                }
            }
            $content = str_replace("\r\n", "\n", $content);
            $content = str_replace("\r", "\n", $content);
            $this->fileRepository->setServer($server)->putContent('/server.properties', $content);
            Activity::event('server:bedrock.config.save')
                ->subject($server)
                ->property('config', 'server.properties')
                ->log('Updated Bedrock server.properties via Config Editor');
            return ['success' => true];
        } catch (\Exception $e) {
            Log::error('Failed to save server.properties: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Failed to save server.properties: ' . $e->getMessage(),
            ];
        }
    }
    /**
     * Get list of worlds.
     */
    public function getWorlds(Request $request, Server $server): array
    {
        $worlds = [];
        $defaultWorld = $this->levelDatService->getDefaultWorldName($server);
        try {
            $files = $this->fileRepository->setServer($server)->getDirectory('/worlds');
            foreach ($files as $file) {
                $isDirectory = isset($file['mode']) && str_starts_with($file['mode'], 'd');
                if ($isDirectory) {
                    $worlds[] = [
                        'name' => $file['name'],
                        'is_default' => $file['name'] === $defaultWorld,
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::debug('Could not read worlds directory: ' . $e->getMessage());
        }
        return [
            'success' => true,
            'worlds' => $worlds,
            'default_world' => $defaultWorld,
        ];
    }
    /**
     * Get experiments for a world.
     */
    public function getExperiments(Request $request, Server $server): array
    {
        $worldName = $request->query('world');
        if (!$worldName) {
            $worldName = $this->levelDatService->getDefaultWorldName($server);
        }
        if (!$worldName) {
            return [
                'success' => false,
                'error' => 'No world specified and no default world found',
                'experiments' => [],
            ];
        }
        try {
            $experiments = $this->levelDatService->getExperiments($server, $worldName);
            return [
                'success' => true,
                'world' => $worldName,
                'experiments' => $experiments,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get experiments: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Failed to read level.dat: ' . $e->getMessage(),
                'experiments' => [],
            ];
        }
    }
    /**
     * Update experiments for a world.
     */
    public function saveExperiments(Request $request, Server $server): array
    {
        $data = $request->validate([
            'world' => 'required|string',
            'experiments' => 'required|array',
        ]);
        $worldName = $data['world'];
        $experiments = $data['experiments'];
        try {
            $result = $this->levelDatService->updateExperiments($server, $worldName, $experiments);
            if ($result) {
                Activity::event('server:bedrock.experiments.save')
                    ->subject($server)
                    ->property('world', $worldName)
                    ->property('experiments', array_keys(array_filter($experiments)))
                    ->log('Updated Bedrock world experiments via Config Editor');
                return [
                    'success' => true,
                    'message' => 'Experiments updated successfully. Restart the server to apply changes.',
                ];
            }
            return [
                'success' => false,
                'error' => 'Failed to update experiments',
            ];
        } catch (\Exception $e) {
            Log::error('Failed to save experiments: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Failed to save experiments: ' . $e->getMessage(),
            ];
        }
    }
    /**
     * Get world settings from level.dat.
     */
    public function getWorldSettings(Request $request, Server $server): array
    {
        $worldName = $request->query('world');
        if (!$worldName) {
            $worldName = $this->levelDatService->getDefaultWorldName($server);
        }
        if (!$worldName) {
            return [
                'success' => false,
                'error' => 'No world specified and no default world found',
                'settings' => [],
            ];
        }
        try {
            $settings = $this->levelDatService->getWorldSettings($server, $worldName);
            return [
                'success' => true,
                'world' => $worldName,
                'settings' => $settings,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get world settings: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Failed to read level.dat: ' . $e->getMessage(),
                'settings' => [],
            ];
        }
    }
    /**
     * Save world settings to level.dat.
     */
    public function saveWorldSettings(Request $request, Server $server): array
    {
        $data = $request->validate([
            'world' => 'required|string',
            'settings' => 'required|array',
        ]);
        $worldName = $data['world'];
        $settings = $data['settings'];
        try {
            $result = $this->levelDatService->updateWorldSettings($server, $worldName, $settings);
            if ($result) {
                Activity::event('server:bedrock.worldsettings.save')
                    ->subject($server)
                    ->property('world', $worldName)
                    ->property('settings', array_keys($settings))
                    ->log('Updated Bedrock world settings via Config Editor');
                return [
                    'success' => true,
                    'message' => 'World settings updated successfully. Restart the server to apply changes.',
                ];
            }
            return [
                'success' => false,
                'error' => 'Failed to update world settings',
            ];
        } catch (\Exception $e) {
            Log::error('Failed to save world settings: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Failed to save world settings: ' . $e->getMessage(),
            ];
        }
    }
    /**
     * Parse server.properties content.
     */
    private function parseProperties(string $content): array
    {
        $lines = explode("\n", $content);
        $result = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || $line[0] === '#') {
                continue;
            }
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $result[$parts[0]] = $parts[1];
            }
        }
        return $result;
    }
    /**
     * Stringify properties array to server.properties format.
     */
    private function stringifyProperties(array $content): string
    {
        $result = [];
        foreach ($content as $key => $value) {
            if (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }
            $result[] = "{$key}={$value}";
        }
        return implode("\n", $result);
    }
    /**
     * Update properties file while preserving original format (comments, order, etc.)
     */
    private function updatePropertiesPreservingFormat(string $originalContent, array $newValues): string
    {
        $lines = explode("\n", $originalContent);
        $result = [];
        $updatedKeys = [];
        foreach ($lines as $line) {
            $trimmedLine = trim($line);
            if (empty($trimmedLine) || $trimmedLine[0] === '#') {
                $result[] = $line;
                continue;
            }
            $parts = explode('=', $trimmedLine, 2);
            if (count($parts) === 2) {
                $key = $parts[0];
                if (array_key_exists($key, $newValues)) {
                    $value = $newValues[$key];
                    if (is_bool($value)) {
                        $value = $value ? 'true' : 'false';
                    }
                    $result[] = "{$key}={$value}";
                    $updatedKeys[$key] = true;
                } else {
                    $result[] = $line;
                }
            } else {
                $result[] = $line;
            }
        }
        foreach ($newValues as $key => $value) {
            if (!isset($updatedKeys[$key])) {
                if (is_bool($value)) {
                    $value = $value ? 'true' : 'false';
                }
                $result[] = "{$key}={$value}";
            }
        }
        return implode("\n", $result);
    }
}
