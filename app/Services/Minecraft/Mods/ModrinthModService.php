<?php

namespace Pterodactyl\Services\Minecraft\Mods;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use GuzzleHttp\Exception\TransferException;
use GuzzleHttp\Exception\BadResponseException;

class ModrinthModService extends AbstractModService
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
        $modLoader = $filters['modLoader'] ?? '';
        $sort = $filters['sort'] ?? 'relevance';
        $facets = '["project_type:mod"],["server_side!=unsupported"]';

        if (!empty($minecraftVersion)) {
            $facets .= ',["versions:' . $minecraftVersion . '"]';
        }

        if (!empty($modLoader)) {
            $facets .= ',["categories:' . $modLoader . '"]';
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
                logger()->error('Received bad response when fetching Modrinth mods.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }

            return [
                'data' => [],
                'total' => 0,
            ];
        }

        $mods = [];

        foreach ($response['hits'] as $modrinthMod) {
            $mods[] = [
                'id' => $modrinthMod['project_id'],
                'name' => $modrinthMod['title'],
                'short_description' => $modrinthMod['description'],
                'url' => 'https://modrinth.com/mod/' . $modrinthMod['slug'],
                'icon_url' => empty($modrinthMod['icon_url']) ? null : $modrinthMod['icon_url'],
                'downloads' => $modrinthMod['downloads'] ?? 0,
                'followers' => $modrinthMod['follows'] ?? 0,
                'categories' => $modrinthMod['categories'] ?? [],
                'author' => $modrinthMod['author'] ?? '',
                'last_updated' => $modrinthMod['date_modified'] ?? '',
            ];
        }

        return [
            'data' => $mods,
            'total' => $response['total_hits'],
        ];
    }

    public function versions(string $modId, ?string $modLoader = null, ?string $minecraftVersion = null): array
    {
        $loaders = empty($modLoader) ? $this->getModLoaders() : [$modLoader];

        try {
            $response = json_decode($this->client->get('project/' . $modId . '/version', [
                'query' => [
                    'loaders' => json_encode($loaders),
                    'game_versions' => empty($minecraftVersion) ? null : json_encode([$minecraftVersion]),
                ],
            ])->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching Modrinth mod files.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }
            
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
    public function getDownloadDetails(string $modId, string $versionId): array
    {
        try {
            $response = json_decode($this->client->get('project/' . $modId . '/version/' . $versionId)->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching Modrinth mod files.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }
            
            throw new \Exception('Failed to get download details for mod');
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
     * Get mod details for a specific mod.
     */
    public function getModDetails(string $modId): array
    {
        try {
            $response = json_decode($this->client->get('project/' . $modId)->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching Modrinth mod details.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
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
        $curseForgeService = app(CurseForgeModService::class);
        return $curseForgeService->getMinecraftVersions();
    }
    
    /**
     * Get available mod loaders.
     */
    public function getModLoaders(): array
    {
        return Cache::remember('modrinth-mod-loaders', 3600 * 24, function () {
            try {
                $response = json_decode($this->client->get('tag/loader')->getBody(), true);
                $modLoaders = [];

                foreach ($response as $loader) {
                    if (in_array('mod', $loader['supported_project_types'])) {
                        $modLoaders[] = $loader['name'];
                    }
                }

                return $modLoaders;
            } catch (TransferException $e) {
                return [];
            }
        });
    }
}
