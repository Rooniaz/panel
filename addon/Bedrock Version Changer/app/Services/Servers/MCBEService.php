<?php

namespace Pterodactyl\Services\Servers;

use GuzzleHttp\Client;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Str;
use GuzzleHttp\Exception\RequestException;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Illuminate\Support\Facades\Cache;

class MCBEService
{
    private DaemonFileRepository $fileRepository;

    public function __construct(DaemonFileRepository $fileRepository)
    {
        $this->fileRepository = $fileRepository;
    }

    public function versions()
    {
        try {
            // Check if we have cached versions
            $cachedVersions = Cache::get('mcbe:versions');
            if ($cachedVersions) {
                return $cachedVersions;
            }
            
            // Get version list from Minecraft Wiki API
            $apiUrl = "https://minecraft.wiki/api.php";
            $params = [
                "action" => "parse",
                "page" => "Bedrock Edition version history",
                "format" => "json"
            ];
            
            $response = Http::withHeaders([
                'User-Agent' => 'MinecraftVersionBot/1.0 (pterodactyl-panel) PHP/Laravel'
            ])->get($apiUrl, $params);
            
            if (!$response->successful()) {
                throw new \RuntimeException('Failed to fetch Minecraft Wiki data: ' . $response->body());
            }
            
            // Parse HTML and extract versions
            $htmlContent = $response->json()['parse']['text']['*'];
            $versions = [];
            
            // Use DOMDocument for HTML parsing
            $dom = new \DOMDocument();
            @$dom->loadHTML($htmlContent);
            $xpath = new \DOMXPath($dom);
            
            // Find all wikitable tables
            $tables = $xpath->query('//table[contains(@class, "wikitable")]');
            
            // Collect version numbers first
            $versionNumbers = [];
            foreach ($tables as $table) {
                $rows = $xpath->query('.//tr', $table);
                
                // Skip header row
                for ($i = 1; $i < $rows->length; $i++) {
                    $row = $rows->item($i);
                    $cols = $xpath->query('.//td|.//th', $row);
                    
                    if ($cols->length >= 2) {
                        $versionText = trim($cols->item(0)->textContent);
                        $versionNumber = $this->extractVersion($versionText);
                        
                        if ($versionNumber) {
                            $updateTitle = $this->extractUpdateTitle($versionText);
                            
                            // Store basic info without making additional requests
                            $versions[] = [
                                'version_number' => $versionNumber,
                                'title' => $updateTitle,
                                'server_version' => 'Loading...' // Will be populated on demand
                            ];
                        }
                    }
                }
            }
            
            // Sort by version number (newest first)
            usort($versions, function($a, $b) {
                $aParts = array_map('intval', explode('.', $a['version_number']));
                $bParts = array_map('intval', explode('.', $b['version_number']));
                
                for ($i = 0; $i < count($aParts) && $i < count($bParts); $i++) {
                    if ($aParts[$i] != $bParts[$i]) {
                        return $bParts[$i] - $aParts[$i]; // Descending order
                    }
                }
                
                return count($bParts) - count($aParts);
            });
            
            $result = ['versions' => $versions];
            
            // Cache for 24 hours
            Cache::put('mcbe:versions', $result, 60 * 60 * 24);
            
            // Return in the format expected by the frontend
            return $result;
            
        } catch (\Exception $e) {
            Log::error('Error fetching MCBE versions: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch MCBE versions: ' . $e->getMessage());
        }
    }

    public function version(string $version)
    {
        try {
            // Check if we have cached version details
            $cacheKey = "mcbe:version:{$version}";
            $cachedVersion = Cache::get($cacheKey);
            if ($cachedVersion) {
                return $cachedVersion;
            }
            
            // First, try to get the full version text from the version history page
            $updateTitle = $this->getUpdateTitleFromHistoryPage($version);
            
            $url = "https://minecraft.wiki/w/Bedrock_Edition_{$version}";
            
            $response = Http::withHeaders([
                'User-Agent' => 'MinecraftVersionBot/1.0 (pterodactyl-panel) PHP/Laravel'
            ])->get($url);
            
            if (!$response->successful()) {
                throw new \RuntimeException('Failed to fetch MCBE version details: ' . $response->body());
            }
            
            // Parse HTML and extract version details
            $htmlContent = $response->body();
            $dom = new \DOMDocument();
            @$dom->loadHTML($htmlContent);
            $xpath = new \DOMXPath($dom);
            
            // Find server version in infobox
            $serverVersion = 'N/A';
            $infobox = $xpath->query('//table[contains(@class, "infobox-rows")]')->item(0);
            
            if ($infobox) {
                $rows = $xpath->query('.//tr', $infobox);
                
                foreach ($rows as $row) {
                    $header = $xpath->query('.//th', $row)->item(0);
                    
                    if ($header && strpos($header->textContent, 'Server version') !== false) {
                        $td = $xpath->query('.//td', $row)->item(0);
                        
                        if ($td) {
                            $links = $xpath->query('.//a', $td);
                            
                            if ($links->length > 0) {
                                $serverVersion = trim($links->item($links->length - 1)->textContent);
                            }
                        }
                    }
                }
            }
            
            // Get description from content
            $description = '';
            $contentDiv = $xpath->query('//div[contains(@class, "mw-parser-output")]')->item(0);
            $toc = $xpath->query('//div[@id="toc"]', $contentDiv)->item(0);
            
            if ($contentDiv && $toc) {
                // Get paragraphs before TOC
                $paragraphs = [];
                $currentNode = $toc->previousSibling;
                
                while ($currentNode) {
                    if ($currentNode->nodeType === XML_ELEMENT_NODE && $currentNode->nodeName === 'p') {
                        // Remove sup elements
                        $sups = $xpath->query('.//sup', $currentNode);
                        foreach ($sups as $sup) {
                            $sup->parentNode->removeChild($sup);
                        }
                        
                        $text = trim($currentNode->textContent);
                        if ($text) {
                            $paragraphs[] = $text;
                        }
                    }
                    $currentNode = $currentNode->previousSibling;
                }
                
                // Reverse to get correct order
                $paragraphs = array_reverse($paragraphs);
                
                // Find first non-empty paragraph that's not an introduction
                foreach ($paragraphs as $text) {
                    if ($text && !str_starts_with($text, 'Bedrock Edition') && !str_starts_with($text, 'This article')) {
                        $description = $text;
                        break;
                    }
                }
            }
            
            // Get download URL
            $downloadUrl = $this->findDownloadUrl($version, $serverVersion);
            
            // Return in the format expected by the frontend
            $result = [
                'version_number' => $version,
                'update_title' => $updateTitle,
                'description' => $description ?: "Minecraft Bedrock Edition {$version}",
                'server_version' => $serverVersion,
                'download_url' => $downloadUrl
            ];
            
            // Cache for 24 hours
            Cache::put($cacheKey, $result, 60 * 60 * 24);
            
            return $result;
            
        } catch (\Exception $e) {
            Log::error('Error fetching MCBE version details: ' . $e->getMessage());
            throw new \RuntimeException('Failed to fetch MCBE version details: ' . $e->getMessage());
        }
    }
    
    private function getUpdateTitleFromHistoryPage(string $version): ?string
    {
        try {
            // Get version list from Minecraft Wiki API
            $apiUrl = "https://minecraft.wiki/api.php";
            $params = [
                "action" => "parse",
                "page" => "Bedrock Edition version history",
                "format" => "json"
            ];
            
            $response = Http::withHeaders([
                'User-Agent' => 'MinecraftVersionBot/1.0 (pterodactyl-panel) PHP/Laravel'
            ])->get($apiUrl, $params);
            
            if (!$response->successful()) {
                return null;
            }
            
            // Parse HTML and extract versions
            $htmlContent = $response->json()['parse']['text']['*'];
            
            // Use DOMDocument for HTML parsing
            $dom = new \DOMDocument();
            @$dom->loadHTML($htmlContent);
            $xpath = new \DOMXPath($dom);
            
            // Find all wikitable tables
            $tables = $xpath->query('//table[contains(@class, "wikitable")]');
            
            foreach ($tables as $table) {
                $rows = $xpath->query('.//tr', $table);
                
                // Skip header row
                for ($i = 1; $i < $rows->length; $i++) {
                    $row = $rows->item($i);
                    $cols = $xpath->query('.//td|.//th', $row);
                    
                    if ($cols->length >= 2) {
                        $versionText = trim($cols->item(0)->textContent);
                        $versionNumber = $this->extractVersion($versionText);
                        
                        if ($versionNumber === $version) {
                            return $this->extractUpdateTitle($versionText);
                        }
                    }
                }
            }
            
            return null;
            
        } catch (\Exception $e) {
            Log::error('Error fetching update title: ' . $e->getMessage());
            return null;
        }
    }
    
    private function extractVersion(string $versionText): ?string
    {
        if (preg_match('/\d+\.\d+\.\d+/', $versionText, $matches)) {
            return $matches[0];
        }
        
        return null;
    }
    
    private function extractUpdateTitle(string $versionText): ?string
    {
        // Look for text in parentheses, take the first one if there are multiple
        if (preg_match('/\((.*?)\)/', $versionText, $matches)) {
            $title = $matches[1];
            
            // If title contains 'Guide', 'Beta', 'Release', ignore and try next parentheses
            if (str_contains($title, 'Guide') || str_contains($title, 'Beta') || str_contains($title, 'Release')) {
                $remainingText = substr($versionText, strpos($versionText, ')') + 1);
                
                if (preg_match('/\((.*?)\)/', $remainingText, $nextMatches)) {
                    return $nextMatches[1];
                }
                
                return null;
            }
            
            return $title;
        }
        
        return null;
    }
    
    private function getServerVersion(string $versionNumber, string $versionText): string
    {
        try {
            $pageUrl = "https://minecraft.wiki/w/Bedrock_Edition_{$versionNumber}";
            
            $response = Http::withHeaders([
                'User-Agent' => 'MinecraftVersionBot/1.0 (pterodactyl-panel) PHP/Laravel'
            ])->get($pageUrl);
            
            if (!$response->successful()) {
                return 'N/A';
            }
            
            $dom = new \DOMDocument();
            @$dom->loadHTML($response->body());
            $xpath = new \DOMXPath($dom);
            
            $infobox = $xpath->query('//table[contains(@class, "infobox-rows")]')->item(0);
            
            if ($infobox) {
                $rows = $xpath->query('.//tr', $infobox);
                
                foreach ($rows as $row) {
                    $header = $xpath->query('.//th', $row)->item(0);
                    
                    if ($header && strpos($header->textContent, 'Server version') !== false) {
                        $td = $xpath->query('.//td', $row)->item(0);
                        
                        if ($td) {
                            $links = $xpath->query('.//a', $td);
                            
                            if ($links->length > 0) {
                                return trim($links->item($links->length - 1)->textContent);
                            }
                        }
                    }
                }
            }
            
            return 'N/A';
            
        } catch (\Exception $e) {
            Log::error('Error fetching server version: ' . $e->getMessage());
            return 'Error';
        }
    }
    
    private function findDownloadUrl(string $version, string $serverVersion = null): string
    {
        // Use the server version for the download URL if available
        $versionToUse = $serverVersion ?: $version;
        
        // Use the correct URL format for Minecraft Bedrock server
        return "https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-{$versionToUse}.zip";
    }
    
    private function getWingsUrl($node, $server)
    {
        $protocol = $node->scheme ?? 'https';
        return "{$protocol}://{$node->fqdn}:{$node->daemonListen}/api/servers/{$server->uuid}";
    }

    protected function makeWingsRequest($method, $url, $options = [])
    {
        $defaultOptions = [
            'verify' => false,
            'timeout' => 60,
            'connect_timeout' => 30,
            'read_timeout' => 60,
            'curl' => [
                CURLOPT_TCP_KEEPALIVE => 1,
                CURLOPT_TCP_KEEPIDLE => 60,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_TCP_NODELAY => true,
            ],
        ];

        $options = array_merge_recursive($defaultOptions, $options);
        $client = new \GuzzleHttp\Client(['verify' => false]);

        try {
            $maxRetries = 3;
            $attempt = 0;
            $lastException = null;

            while ($attempt < $maxRetries) {
                try {
                    $response = $client->request($method, $url, $options);
                    
                    if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
                        $contents = $response->getBody()->getContents();
                        return new \Illuminate\Http\Client\Response(
                            new \GuzzleHttp\Psr7\Response(
                                $response->getStatusCode(),
                                $response->getHeaders(),
                                $contents
                            )
                        );
                    }

                    throw new \RuntimeException('Wings API request failed: ' . $response->getBody()->getContents());
                } catch (\Exception $e) {
                    $lastException = $e;
                    $attempt++;
                    
                    if ($attempt < $maxRetries) {
                        Log::debug('Wings API request retry', [
                            'attempt' => $attempt,
                            'max_retries' => $maxRetries,
                            'url' => $url,
                            'method' => $method,
                            'error' => $e->getMessage()
                        ]);
                        usleep(100000 * $attempt);
                        continue;
                    }
                    
                    throw $e;
                }
            }

            throw $lastException;
        } catch (\Exception $e) {
            Log::error('Wings API request failed', [
                'error' => $e->getMessage(),
                'url' => parse_url($url, PHP_URL_PATH), // Only log the path for security
                'method' => $method,
                'status_code' => $e instanceof RequestException ? $e->getResponse()->getStatusCode() : null,
                'attempt' => $attempt ?? 1
            ]);
            throw $e;
        }
    }

    protected function listFiles(Server $server, string $directory = '/')
    {
        $node = $server->node;
        $baseUrl = $this->getWingsUrl($node, $server);

        try {
            $response = $this->makeWingsRequest('GET', $baseUrl . '/files/contents', [
                'query' => ['directory' => $directory],
                'headers' => ['Authorization' => 'Bearer ' . $node->getDecryptedKey()]
            ]);

            return $response->json();
        } catch (\Exception $e) {
            Log::warning('File listing failed', [
                'server_id' => $server->id,
                'directory' => $directory,
                'error_type' => get_class($e),
                'message' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    protected function deleteFiles(Server $server, array $files)
    {
        $node = $server->node;
        $baseUrl = $this->getWingsUrl($node, $server);
        $failedFiles = [];

        try {
            foreach ($files as $file) {
                try {
                    $this->makeWingsRequest('POST', $baseUrl . '/files/delete', [
                        'json' => [
                            'root' => '/',
                            'files' => [$file]
                        ],
                        'headers' => ['Authorization' => 'Bearer ' . $node->getDecryptedKey()]
                    ]);
                    
                    Log::debug('File deleted', [
                        'server_id' => $server->id,
                        'file' => $file
                    ]);
                    
                    usleep(100000);
                } catch (\Exception $e) {
                    $failedFiles[] = $file;
                    Log::warning('File deletion failed', [
                        'server_id' => $server->id,
                        'file' => $file,
                        'error_type' => get_class($e),
                        'message' => $e->getMessage()
                    ]);
                }
            }

            if (!empty($failedFiles)) {
                Log::error('Some files failed to delete', [
                    'server_id' => $server->id,
                    'failed_files' => $failedFiles,
                    'total_failed' => count($failedFiles),
                    'total_files' => count($files)
                ]);
            }
        } catch (\Exception $e) {
            Log::error('File deletion process failed', [
                'server_id' => $server->id,
                'error_type' => get_class($e),
                'message' => $e->getMessage(),
                'failed_files' => $failedFiles
            ]);
            throw $e;
        }
    }

    public function install(Server $server, string $version, bool $deleteFiles = false)
    {
        try {
            // Get version details
            $versionData = $this->version($version);
            
            // Check if the server version is available
            if ($versionData['server_version'] === 'N/A') {
                throw new \RuntimeException('This version does not have a server available yet.');
            }

            // Generate a unique identifier for this installation
            $identifier = substr(md5(uniqid(mt_rand(), true)), 0, 10);

            $node = $server->node;
            $downloadUrl = $versionData['download_url'];
            $filename = "bedrock-server-{$versionData['server_version']}.zip";
            $baseUrl = $this->getWingsUrl($node, $server);
            
            Log::info('MCBE version installation started', [
                'server_id' => $server->id,
                'version' => $version,
                'server_version' => $versionData['server_version'],
                'download_url' => $downloadUrl,
                'identifier' => $identifier
            ]);

            // Delete existing files if requested
            if ($deleteFiles) {
                Log::info('Deleting existing files', [
                    'server_id' => $server->id
                ]);

                try {
                    // Get list of files in root directory
                    $files = $this->fileRepository->setServer($server)->getDirectory('/');
                    
                    if (!is_array($files)) {
                        throw new \RuntimeException('Invalid response from Wings API');
                    }

                    $filesToDelete = [];
                    $protectedItems = ['worlds', 'plugins', 'server.properties', 'permissions.json', 'whitelist.json'];
                    
                    foreach ($files as $file) {
                        if (!isset($file['name']) || in_array($file['name'], $protectedItems)) {
                            continue;
                        }
                        
                        // Add full path for deletion
                        $filesToDelete[] = '/' . ltrim($file['name'], '/');
                    }

                    if (!empty($filesToDelete)) {
                        Log::info('Deleting files', [
                            'server_id' => $server->id,
                            'files' => $filesToDelete
                        ]);

                        // Delete files
                        $this->deleteFiles($server, $filesToDelete);

                        Log::info('File deletion process completed', [
                            'server_id' => $server->id,
                            'attempted_files' => $filesToDelete
                        ]);
                    } else {
                        Log::info('No files to delete', [
                            'server_id' => $server->id
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Error during file deletion', [
                        'server_id' => $server->id,
                        'error' => $e->getMessage()
                    ]);
                    throw $e;
                }
            }

            // Download the file first using Laravel's HTTP client
            $tempPath = storage_path('app/temp');
            if (!file_exists($tempPath)) {
                mkdir($tempPath, 0755, true);
            }

            $tempFile = $tempPath . '/' . $filename;
            
            try {
                Log::info('Downloading MCBE version to temp file', [
                    'server_id' => $server->id,
                    'url' => $downloadUrl,
                    'temp_file' => $tempFile
                ]);

                $response = Http::withOptions([
                    'verify' => false,
                    'sink' => $tempFile,
                    'headers' => [
                        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Accept' => '*/*',
                        'Accept-Encoding' => 'gzip, deflate, br',
                    ]
                ])->get($downloadUrl);

                if (!$response->successful()) {
                    throw new \RuntimeException('Failed to download version file: HTTP ' . $response->status());
                }

                if (!file_exists($tempFile)) {
                    throw new \RuntimeException('Failed to save downloaded file');
                }

                Log::info('Successfully downloaded MCBE version', [
                    'server_id' => $server->id,
                    'file_size' => filesize($tempFile)
                ]);

                // Upload file to Wings
                $fileContents = file_get_contents($tempFile);
                if ($fileContents === false) {
                    throw new \RuntimeException('Failed to read temporary file for upload');
                }

                Log::info('Uploading file to Wings', [
                    'server_id' => $server->id,
                    'filename' => $filename
                ]);

                $response = $this->makeWingsRequest('POST', $baseUrl . '/files/write', [
                    'query' => ['file' => $filename],
                    'headers' => [
                        'Authorization' => 'Bearer ' . $node->getDecryptedKey(),
                        'Content-Type' => 'application/octet-stream'
                    ],
                    'body' => $fileContents
                ]);

                Log::info('Successfully uploaded MCBE version to Wings', [
                    'server_id' => $server->id,
                    'filename' => $filename
                ]);

                // Extract the uploaded file
                Log::info('Extracting MCBE version file', [
                    'server_id' => $server->id,
                    'filename' => $filename
                ]);

                $this->makeWingsRequest('POST', $baseUrl . '/files/decompress', [
                    'json' => [
                        'root' => '/',
                        'file' => $filename
                    ],
                    'headers' => ['Authorization' => 'Bearer ' . $node->getDecryptedKey()]
                ]);

                Log::info('Successfully extracted MCBE version', [
                    'server_id' => $server->id,
                    'filename' => $filename
                ]);

                // Clean up the zip file
                $this->makeWingsRequest('POST', $baseUrl . '/files/delete', [
                    'json' => [
                        'root' => '/',
                        'files' => [$filename]
                    ],
                    'headers' => ['Authorization' => 'Bearer ' . $node->getDecryptedKey()]
                ]);

                // Clean up temp file
                unlink($tempFile);

                // Return a unique identifier for status tracking
                $identifier = uniqid('mcbe_', true);
                return [
                    'identifier' => $identifier,
                    'filename' => $filename,
                ];

            } catch (\Exception $e) {
                // Clean up temp file if it exists
                if (file_exists($tempFile)) {
                    unlink($tempFile);
                }
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Error during MCBE version installation', [
                'server_id' => $server->id,
                'version' => $version,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    public function checkInstallation(Server $server, string $identifier, string $filename)
    {
        try {
            $node = $server->node;
            $baseUrl = $this->getWingsUrl($node, $server);

            // Check if the file exists
            $checkResponse = $this->makeWingsRequest('GET', $baseUrl . '/files/contents', [
                'query' => ['directory' => '/'],
                'headers' => ['Authorization' => 'Bearer ' . $node->getDecryptedKey()]
            ]);

            if ($checkResponse->getStatusCode() === 200) {
                $files = $checkResponse->json();
                foreach ($files as $file) {
                    if ($file['name'] === $filename) {
                        // File exists, extract it
                        Log::info('Found uploaded file, proceeding with extraction', [
                            'server_id' => $server->id,
                            'filename' => $filename
                        ]);

                        try {
                            $unzipResponse = $this->makeWingsRequest('POST',
                                $baseUrl . '/files/decompress',
                                [
                                    'json' => [
                                        'root' => '/',
                                        'file' => $filename,
                                    ],
                                    'headers' => ['Authorization' => 'Bearer ' . $node->getDecryptedKey()]
                                ]
                            );

                            if ($unzipResponse->getStatusCode() !== 204) {
                                throw new \RuntimeException('Failed to extract version file: ' . $unzipResponse->getBody());
                            }

                            Log::info('Successfully extracted version file', [
                                'server_id' => $server->id,
                                'filename' => $filename
                            ]);

                            // Clean up the zip file
                            $this->makeWingsRequest('POST',
                                $baseUrl . '/files/delete',
                                [
                                    'json' => [
                                        'root' => '/',
                                        'files' => [$filename],
                                    ],
                                    'headers' => ['Authorization' => 'Bearer ' . $node->getDecryptedKey()]
                                ]
                            );

                            return [
                                'status' => 'completed',
                                'message' => 'Version installed successfully'
                            ];
                        } catch (\Exception $e) {
                            Log::error('Failed to extract version file', [
                                'server_id' => $server->id,
                                'filename' => $filename,
                                'error' => $e->getMessage()
                            ]);

                            return [
                                'status' => 'error',
                                'message' => 'Failed to extract version file: ' . $e->getMessage()
                            ];
                        }
                    }
                }
            }

            // File not found yet
            return [
                'status' => 'pending',
                'message' => 'Uploading file...'
            ];

        } catch (\Exception $e) {
            Log::error('Error checking MCBE installation', [
                'server_id' => $server->id,
                'identifier' => $identifier,
                'error' => $e->getMessage()
            ]);

            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    public function cancelInstallation(Server $server, string $identifier)
    {
        try {
            $node = $server->node;
            $baseUrl = $this->getWingsUrl($node, $server);

            // Cancel the download
            $this->makeWingsRequest('DELETE', $baseUrl . '/files/pull/' . $identifier, [
                'headers' => ['Authorization' => 'Bearer ' . $node->getDecryptedKey()]
            ]);

            return [
                'status' => 'cancelled',
                'message' => 'Installation cancelled successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error cancelling MCBE installation', [
                'server_id' => $server->id,
                'identifier' => $identifier,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    private function returnFinalRedirect(string $url, int $max = 5, int $used = 0, string|null $prev = null): string
    {
        if ($used >= $max) {
            return $url;
        }

        if (str_starts_with($url, '/')) {
            $host = parse_url($prev, PHP_URL_HOST);
            if (!$host) {
                throw new \RuntimeException('Failed to determine host.');
            }
            $url = sprintf('%s://%s%s', parse_url($prev, PHP_URL_SCHEME), $host, $url);
        }

        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
            ]
        ]);

        $response = get_headers($url, true, $context);
        if (!$response) {
            throw new \RuntimeException('Failed to query URL.');
        }

        $response = array_change_key_case($response, CASE_LOWER);
        if (array_key_exists('location', $response)) {
            try {
                if (is_array($response['location'])) {
                    return $this->returnFinalRedirect($response['location'][count($response['location']) - 1], $max, $used + 1, $url);
                } else {
                    return $this->returnFinalRedirect($response['location'], $max, $used + 1, $url);
                }
            } catch (\Exception $e) {
                return $url;
            }
        }

        return $url;
    }
}
