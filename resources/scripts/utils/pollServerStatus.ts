import { getServerStatus } from '@/api/spring/servers';

/**
 * Poll server status until it's ready or failed
 */
export interface PollOptions {
    maxAttempts?: number;
    interval?: number;
    onStatusChange?: (status: string) => void;
    onSuccess?: (server: any) => void;
    onError?: (error: Error) => void;
    onTimeout?: () => void;
}

export const pollServerStatus = async (serverId: number, apiKey: string, options: PollOptions = {}): Promise<any> => {
    const {
        maxAttempts = 60, // 5 minutes (5s * 60)
        interval = 5000, // 5 seconds
        onStatusChange,
        onSuccess,
        onError,
        onTimeout,
    } = options;

    let attempts = 0;

    const poll = async (): Promise<any> => {
        try {
            // Use Spring Boot API to get server status
            const server = await getServerStatus(serverId);
            const status = server.status;

            // Notify status change
            if (onStatusChange) {
                onStatusChange(status);
            }

            // Success states (Spring Boot status values may differ)
            if (status === 'running' || status === 'offline' || status === 'ready' || status === 'active') {
                if (onSuccess) {
                    onSuccess(server);
                }
                return server;
            }

            // Failed states
            if (status === 'suspended' || status === 'install_failed' || status === 'failed' || status === 'error') {
                const error = new Error(`Server creation failed. Status: ${status}`);
                if (onError) {
                    onError(error);
                }
                throw error;
            }

            // Still installing/creating
            if (status === 'installing' || status === 'starting' || status === 'creating' || status === 'pending') {
                attempts++;

                if (attempts >= maxAttempts) {
                    const timeoutError = new Error('Server creation timeout');
                    if (onTimeout) {
                        onTimeout();
                    }
                    if (onError) {
                        onError(timeoutError);
                    }
                    throw timeoutError;
                }

                // Poll again
                setTimeout(poll, interval);
                return;
            }

            // Unknown status - continue polling
            attempts++;
            if (attempts >= maxAttempts) {
                const error = new Error(`Unknown server status: ${status}`);
                if (onError) {
                    onError(error);
                }
                throw error;
            }

            setTimeout(poll, interval);
        } catch (error: any) {
            attempts++;

            // If endpoint is not available, stop polling immediately
            if (error.message === 'ENDPOINT_NOT_AVAILABLE') {
                if (onError) {
                    onError(new Error('Server status API endpoint is not available'));
                }
                throw error;
            }

            if (attempts >= maxAttempts) {
                if (onError) {
                    onError(error);
                }
                throw error;
            }

            // Retry on network errors
            if (error.message?.includes('HTTP') || error.message?.includes('fetch')) {
                setTimeout(poll, interval);
                return;
            }

            // Re-throw other errors
            if (onError) {
                onError(error);
            }
            throw error;
        }
    };

    return poll();
};
