<?php

namespace Pterodactyl\Services\Minecraft\Plugins;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use GuzzleHttp\Exception\TransferException;
use GuzzleHttp\Exception\BadResponseException;

class ModrinthPluginService extends AbstractPluginService
{
    protected Client $client;

    public function __construct()
    {
        parent::__construct();

        $this->client = new Client([
            'headers' => [
                'User-Agent' => $this->userAgent,
            ],
            'base_uri' => 'https://api.modrinth.com/v2/',
        ]);
    }

    public function search(array $filters): array
    {
        $query = $filters['searchQuery'] ?? '';
        $pageSize = $filters['pageSize'] ?? 12;
        $page = $filters['page'] ?? 1;
        $minecraftVersion = $filters['minecraftVersion'] ?? '';
        $pluginLoader = $filters['pluginLoader'] ?? '';
        $sort = $filters['sort'] ?? 'relevance';
        $facets = '["project_type:plugin"],["server_side!=unsupported"]';

        if (!empty($minecraftVersion)) {
            $facets .= ',["versions:' . $minecraftVersion . '"]';
        }

        if (!empty($pluginLoader)) {
            $facets .= ',["categories:' . $pluginLoader . '"]';
        }

        $index = 'relevance';
        if ($sort === 'downloads') {
            $index = 'downloads';
        } elseif ($sort === 'updated') {
            $index = 'updated';
        }

        try {
            $response = json_decode($this->client->get('search', [
                'query' => [
                    'offset' => ($page - 1) * $pageSize,
                    'facets' => '[ ' . $facets . ' ]',
                    'limit' => $pageSize,
                    'query' => $query,
                    'index' => $index,
                ],
            ])->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching Modrinth plugins.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }

            return [
                'data' => [],
                'total' => 0,
            ];
        }

        $plugins = [];

        foreach ($response['hits'] as $modrinthPlugin) {
            $plugins[] = [
                'id' => $modrinthPlugin['project_id'],
                'name' => $modrinthPlugin['title'],
                'short_description' => $modrinthPlugin['description'],
                'url' => 'https://modrinth.com/plugin/' . $modrinthPlugin['slug'],
                'icon_url' => empty($modrinthPlugin['icon_url']) ? null : $modrinthPlugin['icon_url'],
                'downloads' => $modrinthPlugin['downloads'] ?? 0,
                'followers' => $modrinthPlugin['follows'] ?? 0,
                'categories' => $modrinthPlugin['categories'] ?? [],
                'author' => $modrinthPlugin['author'] ?? '',
                'last_updated' => $modrinthPlugin['date_modified'] ?? '',
            ];
        }

        return [
            'data' => $plugins,
            'total' => $response['total_hits'],
        ];
    }

    public function versions(string $pluginId, ?string $pluginLoader = null, ?string $minecraftVersion = null): array
    {
        $queryParams = [];
        
        // Only filter by loader if explicitly provided
        if (!empty($pluginLoader)) {
            $queryParams['loaders'] = json_encode([$pluginLoader]);
        }
        
        // Only filter by minecraft version if explicitly provided
        if (!empty($minecraftVersion)) {
            $queryParams['game_versions'] = json_encode([$minecraftVersion]);
        }

        try {
            $response = json_decode($this->client->get('project/' . $pluginId . '/version', [
                'query' => $queryParams,
            ])->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                $statusCode = $e->getResponse()->getStatusCode();
                $responseBody = $e->getResponse()->getBody()->getContents();
                logger()->error('Received bad response when fetching Modrinth plugin versions.', [
                    'status_code' => $statusCode,
                    'response' => $responseBody,
                    'plugin_id' => $pluginId,
                ]);
            } else {
                logger()->error('Transfer exception when fetching Modrinth plugin versions.', [
                    'message' => $e->getMessage(),
                    'plugin_id' => $pluginId,
                ]);
            }
            
            return [];
        }

        if (!is_array($response)) {
            logger()->error('Modrinth API returned unexpected response structure.', [
                'plugin_id' => $pluginId,
                'response' => $response,
            ]);
            return [];
        }

        $versions = [];

        foreach ($response as $version) {
            $versions[] = [
                'id' => $version['id'],
                'name' => $version['name'],
                'game_versions' => $version['game_versions'] ?? [],
                'platforms' => $version['loaders'] ?? [],
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
            $response = json_decode($this->client->get('project/' . $pluginId . '/version/' . $versionId)->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching Modrinth plugin files.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }
            
            throw new \Exception('Failed to get download details for plugin');
        }

        $file = $response['files'][0];
        $downloadUrl = $file['url'];
        $fileName = $file['filename'] ?? null;

        return [
            'downloadUrl' => $downloadUrl,
            'fileName' => $fileName,
        ];
    }
    
    /**
     * Get plugin details for a specific plugin.
     */
    public function getPluginDetails(string $pluginId): array
    {
        try {
            $response = json_decode($this->client->get('project/' . $pluginId)->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching Modrinth plugin details.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }
            
            return [];
        }
        
        return [
            'title' => $response['title'] ?? '',
            'description' => $response['description'] ?? '',
            'icon_url' => $response['icon_url'] ?? null,
            'downloads' => $response['downloads'] ?? 0,
            'followers' => $response['follows'] ?? 0,
            'updated_at' => $response['updated'] ?? '',
            'author' => $response['author'] ?? '',
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
        return Cache::remember('modrinth-plugin-loaders', 3600 * 24, function () {
            try {
                $response = json_decode($this->client->get('tag/loader')->getBody(), true);
                $pluginLoaders = [];

                foreach ($response as $loader) {
                    if (in_array('plugin', $loader['supported_project_types'])) {
                        $pluginLoaders[] = $loader['name'];
                    }
                }

                return $pluginLoaders;
            } catch (TransferException $e) {
                return [];
            }
        });
    }
}
