import http from '@/api/http';

export interface MinecraftForkResponse {
    success: boolean;
    forks: Record<string, ForkInfo>;
}

export interface ForkInfo {
    icon?: string;
    builds?: number;
    versions?: {
        minecraft?: number;
        project?: number;
    };
    name: string;
    color?: string;
    homepage?: string;
    deprecated?: boolean;
    experimental?: boolean;
    description?: string;
    categories?: string[];
    compatibility?: string[];
}

export default (uuid: string): Promise<MinecraftForkResponse> => {
    return http.get(`/api/client/servers/${uuid}/minecraft-version`)
        .then(response => response.data);
};
