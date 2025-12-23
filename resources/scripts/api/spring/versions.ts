import axios from 'axios';

export interface GameVersion {
    id: string;
    name: string;
    key: string;
    gameKey: string;
    runnerVersion: string;
    eggId?: number; // Egg ID from game_egg_mapping
}

const SPRING_BOOT_API_URL = 'http://localhost:9000';

/**
 * Get game versions for a specific game type
 */
export default async (gameKey: string): Promise<GameVersion[]> => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .post(
            `${SPRING_BOOT_API_URL}/version/info/${gameKey}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )
        .then((response) => response.data)
        .catch((error) => {
            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    // Token expired or invalid, remove it
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(
                    error.response.data?.message || error.response.data?.error || 'Failed to fetch game versions'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};
