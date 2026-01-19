import http from '@/api/http';
import { BuildInfo } from './getMinecraftVersions';

export interface MinecraftBuildsResponse {
    success: boolean;
    builds: BuildInfo[];
}

export default (uuid: string, type: string, version: string): Promise<MinecraftBuildsResponse> => {
    return http.get(`/api/client/servers/${uuid}/minecraft-version/${type}/${version}`)
        .then(response => response.data);
};
