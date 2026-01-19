import http from '@/api/http';
export interface InstalledAddon {
    uuid: string;
    name: string;
    version: string | string[];
    path: string;
    has_icon: boolean;
    type: 'behavior' | 'resource';
    priority: number;
    enabled: boolean;
}
export interface World {
    name: string;
    isDefault: boolean;
}
export interface PackConfig {
    pack_id: string;
    version: number[];
}
export interface UpdatePriorityRequest {
    behavior_packs: PackConfig[];
    resource_packs: PackConfig[];
}
export interface InstalledAddonsResponse {
    addons: InstalledAddon[];
    worlds: World[];
}
export const getInstalledAddons = (uuid: string): Promise<InstalledAddonsResponse> => {
    return http.get(`/api/client/servers/${uuid}/bedrock/addons/installed`).then((response) => response.data);
};
export const deleteAddon = (uuid: string, addonType: string, addonName: string): Promise<any> => {
    return http.delete(`/api/client/servers/${uuid}/bedrock/addons/${addonType}/${addonName}`).then((response) => {
        const result = response.data;
        if (!result.success && result.error) {
            throw new Error(result.error);
        }
        return result;
    });
};
export const updateAddonPriority = (uuid: string, data: UpdatePriorityRequest): Promise<any> => {
    return http.post(`/api/client/servers/${uuid}/bedrock/addons/priority`, data).then((response) => {
        const result = response.data;
        if (!result.success && result.error) {
            throw new Error(result.error);
        }
        return result;
    });
};
export const getPackIconUrl = (uuid: string, path: string): string => {
    return `/api/client/servers/${uuid}/bedrock/addons/icon?path=${encodeURIComponent(path)}`;
};
export const setDefaultWorld = (uuid: string, worldName: string): Promise<any> => {
    return http
        .post(`/api/client/servers/${uuid}/bedrock/addons/worlds/default`, { world_name: worldName })
        .then((response) => {
            const result = response.data;
            if (!result.success && result.error) {
                throw new Error(result.error);
            }
            return result;
        });
};
export const deleteWorld = (uuid: string, worldName: string): Promise<any> => {
    return http
        .delete(`/api/client/servers/${uuid}/bedrock/addons/worlds/delete`, {
            data: { world_name: worldName },
        })
        .then((response) => {
            const result = response.data;
            if (!result.success && result.error) {
                throw new Error(result.error);
            }
            return result;
        });
};
