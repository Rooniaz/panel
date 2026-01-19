<?php

namespace Pterodactyl\Services\Minecraft\Plugins;

abstract class AbstractPluginService
{
    protected string $userAgent;

    public function __construct()
    {
        
        
        $this->userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0';
    }
    
    /**
     * @param array $versions Array of version strings to sort
     * @return array Sorted array of version strings
     */
    protected function sortMinecraftVersions(array $versions): array
    {
        
        $filteredVersions = array_filter($versions, function($version) {
            return !str_contains($version, 'Snapshot') && 
                   !str_contains($version, 'snapshot') && 
                   !str_contains($version, 'Pre-Release') && 
                   !str_contains($version, 'pre') &&
                   !str_contains($version, 'rc');
        });
        
        
        usort($filteredVersions, function ($a, $b) {
            return version_compare($b, $a);
        });
        
        return array_values($filteredVersions);
    }

    abstract public function search(array $filters): array;

    abstract public function versions(string $pluginId, ?string $pluginLoader = null, ?string $minecraftVersion = null): array;

    /**
     * @return array{downloadUrl: string, fileName?: string}
     */
    abstract public function getDownloadDetails(string $pluginId, string $versionId): array;
    
    /**
     * Get plugin details for a specific plugin.
     */
    abstract public function getPluginDetails(string $pluginId): array;
    
    /**
     * Get available Minecraft versions.
     */
    public function getMinecraftVersions(): array
    {
        return [];
    }
    
    /**
     * Get available plugin loaders.
     */
    public function getPluginLoaders(): array
    {
        return [];
    }
}
