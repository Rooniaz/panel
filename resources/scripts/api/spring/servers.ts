import axios from 'axios';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

export interface CreateServerRequest {
    serverName: string;
    packageId: number;
    gameKey: string;
    gameType?: string; // vanilla, bedrock, cross, plugin, mod
    eggType?: string; // vanilla, bedrock, paper, fabric
    version: string;
    vanillaVersion?: string;
    eggId?: number; // Optional: if Spring Boot API provides it from version
    enableBackup: boolean;
    installGeyser?: boolean; // Install Geyser plugin for Cross servers
}

export interface CreateServerResponse {
    success: boolean;
    serverId: number | null;
    pterodactylId: number | null;
    message: string;
    status?: string;
}

export interface ServerStatus {
    id: number;
    serverName: string;
    status: string;
    pterodactylId: number | null;
    createdAt: string;
}

export interface ServerBilling {
    price_per_hour: number;
    started_at: string;
    paid_amount: number;
    rented_hours: number;
    package_name?: string;
}

export interface ServerWithBilling {
    id: number;
    serverName: string;
    status: string;
    edition: string;
    version: string;
    impl: string;
    package?: {
        id: number;
        name: string;
        cpu: number;
        ram: number;
        storage: number;
    };
    pterodactylIdentifier?: string; // short id (e.g. c447d8c5)
    pterodactylUuid?: string; // uuid
    pterodactylServerId?: number; // numeric id
    createdAt?: string;
    price_per_hour: number;
    paid_amount: number;
    started_at: string;
    rented_hours: number;
}

/**
 * Create a new server via Spring Boot API
 */
export const createServer = async (data: CreateServerRequest): Promise<CreateServerResponse> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    try {
        const response = await axios.post<CreateServerResponse>(`${SPRING_BOOT_API_URL}/api/servers/create`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('auth_token');
            window.location.href = '/auth/login';
            throw new Error('Authentication failed. Please login again.');
        }

        // Handle insufficient balance error (402 Payment Required)
        if (error.response?.status === 402) {
            const errorMessage = error.response?.data?.message || 'ยอดเงินไม่พอ กรุณาเติมเงินก่อนสร้าง server';
            throw new Error(errorMessage);
        }

        // Extract error message from response
        let errorMessage = error.message || 'Failed to create server. Please try again.';

        if (error.response?.data) {
            const data = error.response.data;

            // Handle different error formats
            if (data.message) {
                errorMessage = data.message;
            } else if (data.error) {
                errorMessage = data.error;
            } else if (typeof data === 'string') {
                errorMessage = data;
            }

            // Check for duplicate server name error
            if (
                errorMessage.includes('duplicate key') ||
                errorMessage.includes('uk_user_server_name') ||
                errorMessage.includes('already exists')
            ) {
                // Extract server name from error message if possible
                const serverNameMatch = errorMessage.match(/server_name[=)](\w+)/i);
                const serverName = serverNameMatch ? serverNameMatch[1] : 'this name';
                errorMessage = `ชื่อ Server "${serverName}" ถูกใช้ไปแล้ว กรุณาเลือกชื่ออื่น`;
            }

            // Check for other common errors
            if (errorMessage.includes('internal_error') || errorMessage.includes('could not execute')) {
                errorMessage = 'เกิดข้อผิดพลาดในการสร้าง Server กรุณาลองใหม่อีกครั้ง';
            }
        }

        throw new Error(errorMessage);
    }
};

/**
 * Get server status by ID
 */
export const getServerStatus = async (serverId: number): Promise<ServerStatus> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    try {
        const response = await axios.get<ServerStatus>(`${SPRING_BOOT_API_URL}/api/servers/${serverId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error: any) {
        // If endpoint doesn't exist (500 error), throw a specific error that can be caught
        if (error.response?.status === 500) {
            const errorMessage = error.response?.data?.message || error.message || '';
            if (errorMessage.includes('No static resource') || errorMessage.includes('api/servers')) {
                throw new Error('ENDPOINT_NOT_AVAILABLE');
            }
        }

        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('auth_token');
            window.location.href = '/auth/login';
            throw new Error('Authentication failed. Please login again.');
        }

        throw new Error(error.response?.data?.message || error.message || 'Failed to get server status.');
    }
};

/**
 * Get all servers for current user
 */
export const getUserServers = async (): Promise<ServerStatus[]> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    try {
        const response = await axios.get<ServerStatus[]>(`${SPRING_BOOT_API_URL}/api/servers`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('auth_token');
            window.location.href = '/auth/login';
            throw new Error('Authentication failed. Please login again.');
        }

        throw new Error(error.response?.data?.message || error.message || 'Failed to get servers.');
    }
};

/**
 * Get servers with billing info (Spring Boot)
 */
export const getServersWithBilling = async (): Promise<ServerWithBilling[]> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    try {
        const response = await axios.get<ServerWithBilling[]>(`${SPRING_BOOT_API_URL}/api/servers`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('auth_token');
            window.location.href = '/auth/login';
            throw new Error('Authentication failed. Please login again.');
        }

        throw new Error(error.response?.data?.message || error.message || 'Failed to get servers with billing.');
    }
};

/**
 * Get billing info for a server (Spring Boot)
 */
export const getServerBilling = async (serverId: number): Promise<ServerBilling> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    try {
        const response = await axios.get<ServerBilling>(`${SPRING_BOOT_API_URL}/api/servers/${serverId}/billing`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('auth_token');
            window.location.href = '/auth/login';
            throw new Error('Authentication failed. Please login again.');
        }

        throw new Error(error.response?.data?.message || error.message || 'Failed to get server billing.');
    }
};

/**
 * Helper: find Spring server by Pterodactyl ID, then get billing.
 * Returns null if not found.
 */
export const getServerBillingByPterodactylId = async (pterodactylId: number): Promise<ServerBilling | null> => {
    const servers = await getUserServers();
    const match = servers.find((s) => s.pterodactylId === pterodactylId);
    if (!match) return null;
    return getServerBilling(match.id);
};

/**
 * Delete a server by Spring Boot server ID
 */
export const deleteServer = async (serverId: number): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    try {
        await axios.delete(`${SPRING_BOOT_API_URL}/api/servers/${serverId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('auth_token');
            window.location.href = '/auth/login';
            throw new Error('Authentication failed. Please login again.');
        }

        throw new Error(error.response?.data?.message || error.message || 'Failed to delete server.');
    }
};

/**
 * Delete a server by Pterodactyl UUID
 * This will delete the server from both Spring Boot and Pterodactyl databases
 */
export const deleteServerByUuid = async (uuid: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    try {
        console.log(`[Spring Boot API] Deleting server by UUID: ${uuid}`);
        const response = await axios.delete(`${SPRING_BOOT_API_URL}/api/servers/${uuid}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });

        console.log('[Spring Boot API] Server deleted successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('[Spring Boot API] Delete failed:', error.response?.data || error.message);

        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('auth_token');
            window.location.href = '/auth/login';
            throw new Error('Authentication failed. Please login again.');
        }

        if (error.response?.status === 404) {
            throw new Error('Server not found in Spring Boot database.');
        }

        throw new Error(error.response?.data?.message || error.message || 'Failed to delete server from Spring Boot.');
    }
};
