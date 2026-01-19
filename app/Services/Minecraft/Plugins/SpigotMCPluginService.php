<?php

namespace Pterodactyl\Services\Minecraft\Plugins;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use GuzzleHttp\Exception\TransferException;
use GuzzleHttp\Exception\BadResponseException;

class SpigotMCPluginService extends AbstractPluginService
{
    protected Client $client;

    public function __construct()
    {
        parent::__construct();

        $this->client = new Client([
            'headers' => [
                'User-Agent' => $this->userAgent,
            ],
            'base_uri' => 'https://api.spiget.org/v2/',
        ]);
    }

    public function search(array $filters): array
    {
        $query = $filters['searchQuery'] ?? '';
        $pageSize = $filters['pageSize'] ?? 12;
        $page = $filters['page'] ?? 1;
        $sort = $filters['sort'] ?? 'relevance';

        $sortField = '-downloads'; 
        if ($sort === 'updated') {
            $sortField = '-updateDate';
        } elseif ($sort === 'relevance') {
            $sortField = '-rating';
        }
        
        
        $authorCache = [];

        try {
            
            if (empty($query)) {
                $endpoint = 'resources/free';
            } else {
                
                $endpoint = 'search/resources/' . urlencode($query);
                
                
                if (strpos($query, ' ') !== false) {
                    
                    $wildcardQuery = str_replace(' ', '%20', $query);
                    $endpoint = 'search/resources/' . $wildcardQuery;
                }
            }
            
            $response = json_decode($this->client->get($endpoint, [
                'query' => [
                    'size' => $pageSize,
                    'page' => $page - 1,
                    'sort' => $sortField,
                    'fields' => 'id,name,tag,icon,downloads,rating,updateDate,author,testedVersions,likes',
                ],
            ])->getBody(), true);
            
            
            if (empty($response) && strpos($query, ' ') !== false) {
                
                $firstWord = explode(' ', $query)[0];
                $endpoint = 'search/resources/' . urlencode($firstWord);
                
                $response = json_decode($this->client->get($endpoint, [
                    'query' => [
                        'size' => $pageSize * 2, 
                        'page' => 0,
                        'sort' => $sortField,
                        'fields' => 'id,name,tag,icon,downloads,rating,updateDate,author,testedVersions,likes',
                    ],
                ])->getBody(), true);
                
                
                if (!empty($response)) {
                    $words = explode(' ', strtolower($query));
                    $filteredResponse = [];
                    
                    foreach ($response as $plugin) {
                        $pluginName = strtolower($plugin['name']);
                        $matchesAllWords = true;
                        
                        foreach ($words as $word) {
                            
                            if (strpos($pluginName, $word) === false) {
                                $matchesAllWords = false;
                                break;
                            }
                        }
                        
                        if ($matchesAllWords) {
                            $filteredResponse[] = $plugin;
                        }
                    }
                    
                    
                    if (!empty($filteredResponse)) {
                        $response = array_slice($filteredResponse, 0, $pageSize);
                    }
                }
            }
            
            $total = count($response);
            if ($total >= $pageSize) {
                
                $total = $pageSize * 10; 
            }
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching SpigotMC plugins.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }

            return [
                'data' => [],
                'total' => 0,
            ];
        }

        $plugins = [];

        foreach ($response as $spigotPlugin) {
            
            $authorName = '';
            if (isset($spigotPlugin['author']['id'])) {
                $authorId = $spigotPlugin['author']['id'];
                
                
                if (!isset($authorCache[$authorId])) {
                    try {
                        
                        $authorResponse = json_decode($this->client->get('authors/' . $authorId, [
                            'query' => [
                                'fields' => 'name'
                            ]
                        ])->getBody(), true);
                        
                        $authorCache[$authorId] = $authorResponse['name'] ?? '';
                    } catch (\Exception $e) {
                        
                        $authorCache[$authorId] = '';
                    }
                }
                
                $authorName = $authorCache[$authorId];
            }
            
            $plugins[] = [
                'id' => (string) $spigotPlugin['id'],
                'name' => $spigotPlugin['name'],
                'short_description' => $this->cleanDescription($spigotPlugin['tag'] ?? ''),
                'url' => 'https://www.spigotmc.org/resources/' . $spigotPlugin['id'],
                'icon_url' => isset($spigotPlugin['icon']['url']) ? 'https://www.spigotmc.org/' . $spigotPlugin['icon']['url'] : null,
                'downloads' => $spigotPlugin['downloads'] ?? 0,
                'followers' => $spigotPlugin['likes'] ?? 0,
                'categories' => [],
                'author' => $authorName,
                'last_updated' => date('Y-m-d\TH:i:s\Z', $spigotPlugin['updateDate']),
            ];
        }

        return [
            'data' => $plugins,
            'total' => $total,
        ];
    }

    public function versions(string $pluginId, ?string $pluginLoader = null, ?string $minecraftVersion = null): array
    {
        try {
            $response = json_decode($this->client->get('resources/' . $pluginId . '/versions', [
                'query' => [
                    'size' => 1000, 
                    'sort' => '-releaseDate', 
                    'fields' => 'id,name,releaseDate,testedVersions',
                ],
            ])->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching SpigotMC plugin versions.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }

            return [];
        }

        $versions = [];

        foreach ($response as $version) {
            $gameVersions = $version['testedVersions'] ?? [];
            
            
            if (!empty($minecraftVersion) && !in_array($minecraftVersion, $gameVersions)) {
                continue;
            }
            
            $versions[] = [
                'id' => (string) $version['id'],
                'name' => $version['name'],
                'releaseDate' => $version['releaseDate'] ?? null,
                'game_versions' => $gameVersions,
                'platforms' => ['Bukkit', 'Spigot'],
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
            
            $resource = json_decode($this->client->get('resources/' . $pluginId, [
                'query' => [
                    'fields' => 'file,name,premium,external',
                ],
            ])->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching SpigotMC plugin details.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }
            
            throw new \Exception('Failed to get download details for plugin');
        }

        $fileName = $resource['name'] . '.jar';
        
        
        if (isset($resource['premium']) && $resource['premium']) {
            
            if (isset($resource['file']['externalUrl'])) {
                $downloadUrl = $resource['file']['externalUrl'];
            } else {
                
                $downloadUrl = 'https://api.spiget.org/v2/resources/' . $pluginId . '/download';
            }
        } else {
            
            $downloadUrl = 'https://api.spiget.org/v2/resources/' . $pluginId . '/download';
        }
        
        
        $redirectUrl = $this->getRedirectUrl($downloadUrl);
        if ($redirectUrl) {
            $downloadUrl = $redirectUrl;
        }

        return [
            'downloadUrl' => $downloadUrl,
            'fileName' => $fileName,
        ];
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
            logger()->error('Error following redirect for SpigotMC plugin', ['error' => $e->getMessage()]);
        }

        return null;
    }
    
    /**
     * Get plugin details for a specific plugin.
     */
    public function getPluginDetails(string $pluginId): array
    {
        try {
            $response = json_decode($this->client->get('resources/' . $pluginId, [
                'query' => [
                    'fields' => 'id,name,tag,icon,downloads,rating,updateDate,author,testedVersions,description',
                ],
            ])->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching SpigotMC plugin details.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }
            
            return [];
        }
        
        return [
            'title' => $response['name'] ?? '',
            'description' => $this->cleanDescription($response['tag'] ?? ''),
            'icon_url' => isset($response['icon']['url']) ? 'https://www.spigotmc.org/' . $response['icon']['url'] : null,
            'downloads' => $response['downloads'] ?? 0,
            'followers' => $response['rating']['count'] ?? 0,
            'updated_at' => date('Y-m-d\TH:i:s\Z', $response['updateDate']),
            'author' => $response['author']['name'] ?? '',
        ];
    }
    public function getMinecraftVersions(): array
    {
        $curseForgeService = app(CurseForgePluginService::class);
        return $curseForgeService->getMinecraftVersions();
    }
    
    /**
     * Get available plugin loaders.
     * 
     * Feature removed for SpigotMC as requested.
     */
    public function getPluginLoaders(): array
    {
        return [];
    }
    
    /**
     * Clean HTML from description.
     */
    private function cleanDescription(string $description): string
    {
        return strip_tags($description);
    }
}
