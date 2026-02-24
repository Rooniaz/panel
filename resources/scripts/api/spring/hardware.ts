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
    packageId?: number; // Real package ID from database
    price?: number; // Price from packages table (if different from hourlyRate)
    capacity?: number; // Maximum number of servers that can be rented for this package
    rentedCount?: number; // Current number of servers rented for this package
    availableCount?: number; // Available slots (capacity - rentedCount)
    // Availability fields from dynamic calculation
    isAvailable?: boolean; // Whether package is available
    status?: 'available' | 'limited' | 'unavailable'; // Availability status
    availableNodesCount?: number; // Number of nodes that can support this package
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

/** UUID v4 pattern – must use real UUID for GET /category/hw/{hwId}, never empty or /category/hw/ */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isHardwareIdValid = (hwId: string | null | undefined): boolean => {
    return typeof hwId === 'string' && hwId.length > 0 && UUID_REGEX.test(hwId.trim());
};

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
        .then((response) => response.data)
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
 * Get hardware details including packages.
 * Must be called with a valid UUID (e.g. from server.package.hardwareId).
 * Do not call with empty string or without UUID – that would hit /category/hw/ and return 400.
 */
export const getHardwareDetail = async (hwId: string): Promise<HardwareDetail> => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    const trimmed = (hwId || '').trim();
    if (!isHardwareIdValid(trimmed)) {
        throw new Error(
            'Hardware ID must be a valid UUID. Use server.package.hardwareId from GET /api/servers/{id}.'
        );
    }

    return axios
        .get(`${SPRING_BOOT_API_URL}/category/hw/${trimmed}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then((response) => {
            // Check if response is valid JSON object
            if (typeof response.data === 'string' || typeof response.data === 'number') {
                console.error('[getHardwareDetail] Invalid response format:', response.data);
                throw new Error(`Invalid hardware data format. Expected object, got: ${typeof response.data}`);
            }
            
            if (!response.data || !response.data.categoryContainers) {
                console.error('[getHardwareDetail] Missing categoryContainers:', response.data);
                throw new Error('Hardware data is missing categoryContainers');
            }
            
            return response.data;
        })
        .catch((error) => {
            console.error('[getHardwareDetail] Error fetching hardware detail:', {
                hwId: trimmed,
                error: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });
            
            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    // Token expired or invalid, remove it
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                
                if (error.response.status === 404) {
                    throw new Error(`Hardware with ID "${hwId}" not found`);
                }
                
                throw new Error(
                    error.response.data?.message || error.response.data?.error || `Failed to fetch hardware details (${error.response.status})`
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};
