import axios from 'axios';

export interface Hardware {
    id: string;
    name: string;
    description: string;
    priority: number;
    key: string;
}

export interface PackageContainer {
    name: string;
    description: string;
    priority: number;
    containers: string[];
    cpu: string;
    storage: string;
    ram: string;
    hourlyRate: number;
}

export interface HardwareDetail {
    id: string;
    name: string;
    description: string;
    hardwareCount: number;
    categoryContainers: {
        [categoryId: string]: PackageContainer[];
    };
}

const SPRING_BOOT_API_URL = 'http://localhost:9000';

/**
 * Get all hardware categories
 */
export const getHardwareList = async (): Promise<Hardware[]> => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .get(`${SPRING_BOOT_API_URL}/category/hw`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then((response) => {
            console.log('Hardware API response:', response.data);
            return response.data;
        })
        .catch((error) => {
            console.error('Hardware API error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                headers: error.response?.headers,
                requestHeaders: error.config?.headers,
            });

            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    // Token expired or invalid, remove it
                    localStorage.removeItem('auth_token');
                    throw new Error(
                        `Authentication failed (${error.response.status}). Token may be invalid. Please login again.`
                    );
                }
                throw new Error(
                    error.response.data?.message || error.response.data?.error || 'Failed to fetch hardware list'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Get hardware details including packages
 */
export const getHardwareDetail = async (hwId: string): Promise<HardwareDetail> => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .get(`${SPRING_BOOT_API_URL}/category/hw/${hwId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then((response) => response.data)
        .catch((error) => {
            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    // Token expired or invalid, remove it
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(
                    error.response.data?.message || error.response.data?.error || 'Failed to fetch hardware details'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};
