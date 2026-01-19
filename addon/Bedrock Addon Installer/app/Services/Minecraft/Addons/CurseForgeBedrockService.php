<?php
namespace Pterodactyl\Services\Minecraft\Addons;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
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
}
class CurseForgeBedrockService
{
    public const CURSEFORGE_BEDROCK_GAME_ID = 78022;
    public const CLASS_ADDONS = 4984;
    public const CLASS_MAPS = 6913;
    public const CLASS_TEXTURE_PACKS = 6929;
    public const CLASS_SCRIPTS = 6940;
    public const CLASS_SKINS = 6925;
    private const CACHE_TTL = 300;
    private Client $client;
    protected string $userAgent = 'Pterodactyl Panel/v2 (https://pterodactyl.io)';
    /**
     * CurseForgeBedrockService constructor.
     */
    public function __construct()
    {
        $apiKey = config('services.curseforge.api_key', '');
        $this->client = new Client([
            'base_uri' => 'https://api.curseforge.com/v1/',
            'headers' => [
                'Accept' => 'application/json',
                'x-api-key' => $apiKey,
                'User-Agent' => $this->userAgent,
            ],
            'verify' => true,
            'timeout' => 30,
            'connect_timeout' => 10,
        ]);
    }
    /**
     * Get class ID for addon type.
     */
    protected function getClassIdForType(?string $addonType): ?int
    {
        return match ($addonType) {
            'addon' => self::CLASS_ADDONS,
            'map' => self::CLASS_MAPS,
            'texture_pack' => self::CLASS_TEXTURE_PACKS,
            'script' => self::CLASS_SCRIPTS,
            'skin' => self::CLASS_SKINS,
            default => null,
        };
    }
    /**
     * Get addon type from class ID.
     */
    protected function getTypeFromClassId(?int $classId): string
    {
        return match ($classId) {
            self::CLASS_ADDONS => 'addon',
            self::CLASS_MAPS => 'map',
            self::CLASS_TEXTURE_PACKS => 'texture_pack',
            self::CLASS_SCRIPTS => 'script',
            self::CLASS_SKINS => 'skin',
            default => 'addon',
        };
    }
    /**
     * Search for Bedrock addons.
     *
     * @param string|null $query
     * @param int $page
     * @param int $perPage
     * @param string|null $gameVersion
     * @param string|null $addonType
     * @param string|null $sortField
     * @return array
     */
    public function searchAddons(?string $query = null, int $page = 1, int $perPage = 12, string $sortField = 'relevancy', ?string $classId = null, ?string $gameVersion = null): array
    {
        try {
            $cacheKey = 'curseforge:bedrock:search:' . md5(($query ?? '') . ":{$page}:{$perPage}:" . ($gameVersion ?? '') . ':' . ($classId ?? '') . ':' . ($sortField ?? 'popularity'));
            if (Cache::has($cacheKey)) {
                return Cache::get($cacheKey);
            }
            $query = [
                'index' => ($page - 1) * $perPage,
                'pageSize' => $perPage,
                'gameId' => self::CURSEFORGE_BEDROCK_GAME_ID,
                'searchFilter' => $query,
                'sortField' => CurseForgeSortField::Popularity->value,
                'sortOrder' => 'desc',
            ];
            if (!empty($classId)) {
                $query['classId'] = $classId;
            }
            if (!empty($gameVersion)) {
                $query['gameVersion'] = $gameVersion;
            }
            $response = $this->client->get('mods/search', [
                'query' => $query,
            ]);
            $responseData = json_decode($response->getBody()->getContents(), true);
            $addons = [];
            foreach ($responseData['data'] as $curseforgeAddon) {
                $addonClassId = $curseforgeAddon['classId'] ?? null;
                $type = $this->getTypeFromClassId($addonClassId);
                $gameVersion = '';
                $fileDate = $curseforgeAddon['dateModified'] ?? $curseforgeAddon['dateCreated'] ?? date('Y-m-d\TH:i:s\Z');
                if (!empty($curseforgeAddon['latestFilesIndexes'])) {
                    $latestFile = $curseforgeAddon['latestFilesIndexes'][0] ?? null;
                    if ($latestFile) {
                        $gameVersion = $latestFile['gameVersion'] ?? '';
                    }
                }
                $addons[] = [
                    'id' => $curseforgeAddon['id'],
                    'name' => $curseforgeAddon['name'],
                    'summary' => $curseforgeAddon['summary'],
                    'author' => $curseforgeAddon['authors'][0]['name'] ?? 'Unknown',
                    'thumbnailUrl' => $curseforgeAddon['logo']['thumbnailUrl'] ?? '',
                    'downloadCount' => $curseforgeAddon['downloadCount'],
                    'gameVersion' => $gameVersion,
                    'fileDate' => $fileDate,
                    'classId' => $addonClassId,
                    'type' => $type,
                    'url' => $curseforgeAddon['links']['websiteUrl'] ?? '',
                ];
            }
            $pagination = $responseData['pagination'] ?? [
                'totalCount' => count($addons),
                'index' => ($page - 1) * $perPage,
                'pageSize' => $perPage,
            ];
            $maximumPage = (10000 - $perPage) / $perPage + 1;
            $totalCount = min($maximumPage * $perPage, $pagination['totalCount'] ?? 0);
            $result = [
                'items' => $addons,
                'pagination' => [
                    'total' => $totalCount,
                    'count' => count($addons),
                    'perPage' => $perPage,
                    'currentPage' => $page,
                    'totalPages' => ceil($totalCount / $perPage),
                ],
            ];
            Cache::put($cacheKey, $result, self::CACHE_TTL);
            return $result;
        } catch (GuzzleException $e) {
            Log::error('Failed to search CurseForge Bedrock addons: ' . $e->getMessage());
            return [
                'items' => [],
                'pagination' => [
                    'total' => 0,
                    'count' => 0,
                    'perPage' => $perPage,
                    'currentPage' => $page,
                    'totalPages' => 0,
                ],
            ];
        }
    }
    /**
     * Get addon files.
     *
     * @param int $addonId
     * @return array
     */
    public function getAddonFiles(int $addonId): array
    {
        try {
            $response = $this->client->get("mods/{$addonId}/files", [
                'query' => [
                    'pageSize' => 50,
                    'index' => 0,
                    'sortField' => CurseForgeSortField::LastUpdated->value,
                    'sortOrder' => 'desc',
                ],
            ]);
            $responseData = json_decode($response->getBody()->getContents(), true);
            $files = $responseData['data'] ?? [];
            $items = [];
            foreach ($files as $file) {
                $gameVersion = !empty($file['gameVersions']) ? $file['gameVersions'][0] : '';
                $fileDate = '';
                if (!empty($file['fileDate'])) {
                    try {
                        $date = new \DateTime($file['fileDate']);
                        $fileDate = $date->format('Y-m-d H:i:s');
                    } catch (\Exception $e) {
                        $fileDate = $file['fileDate'];
                    }
                }
                $displayName = $file['displayName'];
                if (!empty($gameVersion) || !empty($fileDate)) {
                    if (!empty($gameVersion) && strpos($displayName, $gameVersion) === false) {
                        $displayName .= ' - ' . $gameVersion;
                    }
                }
                $items[] = [
                    'id' => $file['id'],
                    'displayName' => $displayName,
                    'fileName' => $file['fileName'],
                    'downloadUrl' => $file['downloadUrl'],
                    'gameVersion' => $gameVersion,
                    'fileDate' => $fileDate,
                    'fileSize' => $file['fileLength'] ?? 0,
                ];
            }
            return [
                'items' => $items,
            ];
        } catch (GuzzleException $e) {
            Log::error('Failed to get CurseForge Bedrock addon files: ' . $e->getMessage());
            return [
                'items' => [],
            ];
        }
    }
    /**
     * Get addon file information.
     *
     * @param int $addonId
     * @param int|null $fileId
     * @return array
     */
    public function getAddonFileInfo(int $addonId, ?int $fileId = null): array
    {
        try {
            $response = null;
            if ($addonId !== $fileId) {
                try {
                    $response = $this->client->get("mods/{$addonId}/files/{$fileId}");
                } catch (GuzzleException $e) {
                    Log::warning('Failed to get file with provided addonId: ' . $e->getMessage());
                }
            }
            if (!$response) {
                try {
                    $response = $this->client->get("mods/files/{$fileId}");
                    $responseData = json_decode($response->getBody()->getContents(), true);
                    $file = $responseData['data'] ?? null;
                    if (!$file) {
                        throw new \Exception('File not found');
                    }
                    $addonId = $file['modId'] ?? null;
                    if (!$addonId) {
                        throw new \Exception('Could not determine addon ID');
                    }
                    $response = $this->client->get("mods/{$addonId}/files/{$fileId}");
                } catch (\Exception $e) {
                    Log::warning('Failed to get file directly, trying to search for it: ' . $e->getMessage());
                    $searchResponse = $this->client->get('mods/search', [
                        'query' => [
                            'gameId' => 78022,
                            'searchFilter' => $fileId,
                            'pageSize' => 1
                        ]
                    ]);
                    $searchData = json_decode($searchResponse->getBody()->getContents(), true);
                    $addons = $searchData['data'] ?? [];
                    if (empty($addons)) {
                        throw new \Exception("Could not find addon with ID {$fileId}");
                    }
                    $addonId = $addons[0]['id'] ?? null;
                    if (!$addonId) {
                        throw new \Exception('Could not determine addon ID');
                    }
                    $response = $this->client->get("mods/{$addonId}/files/{$fileId}");
                }
            }
            $responseData = json_decode($response->getBody()->getContents(), true);
            $file = $responseData['data'] ?? null;
            if (!$file) {
                return ['error' => 'File not found'];
            }
            return [
                'id' => $file['id'],
                'displayName' => $file['displayName'],
                'fileName' => $file['fileName'],
                'downloadUrl' => $file['downloadUrl'],
                'gameVersion' => $file['gameVersions'][0] ?? '',
                'fileDate' => $file['fileDate'] ?? '',
                'fileSize' => $file['fileLength'] ?? 0,
            ];
        } catch (GuzzleException $e) {
            Log::error('Failed to get CurseForge Bedrock addon file: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }
    /**
     * Get the download URL for a specific addon version.
     */
    public function getDownloadUrl(string $addonId, string $versionId): array
    {
        try {
            $downloadUrl = "https://www.curseforge.com/api/v1/mods/{$addonId}/files/{$versionId}/download";
            return [
                'url' => $downloadUrl,
                'filename' => 'addon_' . $addonId . '_' . $versionId . '.mcaddon',
                'use_header' => true,
                'headers' => [
                    'User-Agent' => $this->userAgent,
                    'x-api-key' => config('services.curseforge.api_key', ''),
                    'Accept' => 'application/json',
                ]
            ];
        } catch (GuzzleException $e) {
            if ($e instanceof \GuzzleHttp\Exception\BadResponseException) {
                throw new \Exception('CurseForge API Error (' . $e->getResponse()->getStatusCode() . '): ' . $e->getResponse()->getBody()->getContents());
            }
            throw new \Exception('Failed to connect to CurseForge: ' . $e->getMessage());
        }
    }
    /**
     * Get addon details.
     */
    public function getAddonDetails(string $addonId): ?array
    {
        try {
            $response = $this->client->get('mods/' . $addonId);
            $responseData = json_decode($response->getBody()->getContents(), true);
            $addon = $responseData['data'];
            $type = $this->getTypeFromClassId($addon['classId'] ?? null);
            return [
                'id' => (string) $addon['id'],
                'name' => $addon['name'],
                'description' => $addon['summary'],
                'url' => $addon['links']['websiteUrl'] ?? '',
                'icon_url' => $addon['logo']['thumbnailUrl'] ?? null,
                'type' => $type,
                'downloads' => $addon['downloadCount'] ?? 0,
            ];
        } catch (GuzzleException $e) {
            Log::error('Failed to get addon details: ' . $e->getMessage());
            return null;
        }
    }
}
