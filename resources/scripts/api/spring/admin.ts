import axios from 'axios';
import { Hardware, PackageContainer } from './hardware';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

/**
 * Get authentication token
 */
const getToken = (): string | null => {
    return localStorage.getItem('auth_token');
};

/**
 * Create new hardware
 */
export const createHardware = async (data: {
    name: string;
    description: string;
    priority: number;
    key: string;
}): Promise<Hardware> => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .post(`${SPRING_BOOT_API_URL}/admin/hardware`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then((response) => response.data)
        .catch((error) => {
            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(
                    error.response.data?.message || error.response.data?.error || 'Failed to create hardware'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Delete hardware
 */
export const deleteHardware = async (hwId: string): Promise<void> => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .delete(`${SPRING_BOOT_API_URL}/admin/hardware/${hwId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then(() => {
            // Success
        })
        .catch((error) => {
            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(
                    error.response.data?.message || error.response.data?.error || 'Failed to delete hardware'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Create new package
 */
export const createPackage = async (
    hwId: string,
    categoryId: string,
    data: {
        name: string;
        description: string;
        priority: number;
        cpu: string;
        ram: string;
        storage: string;
        hourlyRate: number;
    }
): Promise<PackageContainer> => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .post(`${SPRING_BOOT_API_URL}/admin/hardware/${hwId}/category/${categoryId}/package`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then((response) => response.data)
        .catch((error) => {
            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(
                    error.response.data?.message || error.response.data?.error || 'Failed to create package'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Delete package
 */
export const deletePackage = async (hwId: string, categoryId: string, packageName: string): Promise<void> => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .delete(
            `${SPRING_BOOT_API_URL}/admin/hardware/${hwId}/category/${categoryId}/package/${encodeURIComponent(
                packageName
            )}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )
        .then(() => {
            // Success
        })
        .catch((error) => {
            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(
                    error.response.data?.message || error.response.data?.error || 'Failed to delete package'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};
