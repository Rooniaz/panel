import axios from 'axios';

export interface UserRole {
    roleID: string;
    roleName: string;
    endDates: string | null;
    permissionList: any[];
}

export interface NextRoleInfo {
    roleId: string;
    roleName: string;
    requireTopup: number;
}

export interface Subscription {
    subscriptionID: string | null;
    subscriptionName: string | null;
    endDates: string | null;
    permissionList: any[] | null;
    autoRenew: boolean;
}

export interface AppendData {
    claimAddonFreeFeature: string;
    usageAddonCreationLeft: number;
    addonCreationPrice: number;
}

export interface UserProfile {
    username: string;
    role: UserRole;
    credit: number;
    topupMultiplier: number;
    totalTopup: number;
    nextRoleInfo: NextRoleInfo;
    email: string;
    ownContainers: any[];
    subscription: Subscription;
    appendData: AppendData;
}

const SPRING_BOOT_API_URL = 'http://localhost:9000';

/**
 * Get user profile from Spring Boot backend
 */
export default async (): Promise<UserProfile> => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    return axios
        .get(`${SPRING_BOOT_API_URL}/user/profile`, {
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
                    error.response.data?.message || error.response.data?.error || 'Failed to fetch user profile'
                );
            }
            throw new Error(error.message || 'Network error occurred');
        });
};
