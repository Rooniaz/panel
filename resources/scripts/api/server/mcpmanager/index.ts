import http from '@/api/http';
export interface MotdSegment {
    text: string;
    color?: string;
    formats?: string[];
}
export interface MotdData {
    raw: string;
    formatted: string;
    segments: MotdSegment[];
}
export interface PlayerInfo {
    hostname?: string;
    gametype?: string;
    version?: {
        name: string;
        protocol: number;
    };
    plugins?: string[];
    map?: string;
    numplayers?: number;
    maxplayers?: number;
    hostport?: number;
    hostip?: string;
    game_id?: string;
    ip: string;
    port: number;
    motd?: MotdData;
}
export interface Player {
    name: string;
    uuid?: string;
    avatar?: string;
    ip?: string;
    reason?: string;
    gamemode?: string;
}
export interface BannedIp {
    ip: string;
    reason: string;
}
export interface PlayerListResponse {
    online?: Player[];
    banned?: Player[];
    whitelisted?: Player[];
    banned_ips?: BannedIp[];
    ops?: Player[];
    list?: Player[];
    all?: Player[];
    max?: number;
    current?: number;
    counts?: {
        banned: number;
        whitelisted: number;
        ops: number;
        banned_ips: number;
        all: number;
    };
}
export interface FastQueryResponse {
    info: PlayerInfo;
    players: PlayerListResponse;
    server_info?: {
        is_proxy: boolean;
        proxy_servers: string[];
        version?: string;
    };
    error?: string;
}
export interface ShulkerItem {
    id: string;
    count: number;
    slot?: number;
    displayName?: string;
    enchantments?: { id: string; lvl: number }[];
}
export interface InventoryItem {
    id: string;
    count: number;
    slot: number;
    damage?: number;
    tag?: Record<string, any>;
    displayName?: string;
    enchantments?: { id: string; lvl: number }[];
    shulker_contents?: ShulkerItem[];
}
export interface PlayerStats {
    health?: number;
    food_level?: number;
    food_saturation?: number;
    xp_level?: number;
    xp_progress?: number;
    active_effects?: {
        id?: number;
        amplifier?: number;
        duration?: number;
        ambient?: boolean;
        show_particles?: boolean;
        show_icon?: boolean;
    }[];
    gamemode?: string;
    position?: { x: number; y: number; z: number } | [number, number, number] | null;
    world?: string;
    last_death?: number;
    sleep_timer?: number;
    deaths?: number;
    player_kills?: number;
    kdr?: number;
    play_time_seconds?: number;
    raw_stats_data?: {
        stats: {
            [category: string]: {
                [stat: string]: number;
            };
        };
    };
}
export interface PlayerItemsResponse {
    inventory: InventoryItem[];
    ender_chest: InventoryItem[];
    offhand: InventoryItem[];
    armor: InventoryItem[];
    error?: string;
    player_avatar?: string;
    player_stats?: PlayerStats;
}
export interface WorldInfo {
    name: string;
    display_name: string;
    has_player_data: boolean;
    has_stats: boolean;
}
export interface WorldsResponse {
    worlds: WorldInfo[];
}
export const getFastQueryData = async (uuid: string): Promise<FastQueryResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/players/fast-query`);
    return data;
};
export interface ReloadResponse {
    success: boolean;
    message: string;
    data: FastQueryResponse;
}
export const reloadServerData = async (uuid: string): Promise<ReloadResponse> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/players/reload`);
    return data;
};
export const checkAutosave = async (uuid: string): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/players/check-autosave`);
};
export interface ServerTypeInfo {
    type: string;
    is_proxy: boolean;
    proxy_servers: string[];
}
export const getServerType = async (serverUuid: string): Promise<ServerTypeInfo> => {
    const { data } = await http.get(`/api/client/servers/${serverUuid}/players/server-type`);
    return data;
};
export const getPlayerItems = async (
    serverUuid: string,
    playerUuid: string,
    world: string = 'world'
): Promise<PlayerItemsResponse> => {
    const uuid = playerUuid || 'unknown';
    const { data } = await http.get(
        `/api/client/servers/${serverUuid}/players/${uuid}/items?world=${encodeURIComponent(world)}`
    );
    return data;
};
export const getDetectedWorlds = async (serverUuid: string): Promise<WorldsResponse> => {
    const { data } = await http.get(`/api/client/servers/${serverUuid}/players/worlds`);
    return data;
};
export const updatePlayerStats = async (
    serverUuid: string,
    playerUuid: string,
    playerName: string,
    updates: Record<string, any>
): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/${playerUuid}/stats`, {
        player_name: playerName,
        ...updates,
    });
};
export const performPlayerAction = async (
    serverUuid: string,
    payload: {
        action: string;
        uuid?: string;
        name?: string;
        ip?: string;
        reason?: string;
        gamemode?: number;
    }
): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/action`, payload);
};
export const whitelistPlayer = async (
    serverUuid: string,
    playerUuid: string,
    playerName: string
): Promise<{ success: boolean; shouldReload?: boolean }> => {
    const uuid = playerUuid || 'unknown';
    await http.post(`/api/client/servers/${serverUuid}/players/${uuid}/whitelist`, { name: playerName });
    return { success: true, shouldReload: true };
};
export const unwhitelistPlayer = async (
    serverUuid: string,
    playerUuid: string,
    playerName?: string
): Promise<{ success: boolean; shouldReload?: boolean }> => {
    const uuid = playerUuid || 'unknown';
    await http.delete(`/api/client/servers/${serverUuid}/players/${uuid}/whitelist`, {
        data: playerName ? { name: playerName } : {},
    });
    return { success: true, shouldReload: true };
};
export const banPlayer = async (
    serverUuid: string,
    playerUuid: string,
    playerName: string,
    reason?: string
): Promise<{ success: boolean; shouldReload?: boolean }> => {
    const uuid = playerUuid || 'unknown';
    await http.post(`/api/client/servers/${serverUuid}/players/${uuid}/ban`, { name: playerName, reason });
    return { success: true, shouldReload: true };
};
export const unbanPlayer = async (
    serverUuid: string,
    playerUuid: string
): Promise<{ success: boolean; shouldReload?: boolean }> => {
    const uuid = playerUuid || 'unknown';
    await http.delete(`/api/client/servers/${serverUuid}/players/${uuid}/ban`);
    return { success: true, shouldReload: true };
};
export const opPlayer = async (serverUuid: string, playerUuid: string, playerName: string): Promise<void> => {
    const uuid = playerUuid || 'unknown';
    await http.post(`/api/client/servers/${serverUuid}/players/${uuid}/op`, { name: playerName });
};
export const deopPlayer = async (serverUuid: string, playerUuid: string, playerName?: string): Promise<void> => {
    const uuid = playerUuid || 'unknown';
    await http.delete(`/api/client/servers/${serverUuid}/players/${uuid}/op`, {
        data: playerName ? { name: playerName } : {},
    });
};
export const clearPlayerInventory = async (
    serverUuid: string,
    playerUuid: string,
    playerName?: string
): Promise<void> => {
    const uuid = playerUuid || 'unknown';
    await http.post(
        `/api/client/servers/${serverUuid}/players/${uuid}/clear-inventory`,
        playerName ? { name: playerName } : {}
    );
};
export const wipePlayerData = async (serverUuid: string, playerUuid: string, playerName?: string): Promise<void> => {
    const uuid = playerUuid || 'unknown';
    await http.delete(`/api/client/servers/${serverUuid}/players/${uuid}/wipe-data`, {
        data: playerName ? { player: playerName } : {},
    });
};
export const changePlayerGamemode = async (
    serverUuid: string,
    playerUuid: string,
    gamemode: number,
    playerName?: string
): Promise<void> => {
    const uuid = playerUuid || 'unknown';
    await http.post(`/api/client/servers/${serverUuid}/players/${uuid}/gamemode`, {
        gamemode,
        name: playerName,
    });
};
export const kickPlayerWithReason = async (
    serverUuid: string,
    playerName: string,
    reason: string
): Promise<{ success: boolean; shouldReload?: boolean }> => {
    await http.post(`/api/client/servers/${serverUuid}/players/kick`, { player_name: playerName, reason });
    return { success: true, shouldReload: true };
};
export const banPlayerWithReason = async (
    serverUuid: string,
    playerName: string,
    reason: string
): Promise<{ success: boolean; shouldReload?: boolean }> => {
    await http.post(`/api/client/servers/${serverUuid}/players/action`, {
        action: 'ban-with-reason',
        name: playerName,
        reason,
    });
    return { success: true, shouldReload: true };
};
export const banIpWithReason = async (serverUuid: string, ip: string, reason: string): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/action`, {
        action: 'ban-ip-with-reason',
        ip,
        reason,
    });
};
export const banPlayerIpWithReason = async (serverUuid: string, playerName: string, reason: string): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/action`, {
        action: 'ban-player-ip-with-reason',
        name: playerName,
        reason,
    });
};
export const unbanIpWithCommand = async (serverUuid: string, ip: string): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/action`, {
        action: 'unban-ip-with-command',
        ip: ip,
    });
};
export const unbanPlayerIp = async (serverUuid: string, playerName: string): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/action`, {
        action: 'unban-player-ip-with-command',
        name: playerName,
    });
};
export const whisperPlayer = async (serverUuid: string, playerName: string, message: string): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/action`, {
        action: 'whisper',
        name: playerName,
        reason: message,
    });
};
export const teleportPlayer = async (serverUuid: string, playerName: string, target: string): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/action`, {
        action: 'teleport',
        name: playerName,
        reason: target,
    });
};
export const killPlayer = async (serverUuid: string, playerName: string): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/action`, {
        action: 'kill-player',
        name: playerName,
    });
};
export const removePlayerItem = async (
    serverUuid: string,
    playerName: string,
    slot: number,
    type: 'inventory' | 'armor' | 'offhand' | 'ender_chest'
): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/action`, {
        action: 'remove-item',
        name: playerName,
        slot: slot,
        type: type,
    });
};
export const addEffect = async (
    serverUuid: string,
    uuid: string,
    playerName: string,
    effect: string,
    duration: number = 30,
    amplifier: number = 1
): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/${uuid}/add-effect`, {
        player: playerName,
        effect: effect,
        duration: duration,
        amplifier: amplifier,
    });
};
export const clearEffect = async (serverUuid: string, uuid: string, playerName: string): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/${uuid}/clear-effect`, {
        player: playerName,
    });
};
export const giveItem = async (
    serverUuid: string,
    uuid: string,
    playerName: string,
    item: string,
    amount: number = 1,
    metadata: number = 0,
    slot: number | null = null,
    type: string | null = null
): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/${uuid}/give-item`, {
        player: playerName,
        item: item,
        amount: amount,
        metadata: metadata,
        slot,
        type,
    });
};
export const banIp = async (serverUuid: string, uuid: string, playerName: string, reason: string): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/players/${uuid}/ban-ip`, {
        name: playerName,
        reason: reason,
    });
};
export const unbanIp = async (serverUuid: string, uuid: string, ip: string): Promise<void> => {
    await http.delete(`/api/client/servers/${serverUuid}/players/${uuid}/ban-ip`, {
        data: {
            ip: ip,
        },
    });
};
export const modifyPlayerStat = async (
    serverUuid: string,
    playerUuid: string,
    playerName: string,
    stat: 'health' | 'hunger' | 'experience',
    amount: number
): Promise<void> => {
    const uuid = playerUuid || 'unknown';
    await http.post(`/api/client/servers/${serverUuid}/players/${uuid}/modify-stat`, {
        player_name: playerName,
        stat,
        amount,
    });
};
export interface WikiAdvancement {
    icon_background: string;
    icon_content: string | null;
    name: string;
    description: string;
    parent: string;
    requirements: string;
    resource_location: string;
    rewards: string;
}
export interface PlayerAdvancement {
    [key: string]: {
        criteria: {
            [key: string]: string;
        };
        done: boolean;
    };
}
export const getAdvancementsFromWiki = async (serverUuid: string): Promise<WikiAdvancement[]> => {
    const { data } = await http.get(`/api/client/servers/${serverUuid}/players/advancements-wiki`);
    return data;
};
export const getPlayerAdvancements = async (serverUuid: string, playerUuid: string): Promise<PlayerAdvancement> => {
    const { data } = await http.get(`/api/client/servers/${serverUuid}/players/${playerUuid}/advancements`);
    return data;
};
