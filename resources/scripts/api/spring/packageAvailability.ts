import axios from 'axios';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

/**
 * Package Availability Summary
 */
export interface PackageAvailabilitySummary {
    packageId: number;
    packageName: string;
    isAvailable: boolean;
    status: 'available' | 'limited' | 'unavailable';
    availableNodesCount: number;
}

/**
 * Node Availability Details
 */
export interface NodeAvailability {
    nodeId: number;
    nodeName: string;
    availableMemory: number;      // MB
    availableDisk: number;        // MB
    availableCpuCores: number;
    canFit: boolean;
    priority: number;
}

/**
 * Package Availability Response
 */
export interface PackageAvailabilityResponse {
    packageId: number;
    packageName: string;
    isAvailable: boolean;
    status: 'available' | 'limited' | 'unavailable';
    totalAvailableSlots: number;
    availableNodes: NodeAvailability[];
}

/**
 * Packages Availability Response
 */
export interface PackagesAvailabilityResponse {
    packages: PackageAvailabilitySummary[];
}

/**
 * Node Resources Response
 */
export interface NodeResourcesResponse {
    nodeId: number;
    nodeName: string;
    totalMemory: number;          // MB
    usedMemory: number;            // MB
    availableMemory: number;      // MB
    totalDisk: number;             // MB
    usedDisk: number;              // MB
    availableDisk: number;         // MB
    totalCpuCores: number;
    usedCpuCores: number;
    availableCpuCores: number;
    serversCount: number;
    overallocateMemory: number;    // MB
    overallocateDisk: number;      // MB
}

/**
 * Pterodactyl Node (from GET /api/nodes)
 */
export interface PterodactylNode {
    object: string;
    attributes: {
        id: number;
        name: string;
        memory: number;            // MB
        disk: number;              // MB
        cpu: number;               // CPU cores
        allocated_resources: {
            memory: number;        // MB ที่ใช้ไปแล้ว
            disk: number;          // MB ที่ใช้ไปแล้ว
        };
    };
}

/**
 * Pterodactyl Nodes Response
 */
export interface PterodactylNodesResponse {
    nodes: PterodactylNode[];
}

/**
 * Get all nodes from Pterodactyl
 */
export const getNodes = async (): Promise<PterodactylNode[]> => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .get(`${SPRING_BOOT_API_URL}/api/nodes`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then((response) => {
            const data = response.data as PterodactylNodesResponse;
            return data.nodes || [];
        })
        .catch((error) => {
            console.error('Nodes API error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
            });

            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    localStorage.removeItem('auth_token');
                    throw new Error(
                        `Authentication failed (${error.response.status}). Token may be invalid. Please login again.`
                    );
                }
                throw new Error(
                    error.response.data?.message || error.response.data?.error || 'Failed to fetch nodes'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Get package availability for all packages
 */
export const getPackagesAvailability = async (): Promise<PackagesAvailabilityResponse> => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .get(`${SPRING_BOOT_API_URL}/api/packages/availability`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then((response) => response.data as PackagesAvailabilityResponse)
        .catch((error) => {
            console.error('Packages Availability API error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
            });

            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(
                    error.response.data?.message || error.response.data?.error || 'Failed to fetch packages availability'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Get package availability for specific package
 */
export const getPackageAvailability = async (packageId: number): Promise<PackageAvailabilityResponse> => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .get(`${SPRING_BOOT_API_URL}/api/packages/${packageId}/availability`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then((response) => response.data as PackageAvailabilityResponse)
        .catch((error) => {
            console.error('Package Availability API error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
            });

            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(
                    error.response.data?.message || error.response.data?.error || 'Failed to fetch package availability'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Get node resources (Admin only)
 */
export const getNodeResources = async (nodeId: number): Promise<NodeResourcesResponse> => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .get(`${SPRING_BOOT_API_URL}/api/nodes/${nodeId}/resources`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then((response) => response.data as NodeResourcesResponse)
        .catch((error) => {
            console.error('Node Resources API error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
            });

            if (error.response) {
                if (error.response.status === 403 || error.response.status === 401) {
                    localStorage.removeItem('auth_token');
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(
                    error.response.data?.message || error.response.data?.error || 'Failed to fetch node resources'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};

/**
 * Helper function to get availability badge text
 */
export const getAvailabilityBadge = (status: 'available' | 'limited' | 'unavailable'): string => {
    switch (status) {
        case 'available':
            return 'พร้อมใช้งาน';
        case 'limited':
            return 'เหลือน้อย';
        case 'unavailable':
            return 'เซิร์ฟเวอร์เต็ม';
        default:
            return 'ไม่ทราบสถานะ';
    }
};

/**
 * Helper function to get availability badge color
 */
export const getAvailabilityBadgeColor = (status: 'available' | 'limited' | 'unavailable'): string => {
    switch (status) {
        case 'available':
            return 'green';
        case 'limited':
            return 'yellow';
        case 'unavailable':
            return 'red';
        default:
            return 'gray';
    }
};

/**
 * Helper function to format memory (MB to GB)
 */
export const formatMemory = (mb: number): string => {
    if (mb >= 1024) {
        return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
};

/**
 * Helper function to format disk (MB to GB)
 */
export const formatDisk = (mb: number): string => {
    if (mb >= 1024) {
        return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
};

