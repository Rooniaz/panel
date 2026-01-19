import http from '@/api/http';

export default (uuid: string, modId: string, version: string, provider: string = 'modrinth'): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/mods/install`, {
            mod_id: modId,
            version: version,
            provider: provider,
        })
            .then(() => resolve())
            .catch(reject);
    });
};
