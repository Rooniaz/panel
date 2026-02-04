import { Allocation } from '@/api/server/getServer';
import http from '@/api/http';
import { rawDataToServerAllocation } from '@/api/transformers';

export default async (
    uuid: string,
    id: number,
    alias: string | null,
    notes: string | null = null
): Promise<Allocation> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/network/allocations/${id}`, {
        ip_alias: alias,
        notes: notes,
    });

    return rawDataToServerAllocation(data);
};
