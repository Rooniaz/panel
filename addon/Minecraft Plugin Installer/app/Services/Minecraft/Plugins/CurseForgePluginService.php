<?php

namespace Pterodactyl\Services\Minecraft\Plugins;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use GuzzleHttp\Exception\TransferException;
use GuzzleHttp\Exception\BadResponseException;

enum CurseForgeSortField: int
{
    case Featured = 1;
    case Popularity = 2;
    case LastUpdated = 3;
    case Name = 4;
    case Author = 5;
    case TotalDownloads = 6;
    case Category = 7;
    case GameVersion = 8;
    case EarlyAccess = 9;
    case FeaturedReleased = 10;
    case ReleasedDate = 11;
    case Rating = 12;
};

class CurseForgePluginService extends AbstractPluginService
{
    public const CURSEFORGE_MINECRAFT_GAME_ID = 432;
    public const CURSEFORGE_MINECRAFT_PLUGINS_CLASS_ID = 5;

    protected Client $client;

    public function __construct()
    {
        parent::__construct();

        $this->client = new Client([
            'headers' => [
                'User-Agent' => $this->userAgent,
                'X-API-Key' => config('services.curseforge_api_key'),
                'Accept' => 'application/json',
            ],
            'base_uri' => 'https://api.curseforge.com/v1/',
        ]);
    }

    public function search(array $filters): array
    {
        $query = $filters['searchQuery'] ?? '';
        $pageSize = $filters['pageSize'] ?? 12;
        $page = $filters['page'] ?? 1;
        $minecraftVersion = $filters['minecraftVersion'] ?? '';
        $sort = $filters['sort'] ?? 'relevance';

        $sortField = CurseForgeSortField::TotalDownloads;
        if ($sort === 'updated') {
            $sortField = CurseForgeSortField::LastUpdated;
        } elseif ($sort === 'relevance') {
            $sortField = CurseForgeSortField::Featured;
        }

        try {
            $response = json_decode($this->client->get('mods/search', [
                'query' => [
                    'gameId' => self::CURSEFORGE_MINECRAFT_GAME_ID,
                    'classId' => self::CURSEFORGE_MINECRAFT_PLUGINS_CLASS_ID,
                    'searchFilter' => $query,
                    'gameVersion' => $minecraftVersion,
                    'sortField' => $sortField->value,
                    'sortOrder' => 'desc',
                    'pageSize' => $pageSize,
                    'index' => ($page - 1) * $pageSize,
                ],
            ])->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching CurseForge plugins.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }

            return [
                'data' => [],
                'total' => 0,
            ];
        }

        $plugins = [];

        
        $filteredPlugins = [];
        
        if (!empty($query)) {
            $words = explode(' ', strtolower($query));
            
            foreach ($response['data'] as $curseforgePlugin) {
                $pluginName = strtolower($curseforgePlugin['name']);
                $matchesAllWords = true;
                
                foreach ($words as $word) {
                    if (strpos($pluginName, $word) === false) {
                        $matchesAllWords = false;
                        break;
                    }
                }
                
                if ($matchesAllWords) {
                    $filteredPlugins[] = $curseforgePlugin;
                }
            }
        } else {
            $filteredPlugins = $response['data'];
        }
        
        foreach ($filteredPlugins as $curseforgePlugin) {
            $plugins[] = [
                'id' => (string) $curseforgePlugin['id'],
                'name' => $curseforgePlugin['name'],
                'short_description' => $curseforgePlugin['summary'],
                'url' => $curseforgePlugin['links']['websiteUrl'],
                'icon_url' => $curseforgePlugin['logo']['thumbnailUrl'] ?? null,
                'downloads' => $curseforgePlugin['downloadCount'] ?? 0,
                'followers' => null, 
                'categories' => array_map(function ($category) {
                    return $category['name'];
                }, $curseforgePlugin['categories'] ?? []),
                'author' => $curseforgePlugin['authors'][0]['name'] ?? '',
                'last_updated' => $curseforgePlugin['dateModified'] ?? '',
            ];
        }

        return [
            'data' => $plugins,
            'total' => $response['pagination']['totalCount'] ?? count($plugins),
        ];
    }

    public function versions(string $pluginId, ?string $pluginLoader = null, ?string $minecraftVersion = null): array
    {
        try {
            $response = json_decode($this->client->get('mods/' . $pluginId . '/files', [
                'query' => [
                    'gameVersion' => $minecraftVersion,
                    'pageSize' => 50,
                ],
            ])->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching CurseForge plugin files.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }

            return [];
        }

        $versions = [];

        foreach ($response['data'] as $version) {
            $gameVersions = $version['gameVersions'] ?? [];
            
            
            if (!empty($minecraftVersion) && !in_array($minecraftVersion, $gameVersions)) {
                continue;
            }
            
            $versions[] = [
                'id' => (string) $version['id'],
                'name' => $version['displayName'],
                'game_versions' => $gameVersions,
                'platforms' => ['Bukkit', 'Spigot', 'Paper'], 
            ];
        }

        return $versions;
    }

    /**
     * @return array{downloadUrl: string, fileName?: string}
     */
    public function getDownloadDetails(string $pluginId, string $versionId): array
    {
        try {
            
            $fileResponse = json_decode($this->client->get('mods/' . $pluginId . '/files/' . $versionId)->getBody(), true);
            $fileName = $fileResponse['data']['fileName'] ?? null;
            
            
            $response = json_decode($this->client->get('mods/' . $pluginId . '/files/' . $versionId . '/download-url')->getBody(), true);
            $downloadUrl = $response['data'];
            
            
            
            $downloadUrl = str_replace('edge', 'mediafiles', $downloadUrl);
            
            
            $redirectUrl = $this->getRedirectUrl($downloadUrl);
            if ($redirectUrl) {
                $downloadUrl = $redirectUrl;
            }
            
            return [
                'downloadUrl' => $downloadUrl,
                'fileName' => $fileName,
                'use_header' => true, 
            ];
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching CurseForge plugin download details.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }
            
            throw new \Exception('Failed to get download details for plugin');
        }
    }
    
    /**
     * Get the final URL after following redirects
     */
    protected function getRedirectUrl(string $url): ?string
    {
        try {
            stream_context_set_default([
                'http' => [
                    'method' => 'HEAD',
                ],
            ]);
            $headers = get_headers($url, 1);
            if ($headers !== false && isset($headers['Location'])) {
                return is_array($headers['Location']) ? array_pop($headers['Location']) : $headers['Location'];
            }
        } catch (\Exception $e) {
            logger()->error('Error following redirect for CurseForge plugin', ['error' => $e->getMessage()]);
        }

        return null;
    }
    
    /**
     * Get plugin details for a specific plugin.
     */
    public function getPluginDetails(string $pluginId): array
    {
        try {
            $response = json_decode($this->client->get('mods/' . $pluginId)->getBody(), true);
            $plugin = $response['data'];
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching CurseForge plugin details.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }
            
            return [];
        }
        
        return [
            'title' => $plugin['name'] ?? '',
            'description' => $plugin['summary'] ?? '',
            'icon_url' => $plugin['logo']['thumbnailUrl'] ?? null,
            'downloads' => $plugin['downloadCount'] ?? 0,
            'followers' => null, 
            'updated_at' => $plugin['dateModified'] ?? '',
            'author' => $plugin['authors'][0]['name'] ?? '',
        ];
    }

    /**
     * Get available Minecraft versions.
     */
    public function getMinecraftVersions(): array
    {
        return Cache::remember('curseforge-minecraft-versions', 3600 * 24, function () {
            try {
                $response = json_decode($this->client->get('minecraft/version')->getBody(), true);
                $versions = [];
                
                foreach ($response['data'] as $version) {
                    
                    if (isset($version['versionString'])) {
                        $versions[] = $version['versionString'];
                    }
                }
                
                
                return $this->sortMinecraftVersions($versions);
            } catch (TransferException $e) {
                if ($e instanceof BadResponseException) {
                    logger()->error('Received bad response when fetching CurseForge game versions.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
                }
                return [];
            }
        });
    }
    
    /**
     * Get available plugin loaders.
     * 
     * Feature removed for CurseForge as requested.
     */
    public function getPluginLoaders(): array
    {
        return [];
    }
}
