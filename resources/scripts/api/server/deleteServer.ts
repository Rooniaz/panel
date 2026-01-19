import http from '@/api/http';
import { deleteServerByUuid } from '@/api/spring/servers';

export default async (uuid: string, externalId?: number | null): Promise<void> => {
    // Step 1: Delete from Spring Boot (which will also delete from Pterodactyl)
    // The Spring Boot API endpoint DELETE /api/servers/{uuid} handles both deletions
    try {
        console.log(`[Delete Server] Deleting server via Spring Boot API (UUID: ${uuid})...`);
        await deleteServerByUuid(uuid);
        console.log(`[Delete Server] ✅ Successfully deleted from Spring Boot + Pterodactyl!`);
    } catch (error: any) {
        console.error(`[Delete Server] ❌ Failed to delete via Spring Boot API:`, error);

        // Fallback: If Spring Boot deletion fails, try deleting from Pterodactyl directly
        // This ensures users can still delete servers even if Spring Boot is down
        console.warn(`[Delete Server] Attempting fallback deletion via Pterodactyl API...`);

        try {
            const config: any = {};
            if (externalId) {
                config.data = { external_id: externalId };
            }

            await http.delete(`/api/client/servers/${uuid}`, config);
            console.log(`[Delete Server] ✅ Fallback deletion successful (Pterodactyl only).`);
            console.warn(`[Delete Server] ⚠️ Note: Server may still exist in Spring Boot database.`);
        } catch (fallbackError: any) {
            console.error(`[Delete Server] ❌ Fallback deletion also failed:`, fallbackError);
            throw new Error('Failed to delete server from both Spring Boot and Pterodactyl.');
        }
    }
};
