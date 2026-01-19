<?php

namespace Pterodactyl\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Exception;

class SyncBedrockVersions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'minecraft:sync-bedrock-versions 
                            {--api-url= : API URL to fetch versions from}
                            {--file= : JSON file path containing versions}
                            {--connection= : Database connection name (default: pgsql)}
                            {--dry-run : Show what would be inserted without actually inserting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Minecraft Bedrock versions from API to minecraft_versions table';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $connection = $this->option('connection') ?: 'pgsql';
        $apiUrl = $this->option('api-url');
        $dryRun = $this->option('dry-run');

        // Check if table exists
        if (!$this->tableExists($connection)) {
            $this->error("Table 'minecraft_versions' does not exist on connection '{$connection}'");
            return 1;
        }

        // Fetch versions from API, file, or stdin
        $versions = [];
        $filePath = $this->option('file');
        
        if ($apiUrl) {
            $this->info("Fetching versions from: {$apiUrl}");
            try {
                $response = Http::timeout(30)->get($apiUrl);
                if ($response->successful()) {
                    $versions = $response->json();
                } else {
                    $this->error("Failed to fetch versions from API. Status: {$response->status()}");
                    return 1;
                }
            } catch (Exception $e) {
                $this->error("Error fetching versions: {$e->getMessage()}");
                return 1;
            }
        } elseif ($filePath) {
            $this->info("Reading versions from file: {$filePath}");
            if (!file_exists($filePath)) {
                $this->error("File not found: {$filePath}");
                return 1;
            }
            $jsonContent = file_get_contents($filePath);
            $versions = json_decode($jsonContent, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->error("Invalid JSON in file: " . json_last_error_msg());
                return 1;
            }
        } else {
            $this->info("Reading JSON from stdin...");
            $jsonContent = '';
            while (!feof(STDIN)) {
                $jsonContent .= fgets(STDIN);
            }
            if (empty(trim($jsonContent))) {
                $this->error("No input provided. Please use --api-url, --file, or pipe JSON data.");
                $this->info("Example: php artisan minecraft:sync-bedrock-versions --api-url=https://api.example.com/versions");
                $this->info("Example: php artisan minecraft:sync-bedrock-versions --file=versions.json");
                $this->info("Example: echo '[{...}]' | php artisan minecraft:sync-bedrock-versions");
                return 1;
            }
            $versions = json_decode($jsonContent, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->error("Invalid JSON input: " . json_last_error_msg());
                return 1;
            }
        }

        if (empty($versions) || !is_array($versions)) {
            $this->error('No versions found or invalid response format');
            return 1;
        }

        $this->info("Found " . count($versions) . " Bedrock versions");

        $inserted = 0;
        $updated = 0;
        $skipped = 0;

        DB::connection($connection)->beginTransaction();
        try {
            foreach ($versions as $version) {
                if (!isset($version['gameKey']) || $version['gameKey'] !== 'MINECRAFT-BEDROCK') {
                    $skipped++;
                    continue;
                }

                $externalId = $version['id'] ?? null;
                $versionName = $version['name'] ?? $version['key'] ?? null;
                $versionKey = $version['key'] ?? $versionName;

                if (!$externalId || !$versionName) {
                    $this->warn("Skipping version with missing id or name: " . json_encode($version));
                    $skipped++;
                    continue;
                }

                // Check if version already exists
                $existing = DB::connection($connection)
                    ->table('minecraft_versions')
                    ->where('external_id', $externalId)
                    ->orWhere(function ($query) use ($versionName, $versionKey) {
                        $query->where('version', $versionName)
                            ->where('edition', 'BEDROCK');
                    })
                    ->first();

                $data = [
                    'edition' => 'BEDROCK',
                    'version' => $versionName,
                    'external_id' => $externalId,
                    'impl' => 'VANILLA',
                    'build' => null,
                    'runner_version' => $version['runnerVersion'] ?? null,
                    'is_latest' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if ($existing) {
                    if (!$dryRun) {
                        DB::connection($connection)
                            ->table('minecraft_versions')
                            ->where('id', $existing->id)
                            ->update($data);
                        $updated++;
                    } else {
                        $this->line("Would update: {$versionName} (ID: {$existing->id})");
                        $updated++;
                    }
                } else {
                    if (!$dryRun) {
                        DB::connection($connection)
                            ->table('minecraft_versions')
                            ->insert($data);
                        $inserted++;
                    } else {
                        $this->line("Would insert: {$versionName}");
                        $inserted++;
                    }
                }
            }

            if ($dryRun) {
                DB::connection($connection)->rollBack();
                $this->info("\n=== DRY RUN RESULTS ===");
                $this->info("Would insert: {$inserted} versions");
                $this->info("Would update: {$updated} versions");
                $this->info("Would skip: {$skipped} versions");
            } else {
                DB::connection($connection)->commit();
                $this->info("\n=== SYNC COMPLETE ===");
                $this->info("Inserted: {$inserted} versions");
                $this->info("Updated: {$updated} versions");
                $this->info("Skipped: {$skipped} versions");
            }
        } catch (Exception $e) {
            DB::connection($connection)->rollBack();
            $this->error("Error syncing versions: {$e->getMessage()}");
            $this->error($e->getTraceAsString());
            return 1;
        }

        return 0;
    }

    /**
     * Check if the minecraft_versions table exists.
     */
    private function tableExists(string $connection): bool
    {
        try {
            $driver = DB::connection($connection)->getDriverName();
            
            if ($driver === 'pgsql') {
                $exists = DB::connection($connection)
                    ->select("SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = ? 
                        AND table_name = ?
                    )", [DB::connection($connection)->getConfig('schema') ?: 'public', 'minecraft_versions']);
                return $exists[0]->exists ?? false;
            } else {
                // For MySQL and other databases
                $schema = DB::connection($connection)->getDoctrineSchemaManager();
                return $schema->tablesExist(['minecraft_versions']);
            }
        } catch (Exception $e) {
            $this->warn("Could not check if table exists: {$e->getMessage()}");
            return false;
        }
    }
}

