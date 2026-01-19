<?php

namespace Pterodactyl\Services\Minecraft\Mods;

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

class CurseForgeModService extends AbstractModService
{
    public const CURSEFORGE_MINECRAFT_GAME_ID = 432;
    public const CURSEFORGE_MINECRAFT_MODS_CLASS_ID = 6;

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
                    'classId' => self::CURSEFORGE_MINECRAFT_MODS_CLASS_ID,
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
                logger()->error('Received bad response when fetching CurseForge mods.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }

            return [
                'data' => [],
                'total' => 0,
            ];
        }

        $mods = [];

        $filteredMods = [];
        
        if (!empty($query)) {
            $words = explode(' ', strtolower($query));
            
            foreach ($response['data'] as $curseforgeMod) {
                $modName = strtolower($curseforgeMod['name']);
                $matchesAllWords = true;
                
                foreach ($words as $word) {
                    if (strpos($modName, $word) === false) {
                        $matchesAllWords = false;
                        break;
                    }
                }
                
                if ($matchesAllWords) {
                    $filteredMods[] = $curseforgeMod;
                }
            }
        } else {
            $filteredMods = $response['data'];
        }
        
        foreach ($filteredMods as $curseforgeMod) {
            $mods[] = [
                'id' => (string) $curseforgeMod['id'],
                'name' => $curseforgeMod['name'],
                'short_description' => $curseforgeMod['summary'],
                'url' => $curseforgeMod['links']['websiteUrl'],
                'icon_url' => $curseforgeMod['logo']['thumbnailUrl'] ?? null,
                'downloads' => $curseforgeMod['downloadCount'] ?? 0,
                'followers' => null, 
                'categories' => array_map(function ($category) {
                    return $category['name'];
                }, $curseforgeMod['categories'] ?? []),
                'author' => $curseforgeMod['authors'][0]['name'] ?? '',
                'last_updated' => $curseforgeMod['dateModified'] ?? '',
            ];
        }

        return [
            'data' => $mods,
            'total' => $response['pagination']['totalCount'] ?? count($mods),
        ];
    }

    public function versions(string $modId, ?string $modLoader = null, ?string $minecraftVersion = null): array
    {
        try {
            $response = json_decode($this->client->get('mods/' . $modId . '/files', [
                'query' => [
                    'gameVersion' => $minecraftVersion,
                    'pageSize' => 50,
                ],
            ])->getBody(), true);
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching CurseForge mod files.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
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
                'platforms' => ['Forge', 'Fabric', 'Quilt'], 
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
            
            $fileResponse = json_decode($this->client->get('mods/' . $modId . '/files/' . $versionId)->getBody(), true);
            $fileName = $fileResponse['data']['fileName'] ?? null;
            
            
            $response = json_decode($this->client->get('mods/' . $modId . '/files/' . $versionId . '/download-url')->getBody(), true);
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
                logger()->error('Received bad response when fetching CurseForge mod download details.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }
            
            throw new \Exception('You need to download this mod manually at ');
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
            logger()->error('Error following redirect for CurseForge mod', ['error' => $e->getMessage()]);
        }

        return null;
    }
    
    /**
     * Get mod details for a specific mod.
     */
    public function getModDetails(string $modId): array
    {
        try {
            $response = json_decode($this->client->get('mods/' . $modId)->getBody(), true);
            $mod = $response['data'];
        } catch (TransferException $e) {
            if ($e instanceof BadResponseException) {
                logger()->error('Received bad response when fetching CurseForge mod details.', ['response' => \GuzzleHttp\Psr7\Message::toString($e->getResponse())]);
            }
            
            return [];
        }
        
        return [
            'title' => $mod['name'] ?? '',
            'description' => $mod['summary'] ?? '',
            'icon_url' => $mod['logo']['thumbnailUrl'] ?? null,
            'downloads' => $mod['downloadCount'] ?? 0,
            'followers' => null, 
            'updated_at' => $mod['dateModified'] ?? '',
            'author' => $mod['authors'][0]['name'] ?? '',
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
}
