import http from '@/api/http';

export default (uuid: string, pluginId: string, version: string, provider: string = 'modrinth'): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/plugins/install`, {
            plugin_id: pluginId,
            version: version,
            provider: provider,
        })
            .then(() => resolve())
            .catch(reject);
    });
};
