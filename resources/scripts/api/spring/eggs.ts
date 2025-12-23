import axios from 'axios';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

export interface Egg {
    id: number;
    name: string;
    description: string;
    dockerImages: Record<string, string>;
    startup?: string;
    features?: string[];
}

export interface GetEggsResponse {
    success: boolean;
    eggs: Egg[];
}

/**
 * Get available eggs for a game key and package
 */
export const getEggs = async (gameKey: string, packageId: number): Promise<GetEggsResponse> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    try {
        const response = await axios.get<GetEggsResponse>(`${SPRING_BOOT_API_URL}/api/eggs`, {
            params: {
                gameKey,
                packageId,
            },
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

        throw new Error(error.response?.data?.message || error.message || 'Failed to get eggs.');
    }
};
