import http from '@/api/http';

export interface LaravelSessionResponse {
    success: boolean;
    complete: boolean;
    intended?: string;
    user?: any;
    message?: string;
}

export interface LaravelSessionData {
    username: string;
    email?: string;
}

/**
 * Create Laravel session after Spring Boot authentication
 */
export default ({ username, email }: LaravelSessionData): Promise<LaravelSessionResponse> => {
    return new Promise((resolve, reject) => {
        // First get CSRF cookie (required for session-based auth)
        http.get('/sanctum/csrf-cookie')
            .then(() =>
                http.post('/auth/spring/authenticate', {
                    username,
                    email,
                })
            )
            .then((response) => {
                if (response.data && response.data.data) {
                    resolve({
                        success: response.data.data.success ?? false,
                        complete: response.data.data.complete ?? false,
                        intended: response.data.data.intended ?? '/',
                        user: response.data.data.user,
                        message: response.data.data.message,
                    });
                } else {
                    reject(new Error('Invalid response from server'));
                }
            })
            .catch(reject);
    });
};
