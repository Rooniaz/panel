<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Jobs\InstallMinecraftMapJob;
use Pterodactyl\Models\Permission;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Services\Minecraft\Maps\CurseForgeMapService;
use Pterodactyl\Services\Minecraft\Maps\MapProvider;

class MinecraftWorldController extends ClientApiController
{
    /**
     * MinecraftWorldController constructor.
     */
    public function __construct(private DaemonFileRepository $daemonFileRepository)
    {
        parent::__construct();
    }

    /**
     * Returns potential worlds in the server root directory.
     */
    public function index(Request $request, Server $server): array
    {
        if (!$request->user()->can(Permission::ACTION_FILE_READ, $server)) {
            throw new AuthorizationException();
        }

        $this->daemonFileRepository->setServer($server);

        $worlds = [];

        foreach ($this->daemonFileRepository->getDirectory('/') as $item)
        {
            if (!$item['directory']) continue;

            $isWorld = false;
            $isDefaultable = false;
            
            foreach ($this->daemonFileRepository->getDirectory($item['name']) as $di)
            {
                if ($di['name'] === 'region') {
                    $isDefaultable = true;
                }

                if ($di['name'] != 'level.dat' && $di['name'] != 'uid.dat') continue;

                $isWorld = true;
            }

            if ($isWorld) {
                $worlds[] = [
                    'name' => $item['name'],
                    'defaultable' => $isDefaultable,      
                ];
            }
        } 

        return [
            'worlds' => $worlds,
            'defaultWorld' => $this->getDefaultWorldName(),
        ];
    }

    /**
     * Returns a list of maps from a provider.
     */
    public function maps(Request $request, CurseForgeMapService $curseForgeMapService): array
    {
        $validated = $request->validate([
            'provider' => ['required', Rule::enum(MapProvider::class)],
            'search_query' => 'nullable|string',
            'page_size' => 'required|numeric|integer|max:50', // CurseForge page size max is 50
            'page' => 'required|numeric|integer|min:1',
        ]);
        $provider = MapProvider::from($validated['provider']);
        $query = $validated['search_query'] ?? '';
        $pageSize = (int) $validated['page_size'];
        $page = (int) $validated['page'];

        $data = match ($provider) {
            MapProvider::CurseForge => $curseForgeMapService->search($query, $pageSize, $page),
        };

        $maps = $data['data'];
        
        return [
            'object' => 'list',
            'data' => $maps,
            'meta' => [
                'pagination' => [
                    'total' => $data['total'],
                    'count' => count($maps),
                    'per_page' => $pageSize,
                    'current_page' => $page,
                    'total_pages' => ceil($data['total'] / $pageSize),
                    'links' => [],
                ],
            ],
        ];
    }

    /**
     * Install a remote map.
     */
    public function installMap(Request $request, Server $server, CurseForgeMapService $curseForgeMapService)
    {
        if (!$request->user()->can(Permission::ACTION_FILE_CREATE, $server)) {
            throw new AuthorizationException();
        }

        $validated = $request->validate([
            'provider' => ['required', Rule::enum(MapProvider::class)],
            'mapId' => 'required|string',
        ]);
        $provider = MapProvider::from($validated['provider']);
        $mapId = $validated['mapId'];

        InstallMinecraftMapJob::dispatch($server, $provider, $mapId);

        return response()->noContent();
    }

    /**
     * Make a map the default that is loaded upon server start.
     */
    public function makeDefault(Request $request, Server $server)
    {
        if (!$request->user()->can(Permission::ACTION_FILE_UPDATE, $server)) {
            throw new AuthorizationException();
        }

        $validated = $request->validate([
            'worldName' => 'required|string',
        ]);
        $worldName = $validated['worldName'];

        $this->daemonFileRepository->setServer($server);

        $this->setDefaultWorldName($worldName);

        return response()->noContent();
    }

    protected function getDefaultWorldName(): ?string
    {
        $currentWorldName = null;

        try {
            $properties = $this->daemonFileRepository->getContent('server.properties');

            $startWorldName = strpos($properties, 'level-name=') + strlen('level-name=');
            $endWorldName = strpos($properties, "\n", $startWorldName);
            $currentWorldName = substr($properties, $startWorldName, $endWorldName - $startWorldName);
        } catch (\Exception) {
        }

        return $currentWorldName;
    }

    protected function setDefaultWorldName($newName): void
    {
        $newProperties = '';
        try {
            $properties = $this->daemonFileRepository->getContent('server.properties');

            $startWorldName = strpos($properties, 'level-name=') + strlen('level-name=');
            $endWorldName = strpos($properties, "\n", $startWorldName);
            $newProperties = substr($properties, 0, $startWorldName) . $newName . substr($properties, $endWorldName);
        } catch (\Exception) {}

        if (empty($newProperties)) {
            $newProperties = 'level-name=' . $newName . "\n";
        }
        $this->daemonFileRepository->putContent('server.properties', $newProperties);
    }
}
