import http from '@/api/http';
export const executeCommand = async (serverUuid: string, command: string): Promise<void> => {
    await http.post(`/api/client/servers/${serverUuid}/command`, { command });
};
export const whisperToPlayer = async (serverUuid: string, playerName: string, message: string): Promise<void> => {
    const command = `tell ${playerName} ${message}`;
    await executeCommand(serverUuid, command);
};
export const teleportPlayerToPlayer = async (serverUuid: string, playerName: string, targetPlayer: string): Promise<void> => {
    const command = `tp ${playerName} ${targetPlayer}`;
    await executeCommand(serverUuid, command);
};
export const teleportPlayerToCoords = async (
    serverUuid: string, 
    playerName: string, 
    x: string | number, 
    y: string | number, 
    z: string | number
): Promise<void> => {
    const command = `tp ${playerName} ${x} ${y} ${z}`;
    await executeCommand(serverUuid, command);
};
