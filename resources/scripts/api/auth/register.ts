import http from '@/api/http';

export interface RegisterResponse {
    success: boolean;
    complete: boolean;
    intended?: string;
    user?: any;
    message?: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    nameFirst?: string;
    nameLast?: string;
    recaptchaData?: string | null;
}

/**
 * Register a new user account
 */
export default ({
    username,
    email,
    password,
    passwordConfirmation,
    nameFirst,
    nameLast,
    recaptchaData,
}: RegisterData): Promise<RegisterResponse> => {
    return new Promise((resolve, reject) => {
        // First get CSRF cookie (required for session-based auth)
        http.get('/sanctum/csrf-cookie')
            .then(() =>
                http.post('/auth/register', {
                    username,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                    name_first: nameFirst,
                    name_last: nameLast,
                    'g-recaptcha-response': recaptchaData,
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
