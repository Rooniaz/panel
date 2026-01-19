<?php
namespace Pterodactyl\Http\Controllers\Api\Client\Servers\MCPManager;
use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Servers\MCPManager\MCPQueryService;
use Pterodactyl\Services\Servers\MCPManager\MCPActionService;
use Pterodactyl\Http\Requests\Api\Client\Servers\MCPManager\MCPActionRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\MCPManager\QueryRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
class MCPQueryController extends Controller
{
    /**
     * @var MCPQueryService
     */
    private $mcpQueryService;
    /**
     * @var MCPActionService
     */
    private $mcpActionService;
    /**
     * MCPQueryController constructor.
     *
     * @param MCPQueryService $mcpQueryService
     * @param MCPActionService $mcpActionService
     */
    public function __construct(
        MCPQueryService $mcpQueryService,
        MCPActionService $mcpActionService
    ) {
        $this->mcpQueryService = $mcpQueryService;
        $this->mcpActionService = $mcpActionService;
    }
    /**
     * Get fast query data for a server.
     *
     * @param Request $request
     * @param Server $server
     * @return JsonResponse
     */
    public function index(Request $request, Server $server): JsonResponse
    {
        try {
            $data = $this->mcpQueryService->getFastQueryData($server);
            return new JsonResponse($data);
        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => $e->getMessage(),
                'info' => [],
                'players' => [
                    'online' => [],
                    'all' => [],
                    'banned' => [],
                    'whitelisted' => [],
                    'ops' => [],
                    'banned_ips' => [],
                ],
            ]);
        }
    }
    /**
     * Reload server data.
     *
     * @param Request $request
     * @param Server $server
     * @return JsonResponse
     */
    public function reload(Request $request, Server $server): JsonResponse
    {
        try {
            $this->mcpQueryService->clearCache($server);
            $data = $this->mcpQueryService->getFastQueryData($server);
            return new JsonResponse([
                'success' => true,
                'message' => 'Server data reloaded successfully.',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => [
                    'error' => $e->getMessage(),
                    'info' => [],
                    'players' => [
                        'online' => [],
                        'all' => [],
                        'banned' => [],
                        'whitelisted' => [],
                        'ops' => [],
                        'banned_ips' => [],
                    ],
                ],
            ]);
        }
    }
    /**
     * Get server type information.
     *
     * @param Request $request
     * @param Server $server
     * @return JsonResponse
     */
    public function getServerType(Request $request, Server $server): JsonResponse
    {
        try {
            $data = $this->mcpQueryService->getServerType($server);
            return new JsonResponse($data);
        } catch (\Exception $e) {
            return new JsonResponse([
                'type' => 'unknown',
                'is_proxy' => false,
                'proxy_servers' => [],
            ]);
        }
    }
    /**
     * Get player items.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function getPlayerItems(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $world = $request->query('world', 'world');
            $data = $this->mcpActionService->getPlayerItems($server, $uuid, $world);
            return new JsonResponse($data);
        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => $e->getMessage(),
                'inventory' => [],
                'ender_chest' => [],
                'armor' => [],
                'offhand' => [],
            ]);
        }
    }
    /**
     * Get detected worlds.
     *
     * @param Request $request
     * @param Server $server
     * @return JsonResponse
     */
    public function getDetectedWorlds(Request $request, Server $server): JsonResponse
    {
        try {
            $worlds = $this->mcpActionService->getDetectedWorlds($server);
            return new JsonResponse(['worlds' => $worlds]);
        } catch (\Exception $e) {
            return new JsonResponse(['worlds' => []]);
        }
    }
    /**
     * Update player stats.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function updatePlayerStats(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $playerName = $request->input('player_name');
            $updates = $request->except(['player_name']);
            $this->mcpActionService->updatePlayerStats($server, $uuid, $playerName, $updates);
            return new JsonResponse([
                'success' => true,
                'message' => 'Player stats updated successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Perform player action.
     *
     * @param MCPActionRequest $request
     * @param Server $server
     * @return JsonResponse
     */
    public function performAction(MCPActionRequest $request, Server $server): JsonResponse
    {
        try {
            $action = $request->input('action');
            $uuid = $request->input('uuid');
            $name = $request->input('name');
            $ip = $request->input('ip');
            $reason = $request->input('reason');
            $gamemode = $request->input('gamemode');
            $slot = $request->input('slot');
            $type = $request->input('type');
            switch ($action) {
                case 'ban-with-reason':
                    $this->mcpActionService->banPlayerWithReason($server, $name, $reason ?? '');
                    break;
                case 'ban-ip-with-reason':
                    $this->mcpActionService->banIpWithReason($server, $ip, $reason ?? '');
                    break;
                case 'ban-player-ip-with-reason':
                    $this->mcpActionService->banPlayerIpWithReason($server, $name, $reason ?? '');
                    break;
                case 'unban-ip-with-command':
                    $this->mcpActionService->unbanIp($server, $ip);
                    break;
                case 'unban-player-ip-with-command':
                    $this->mcpActionService->unbanPlayerIp($server, $name);
                    break;
                case 'whisper':
                    $this->mcpActionService->whisperPlayer($server, $name, $reason ?? '');
                    break;
                case 'teleport':
                    $this->mcpActionService->teleportPlayer($server, $name, $reason ?? '');
                    break;
                case 'kill-player':
                    $this->mcpActionService->killPlayer($server, $name);
                    break;
                case 'remove-item':
                    $this->mcpActionService->removePlayerItem($server, $name, $slot, $type);
                    break;
                default:
                    throw new DisplayException('Invalid action specified.');
            }
            return new JsonResponse([
                'success' => true,
                'message' => 'Action performed successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Add player to whitelist.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function whitelistPlayer(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $name = $request->input('name');
            $this->mcpActionService->whitelistPlayer($server, $uuid, $name);
            return new JsonResponse([
                'success' => true,
                'message' => 'Player added to whitelist successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Remove player from whitelist.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function unwhitelistPlayer(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $name = $request->input('name');
            $this->mcpActionService->unwhitelistPlayer($server, $uuid, $name);
            return new JsonResponse([
                'success' => true,
                'message' => 'Player removed from whitelist successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Ban a player.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function banPlayer(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $name = $request->input('name');
            $reason = $request->input('reason');
            $this->mcpActionService->banPlayer($server, $uuid, $name, $reason);
            return new JsonResponse([
                'success' => true,
                'message' => 'Player banned successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Unban a player.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function unbanPlayer(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $this->mcpActionService->unbanPlayer($server, $uuid);
            return new JsonResponse([
                'success' => true,
                'message' => 'Player unbanned successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Add player to operators.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function opPlayer(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $name = $request->input('name');
            $this->mcpActionService->opPlayer($server, $uuid, $name);
            return new JsonResponse([
                'success' => true,
                'message' => 'Player added to operators successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Remove player from operators.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function deopPlayer(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $name = $request->input('name');
            $this->mcpActionService->deopPlayer($server, $uuid, $name);
            return new JsonResponse([
                'success' => true,
                'message' => 'Player removed from operators successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Clear player inventory.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function clearInventory(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $name = $request->input('name');
            $this->mcpActionService->clearPlayerInventory($server, $uuid, $name);
            return new JsonResponse([
                'success' => true,
                'message' => 'Player inventory cleared successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Wipe player data.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function wipePlayerData(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $name = $request->input('player');
            $this->mcpActionService->wipePlayerData($server, $uuid, $name);
            return new JsonResponse([
                'success' => true,
                'message' => 'Player data wiped successfully. All player files have been removed.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Change player gamemode.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function changeGamemode(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $name = $request->input('name');
            $gamemode = (int) $request->input('gamemode');
            $this->mcpActionService->changePlayerGamemode($server, $uuid, $gamemode, $name);
            return new JsonResponse([
                'success' => true,
                'message' => 'Player gamemode changed successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Kick player with reason.
     *
     * @param Request $request
     * @param Server $server
     * @return JsonResponse
     */
    public function kickPlayer(Request $request, Server $server): JsonResponse
    {
        try {
            $name = $request->input('player_name');
            $reason = $request->input('reason');
            $this->mcpActionService->kickPlayerWithReason($server, $name, $reason ?? '');
            return new JsonResponse([
                'success' => true,
                'message' => 'Player kicked successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Ban an IP address.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function banIp(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $name = $request->input('name');
            $reason = $request->input('reason');
            $this->mcpActionService->banIp($server, $uuid, $name, $reason);
            return new JsonResponse([
                'success' => true,
                'message' => 'IP banned successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Unban an IP address.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function unbanIp(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $ip = $request->input('ip');
            $this->mcpActionService->unbanIp($server, $uuid, $ip);
            return new JsonResponse([
                'success' => true,
                'message' => 'IP unbanned successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Give an item to a player.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function giveItem(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $player = $request->input('player');
            $item = $request->input('item');
            $amount = $request->input('amount', 1);
            $metadata = $request->input('metadata', 0);
            $slot = $request->input('slot');
            $type = $request->input('type');
            $this->mcpActionService->giveItem($server, $uuid, $player, $item, $amount, $metadata, $slot, $type);
            return new JsonResponse([
                'success' => true,
                'message' => 'Item given successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Add an effect to a player.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function addEffect(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $player = $request->input('player');
            $effect = $request->input('effect');
            $duration = $request->input('duration', 30);
            $amplifier = $request->input('amplifier', 1);
            $this->mcpActionService->addEffect($server, $uuid, $player, $effect, $duration, $amplifier);
            return new JsonResponse([
                'success' => true,
                'message' => 'Effect added successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Clear all effects from a player.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function clearEffect(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $player = $request->input('player');
            $this->mcpActionService->clearEffect($server, $uuid, $player);
            return new JsonResponse([
                'success' => true,
                'message' => 'Effects cleared successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Modify a player's stat.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function modifyPlayerStat(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $playerName = $request->input('player_name');
            $stat = $request->input('stat');
            $amount = $request->input('amount');
            $this->mcpActionService->modifyPlayerStat($server, $uuid, $playerName, $stat, $amount);
            return new JsonResponse([
                'success' => true,
                'message' => 'Player stat modified successfully.',
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Checks and applies the autosave setting.
     *
     * @param \Pterodactyl\Http\Requests\Api\Client\ClientApiRequest $request
     * @param \Pterodactyl\Models\Server $server
     * @return \Illuminate\Http\Response
     */
    public function checkAutosave(ClientApiRequest $request, Server $server)
    {
        $this->mcpQueryService->checkAndApplyAutosave($server);
        return response()->noContent();
    }
    /**
     * Get player advancements.
     *
     * @param Request $request
     * @param Server $server
     * @param string $uuid
     * @return JsonResponse
     */
    public function getPlayerAdvancements(Request $request, Server $server, string $uuid): JsonResponse
    {
        try {
            $data = $this->mcpQueryService->getPlayerAdvancements($server, $uuid);
            return new JsonResponse($data);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }
    /**
     * Get advancements from the Minecraft Wiki.
     *
     * @return JsonResponse
     */
    public function getAdvancementsFromWiki(): JsonResponse
    {
        try {
            $advancements = Cache::remember('minecraft_advancements', 1440, function () {
                $response = Http::timeout(30)->get('https://minecraft.wiki/w/Advancement');
                if (!$response->successful()) {
                    throw new \Exception('Failed to fetch advancements from wiki');
                }
                $html = $response->body();
                $advancements = [];
                $dom = new \DOMDocument();
                libxml_use_internal_errors(true);
                $dom->loadHTML($html);
                libxml_clear_errors();
                $xpath = new \DOMXPath($dom);
                $tables = $xpath->query("//table[contains(@class, 'wikitable')]");
                foreach ($tables as $table) {
                    $rows = $xpath->query(".//tbody/tr", $table);
                    foreach ($rows as $row) {
                        $cells = $xpath->query(".//td", $row);
                        if ($cells->length > 6) {
                            try {
                                $iconNodes = $xpath->query(".//img", $cells->item(0));
                                $icon_background = '/images/Advancement-plain-raw.png?8e4c1';
                                $icon_content = null;
                                if ($iconNodes->length > 0) {
                                    $icon_background = $iconNodes->item(0)->getAttribute('src');
                                    if ($iconNodes->length > 1) {
                                        $icon_content = $iconNodes->item(1)->getAttribute('src');
                                    }
                                }
                                if (strpos($icon_background, 'https://') !== 0) {
                                    $icon_background = 'https://minecraft.wiki' . $icon_background;
                                }
                                if ($icon_content && strpos($icon_content, 'https://') !== 0) {
                                    $icon_content = 'https://minecraft.wiki' . $icon_content;
                                }
                                $advancementName = $cells->item(1)->textContent ?? '';
                                $inGameDescription = $cells->item(2)->C14N() ?? '';
                                $parent = $cells->item(3)->textContent ?? '';
                                $actualRequirements = $cells->item(4)->C14N() ?? '';
                                $resourceLocation = $cells->item(5)->textContent ?? '';
                                $rewards = $cells->item(6)->textContent ?? '';
                                $advancements[] = [
                                    'icon_background' => $icon_background,
                                    'icon_content' => $icon_content,
                                    'name' => trim($advancementName),
                                    'description' => trim($inGameDescription),
                                    'parent' => trim($parent),
                                    'requirements' => trim($actualRequirements),
                                    'resource_location' => trim($resourceLocation),
                                    'rewards' => trim($rewards),
                                ];
                            } catch (\Exception $e) {
                                continue;
                            }
                        }
                    }
                }
                return $advancements;
            });
            return new JsonResponse($advancements);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Failed to fetch advancements from wiki: ' . $e->getMessage()], 500);
        }
    }
}
