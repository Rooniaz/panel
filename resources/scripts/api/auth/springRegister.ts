import axios from 'axios';

export interface SpringRegisterResponse {
    success: boolean;
    message?: string;
    user?: {
        id: string;
        username: string;
        email: string;
    };
    token?: string;
}

export interface SpringRegisterData {
    username: string;
    email: string;
    password: string;
    passwordConfirmation?: string;
}

/**
 * Register API call to Spring Boot backend
 */
export default ({
    username,
    email,
    password,
    passwordConfirmation,
}: SpringRegisterData): Promise<SpringRegisterResponse> => {
    return new Promise((resolve, reject) => {
        // Validate password confirmation if provided
        if (passwordConfirmation && password !== passwordConfirmation) {
            reject(new Error('Passwords do not match'));
            return;
        }

        axios
            .post('http://localhost:9000/api/auth/register', {
                username,
                email,
                password,
                password_confirmation: passwordConfirmation || password,
            })
            .then((response) => {
                // Handle empty response body (200 OK but no content)
                if (!response.data || response.data === '' || Object.keys(response.data || {}).length === 0) {
                    // If status is 200 OK, consider it successful even with empty body
                    resolve({
                        success: true,
                        message: 'Registration successful',
                    });
                    return;
                }

                if (response.data && response.data.success) {
                    // Store token if provided
                    if (response.data.token) {
                        localStorage.setItem('auth_token', response.data.token);
                    }
                    resolve(response.data);
                } else {
                    reject(new Error(response.data?.message || 'Registration failed'));
                }
            })
            .catch((error) => {
                if (error.response && error.response.data) {
                    reject(
                        new Error(error.response.data.message || error.response.data.error || 'Registration failed')
                    );
                } else {
                    reject(new Error(error.message || 'Network error occurred'));
                }
            });
    });
};
