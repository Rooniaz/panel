import http from '@/api/http';

export interface MinecraftVersionResponse {
    success: boolean;
    versions: Record<string, VersionInfo>;
}

export interface VersionInfo {
    type: 'RELEASE' | 'SNAPSHOT';
    supported: boolean;
    java: number;
    created: string;
    builds: number;
    latest: BuildInfo;
}

export interface BuildInfo {
    id: number;
    type: string;
    projectVersionId: string | null;
    versionId: string | null;
    buildNumber: number;
    name: string;
    experimental: boolean;
    created: string | null;
    jarUrl: string | null;
    jarSize: number | null;
    jarLocation: string | null;
    zipUrl: string | null;
    zipSize: number | null;
    changes: string[];
}

export default (uuid: string, type: string): Promise<MinecraftVersionResponse> => {
    return http.get(`/api/client/servers/${uuid}/minecraft-version/${type}`)
        .then(response => response.data);
};
