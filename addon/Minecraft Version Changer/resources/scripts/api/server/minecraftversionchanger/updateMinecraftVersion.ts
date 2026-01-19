import http from '@/api/http';

export interface UpdateMinecraftVersionRequest {
    type: string;
    version: string;
    build: string;
    buildName?: string;
    deleteFiles?: boolean;
    acceptEula?: boolean;
}

export default (uuid: string, data: UpdateMinecraftVersionRequest): Promise<any> => {
    return http.post(`/api/client/servers/${uuid}/minecraft-version`, data)
        .then(response => response.data);
};
