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
 * Generate UUID v4
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Create new package
 * @param categoryId - Optional. If not provided, Frontend will generate a new categoryId automatically
 */
export const createPackage = async (
    hwId: string,
    categoryId: string | null,
    data: {
        name: string;
        description: string;
        priority: number;
        cpu: string;
        ram: string;
        storage: string;
        hourlyRate: number;
        capacity?: number | null;
    }
): Promise<PackageContainer> => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    // ✅ ถ้าไม่มี categoryId ให้ generate UUID อัตโนมัติ
    const finalCategoryId = categoryId || generateUUID();

    // Map hourlyRate to price for Spring Boot API
    const requestData = {
        name: data.name,
        description: data.description,
        priority: data.priority,
        cpu: data.cpu,
        ram: data.ram,
        storage: data.storage,
        price: data.hourlyRate, // Spring Boot API expects 'price' not 'hourlyRate'
        hourlyRate: data.hourlyRate, // Keep both for compatibility
        capacity: data.capacity,
    };

    // ✅ ใช้ endpoint ที่มี categoryId เสมอ (ใช้ UUID ที่ generate แล้ว)
    const endpoint = `${SPRING_BOOT_API_URL}/admin/hardware/${hwId}/category/${finalCategoryId}/package`;

    return axios
        .post(endpoint, requestData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
        .then((response) => response.data)
        .catch((error) => {
            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                // Extract error message from response
                const errorMessage =
                    error.response.data?.message ||
                    error.response.data?.error ||
                    error.response.data?.status ||
                    `Failed to create package: ${error.response.status} ${error.response.statusText}`;
                throw new Error(errorMessage);
            }
            if (error.request) {
                throw new Error('ไม่สามารถเชื่อมต่อกับ Spring Boot API ได้. กรุณาตรวจสอบว่า Spring Boot server ทำงานอยู่');
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Update hardware
 */
export const updateHardware = async (
    hwId: string,
    data: {
        name: string;
        description: string;
        priority: number;
        key: string;
    }
): Promise<Hardware> => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .put(`${SPRING_BOOT_API_URL}/admin/hardware/${hwId}`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
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
                    error.response.data?.message || error.response.data?.error || 'Failed to update hardware'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Update package
 */
export const updatePackage = async (
    hwId: string,
    categoryId: string,
    packageName: string,
    data: {
        name: string;
        description: string;
        priority: number;
        cpu: string;
        ram: string;
        storage: string;
        hourlyRate: number;
        capacity?: number | null;
    }
): Promise<PackageContainer> => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    // Map hourlyRate to price for Spring Boot API
    const requestData = {
        name: data.name,
        description: data.description,
        priority: data.priority,
        cpu: data.cpu,
        ram: data.ram,
        storage: data.storage,
        price: data.hourlyRate,
        hourlyRate: data.hourlyRate,
        capacity: data.capacity,
    };

    return axios
        .put(
            `${SPRING_BOOT_API_URL}/admin/hardware/${hwId}/category/${categoryId}/package/${encodeURIComponent(
                packageName
            )}`,
            requestData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        )
        .then((response) => response.data)
        .catch((error) => {
            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                const errorMessage =
                    error.response.data?.message ||
                    error.response.data?.error ||
                    error.response.data?.status ||
                    `Failed to update package: ${error.response.status} ${error.response.statusText}`;
                throw new Error(errorMessage);
            }
            if (error.request) {
                throw new Error('ไม่สามารถเชื่อมต่อกับ Spring Boot API ได้. กรุณาตรวจสอบว่า Spring Boot server ทำงานอยู่');
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Copy package to another hardware
 */
export const copyPackage = async (
    sourceHwId: string,
    sourceCategoryId: string,
    packageName: string,
    targetHwId: string,
    targetCategoryId: string
): Promise<PackageContainer> => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .post(
            `${SPRING_BOOT_API_URL}/admin/hardware/${targetHwId}/category/${targetCategoryId}/package/copy`,
            {
                sourceHwId,
                sourceCategoryId,
                packageName,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        )
        .then((response) => response.data)
        .catch((error) => {
            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                const errorMessage =
                    error.response.data?.message ||
                    error.response.data?.error ||
                    error.response.data?.status ||
                    `Failed to copy package: ${error.response.status} ${error.response.statusText}`;
                throw new Error(errorMessage);
            }
            if (error.request) {
                throw new Error('ไม่สามารถเชื่อมต่อกับ Spring Boot API ได้. กรุณาตรวจสอบว่า Spring Boot server ทำงานอยู่');
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
                    'Content-Type': 'application/json',
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
                // Extract error message from response
                const errorMessage =
                    error.response.data?.message ||
                    error.response.data?.error ||
                    error.response.data?.status ||
                    `Failed to delete package: ${error.response.status} ${error.response.statusText}`;
                throw new Error(errorMessage);
            }
            if (error.request) {
                throw new Error('ไม่สามารถเชื่อมต่อกับ Spring Boot API ได้. กรุณาตรวจสอบว่า Spring Boot server ทำงานอยู่');
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Category interface
 */
export interface Category {
    id: string;
    name: string;
    description?: string;
    priority: number;
    createdAt?: string;
    packages?: Array<{ id: number; name: string }>;
}

/**
 * Get all categories
 */
export const getCategories = async (): Promise<Category[]> => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .get(`${SPRING_BOOT_API_URL}/admin/categories`, {
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
                    error.response.data?.message || error.response.data?.error || 'Failed to fetch categories'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Get categories for a specific hardware
 */
export const getHardwareCategories = async (hwId: string): Promise<Category[]> => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .get(`${SPRING_BOOT_API_URL}/admin/hardware/${hwId}/categories`, {
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
                    error.response.data?.message || error.response.data?.error || 'Failed to fetch hardware categories'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Create new category
 */
export const createCategory = async (data: {
    name: string;
    description?: string;
    priority?: number;
}): Promise<Category> => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .post(
            `${SPRING_BOOT_API_URL}/admin/categories`,
            {
                name: data.name,
                description: data.description || '',
                priority: data.priority || 0,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        )
        .then((response) => response.data)
        .catch((error) => {
            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(
                    error.response.data?.message || error.response.data?.error || 'Failed to create category'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};
