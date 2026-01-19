<?php

namespace Pterodactyl\Services\Minecraft\Plugins;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use GuzzleHttp\Exception\TransferException;
use GuzzleHttp\Exception\BadResponseException;

class HangarPluginService extends AbstractPluginService
{
    protected Client $client;
    public const MAX_PAGE_SIZE = 25;

    public function __construct()
    {
        parent::__construct();

        $this->client = new Client([
            'headers' => [
                'User-Agent' => $this->userAgent,
                'Accept' => 'application/json',
            ],
            'base_uri' => 'https://hangar.papermc.io/api/v1/',
        ]);
    }

    public function search(array $filters): array
    {
        $query = $filters['searchQuery'] ?? '';
        $pageSize = min($filters['pageSize'] ?? 12, self::MAX_PAGE_SIZE);
        $page = $filters['page'] ?? 1;
        $sort = $filters['sort'] ?? 'relevance';
        $pluginLoader = $filters['pluginLoader'] ?? '';

        
        
        
        switch ($sort) {
            case 'downloads':
                $sortType = '-downloads'; 
                break;
            case 'updated':
                $sortType = '-updated'; 
                break;
            case 'relevance':
            default:
                $sortType = '-stars'; 
                break;
        }

        try {
            $queryParams = [
                'limit' => $pageSize,
                'offset' => ($page - 1) * $pageSize,
                'query' => empty($query) ? null : $query,
                'sort' => $sortType
            ];
            
            
            if (!empty($pluginLoader)) {
                $queryParams['platform'] = strtoupper($pluginLoader);
            }
            
            $response = json_decode($this->client->get('projects', [
                'query' => $queryParams,
            ])->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching Hangar plugins.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
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
            
            foreach ($response['result'] as $hangarPlugin) {
                $pluginName = strtolower($hangarPlugin['name']);
                $matchesAllWords = true;
                
                foreach ($words as $word) {
                    if (strpos($pluginName, $word) === false) {
                        $matchesAllWords = false;
                        break;
                    }
                }
                
                if ($matchesAllWords) {
                    $filteredPlugins[] = $hangarPlugin;
                }
            }
        } else {
            $filteredPlugins = $response['result'];
        }
        
        foreach ($filteredPlugins as $hangarPlugin) {
            $plugins[] = [
                'id' => $hangarPlugin['name'],
                'name' => $hangarPlugin['name'],
                'short_description' => $hangarPlugin['description'],
                'url' => 'https://hangar.papermc.io/projects/' . $hangarPlugin['name'],
                'icon_url' => $hangarPlugin['avatarUrl'],
                'downloads' => $hangarPlugin['stats']['downloads'] ?? 0,
                'followers' => $hangarPlugin['stats']['stars'] ?? 0,
                'categories' => $hangarPlugin['category'] ? [$hangarPlugin['category']] : [],
                'author' => $hangarPlugin['namespace']['owner'],
                'last_updated' => $hangarPlugin['lastUpdated'] ?? '',
            ];
        }

        return [
            'data' => $plugins,
            'total' => $response['pagination']['count'],
        ];
    }

    public function versions(string $pluginId, ?string $pluginLoader = null, ?string $minecraftVersion = null): array
    {
        try {
            $response = json_decode($this->client->get('projects/' . $pluginId . '/versions', [
                'query' => [
                    'limit' => 100,
                ],
            ])->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching Hangar plugin versions.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }

            return [];
        }

        $versions = [];

        foreach ($response['result'] as $version) {
            $gameVersions = array_keys($version['platforms'] ?? []);
            
            
            if (!empty($minecraftVersion) && !in_array($minecraftVersion, $gameVersions)) {
                continue;
            }
            
            
            if (!empty($pluginLoader)) {
                $hasLoader = false;
                foreach ($version['platforms'] as $mcVersion => $platforms) {
                    if (in_array(strtolower($pluginLoader), array_map('strtolower', $platforms))) {
                        $hasLoader = true;
                        break;
                    }
                }
                
                if (!$hasLoader) {
                    continue;
                }
            }
            
            $versions[] = [
                'id' => $version['name'],
                'name' => $version['name'],
                'game_versions' => $gameVersions,
                'platforms' => array_merge(...array_values($version['platforms'] ?? [])),
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
            
            $parts = explode('-', $versionId, 2);
            if (count($parts) === 2) {
                $platform = $parts[0];
                $versionName = $parts[1];
            } else {
                
                $platform = 'PAPER';
                $versionName = $versionId;
            }
            
            
            $response = json_decode($this->client->get('projects/' . $pluginId . '/versions/' . $versionName)->getBody(), true);
            
            if (isset($response['downloads'][$platform])) {
                $downloadInfo = $response['downloads'][$platform];
                $downloadUrl = $downloadInfo['downloadUrl'] ?? $downloadInfo['externalUrl'] ?? null;
                $fileName = isset($downloadInfo['fileInfo']) ? $downloadInfo['fileInfo']['name'] : $pluginId . '-' . $versionName . '.jar';
                
                
                $redirectUrl = $this->getRedirectUrl($downloadUrl);
                if ($redirectUrl) {
                    $downloadUrl = $redirectUrl;
                }
                
                return [
                    'downloadUrl' => $downloadUrl,
                    'fileName' => $fileName,
                    'use_header' => true, 
                ];
            }
            
            
            $downloadUrl = 'https://hangar.papermc.io/api/v1/projects/' . $pluginId . '/versions/' . $versionName . '/download';
            $fileName = $pluginId . '-' . $versionName . '.jar';
            
            return [
                'downloadUrl' => $downloadUrl,
                'fileName' => $fileName,
                'use_header' => true,
            ];
        } catch (\Exception $e) {
            logger()->error('Error getting Hangar plugin download details', ['error' => $e->getMessage()]);
            
            
            $downloadUrl = 'https://hangar.papermc.io/api/v1/projects/' . $pluginId . '/versions/' . $versionId . '/download';
            $fileName = $pluginId . '-' . $versionId . '.jar';
            
            return [
                'downloadUrl' => $downloadUrl,
                'fileName' => $fileName,
                'use_header' => true,
            ];
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
            logger()->error('Error following redirect for Hangar plugin', ['error' => $e->getMessage()]);
        }

        return null;
    }
    
    /**
     * Get plugin details for a specific plugin.
     */
    public function getPluginDetails(string $pluginId): array
    {
        try {
            $response = json_decode($this->client->get('projects/' . $pluginId)->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching Hangar plugin details.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }
            
            return [];
        }
        
        return [
            'title' => $response['name'] ?? '',
            'description' => $response['description'] ?? '',
            'icon_url' => $response['avatarUrl'] ?? null,
            'downloads' => $response['stats']['downloads'] ?? 0,
            'followers' => $response['stats']['stars'] ?? 0,
            'updated_at' => $response['lastUpdated'] ?? '',
            'author' => $response['namespace']['owner'] ?? '',
        ];
    }

    /**
     * Get available Minecraft versions.
     */
    public function getMinecraftVersions(): array
    {
        $curseForgeService = app(CurseForgePluginService::class);
        return $curseForgeService->getMinecraftVersions();
    }
    
    /**
     * Get available plugin loaders.
     */
    public function getPluginLoaders(): array
    {
        return Cache::remember('hangar-plugin-loaders', 3600 * 24, function () {
            return [
                'PAPER',
                'VELOCITY',
                'WATERFALL',
            ];
        });
    }
}
