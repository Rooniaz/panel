import axios from 'axios';

export interface SpringLoginResponse {
    success: boolean;
    token?: string;
    message?: string;
    user?: {
        id: string;
        username: string;
        email: string;
    };
}

export interface SpringLoginData {
    username: string;
    password: string;
}

const SPRING_BOOT_API_URL = 'http://localhost:9000';

/**
 * Login API call to Spring Boot backend
 */
export default ({ username, password }: SpringLoginData): Promise<SpringLoginResponse> => {
    return new Promise((resolve, reject) => {
        axios
            .post(`${SPRING_BOOT_API_URL}/api/auth/login`, {
                emailOrUsername: username,
                password,
            })
            .then((response) => {
                // Log full response for debugging
                console.log('Spring Boot login response:', {
                    status: response.status,
                    headers: response.headers,
                    data: response.data,
                });

                // Check token in response body (various possible field names)
                let token =
                    response.data?.token ||
                    response.data?.data?.token ||
                    response.data?.accessToken ||
                    response.data?.data?.accessToken ||
                    response.data?.authToken ||
                    response.data?.data?.authToken;

                // Also check response headers for token (some APIs return token in headers)
                if (!token) {
                    token =
                        response.headers['authorization']?.replace('Bearer ', '') ||
                        response.headers['x-auth-token'] ||
                        response.headers['x-access-token'];
                }

                if (token) {
                    localStorage.setItem('auth_token', token);
                    console.log('Token stored in localStorage:', token.substring(0, 20) + '...');
                } else {
                    console.warn('No token found in response body or headers');
                    console.warn('Response data:', JSON.stringify(response.data, null, 2));
                }

                // Check if login was successful
                const success =
                    response.data?.success ||
                    response.data?.data?.success ||
                    (response.status >= 200 && response.status < 300);

                if (success) {
                    resolve({
                        success: true,
                        token: token,
                        message: response.data?.message || response.data?.data?.message,
                        user: response.data?.user || response.data?.data?.user,
                    });
                } else {
                    reject(new Error(response.data?.message || response.data?.data?.message || 'Login failed'));
                }
            })
            .catch((error) => {
                if (error.response && error.response.data) {
                    reject(new Error(error.response.data.message || error.response.data.error || 'Login failed'));
                } else {
                    reject(new Error(error.message || 'Network error occurred'));
                }
            });
    });
};
