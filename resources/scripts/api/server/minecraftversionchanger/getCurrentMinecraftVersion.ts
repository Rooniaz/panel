import http from '@/api/http';

export interface CurrentMinecraftVersionResponse {
    success: boolean;
    warning?: boolean;
    message?: string;
    current: {
        type: string;
        version: string;
        build: string;
    };
}

export default (uuid: string): Promise<CurrentMinecraftVersionResponse> => {
    return http.get(`/api/client/servers/${uuid}/minecraft-version/current`)
        .then(response => response.data);
};
