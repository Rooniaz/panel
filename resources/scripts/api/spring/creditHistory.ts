const SPRING_BOOT_API_URL = 'http://localhost:9000';

export interface CreditDeductionItem {
    id: string;
    amount: number;
    serverName?: string;
    serverId?: number;
    reason: string;
    date: string;
    description?: string;
}

export interface CreditDeductionHistory {
    records: CreditDeductionItem[];
    totalRecords: number;
}

/**
 * Get credit deduction history
 */
export const getCreditDeductionHistory = async (): Promise<CreditDeductionHistory> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    try {
        const response = await fetch(`${SPRING_BOOT_API_URL}/api/wallet/credit/deductions`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('auth_token');
            window.location.href = '/auth/login';
            throw new Error('Authentication failed. Please login again.');
        }

        if (!response.ok) {
            throw new Error(`Failed to get credit deduction history (${response.status})`);
        }

        const data = await response.json();
        
        // Handle different response formats
        if (data.records && Array.isArray(data.records)) {
            return {
                records: data.records.map((record: any) => ({
                    id: record.id || record.transactionId || '',
                    amount: Number(record.amount) || 0,
                    serverName: record.serverName || record.server_name || undefined,
                    serverId: record.serverId || record.server_id || undefined,
                    reason: record.reason || record.type || 'UNKNOWN',
                    date: record.date || record.createdAt || record.created_at || new Date().toISOString(),
                    description: record.description || record.note || undefined,
                })),
                totalRecords: data.totalRecords || data.total_records || data.records.length,
            };
        } else if (Array.isArray(data)) {
            return {
                records: data.map((record: any) => ({
                    id: record.id || record.transactionId || '',
                    amount: Number(record.amount) || 0,
                    serverName: record.serverName || record.server_name || undefined,
                    serverId: record.serverId || record.server_id || undefined,
                    reason: record.reason || record.type || 'UNKNOWN',
                    date: record.date || record.createdAt || record.created_at || new Date().toISOString(),
                    description: record.description || record.note || undefined,
                })),
                totalRecords: data.length,
            };
        }

        throw new Error('Invalid response format');
    } catch (error: any) {
        if (error.message.includes('Authentication')) {
            throw error;
        }
        throw new Error(error.message || 'Failed to get credit deduction history.');
    }
};


