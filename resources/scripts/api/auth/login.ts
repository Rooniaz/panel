import http from '@/api/http';
import springLogin from '@/api/auth/springLogin';
import getUserProfile from '@/api/spring/userProfile';

export interface LoginResponse {
    complete: boolean;
    intended?: string;
    confirmationToken?: string;
}

export interface LoginData {
    username: string;
    password: string;
    recaptchaData?: string | null;
}

export default ({ username, password, recaptchaData }: LoginData): Promise<LoginResponse> => {
    return new Promise((resolve, reject) => {
        // Step 1: Get CSRF cookie first
        http.get('/sanctum/csrf-cookie')
            .then(() => {
                // Step 2: Call both Laravel and Spring Boot login in parallel
                const laravelLogin = http.post('/auth/login', {
                    user: username,
                    password,
                    'g-recaptcha-response': recaptchaData,
                });

                const springBootLogin = springLogin({ username, password }).catch((error) => {
                    // Don't fail the login if Spring Boot login fails
                    console.error('Spring Boot login failed, but continuing with Laravel login:', error);
                    return null;
                });

                // Wait for Laravel login (required) and Spring Boot login (optional)
                Promise.all([laravelLogin, springBootLogin])
                    .then(([laravelResponse, springResponse]) => {
                        // Check Laravel login result (required)
                        if (!(laravelResponse.data instanceof Object)) {
                            return reject(new Error('An error occurred while processing the login request.'));
                        }

                        // Check Spring Boot login result (optional)
                        if (springResponse) {
                            console.log('Spring Boot login response:', springResponse);
                            const storedToken = localStorage.getItem('auth_token');
                            console.log('Token in localStorage:', storedToken ? 'Found' : 'Not found');

                            if (springResponse.success && springResponse.token) {
                                console.log(
                                    'Spring Boot token obtained successfully:',
                                    springResponse.token.substring(0, 20) + '...'
                                );

                                // Fetch user profile after successful login
                                getUserProfile()
                                    .then((profile) => {
                                        console.log('User profile fetched:', profile);
                                        // Store credit in localStorage for Sidebar to use
                                        localStorage.setItem('user_credit', profile.credit.toString());
                                        // Trigger custom event to notify Sidebar
                                        window.dispatchEvent(
                                            new CustomEvent('userProfileUpdated', { detail: profile })
                                        );
                                    })
                                    .catch((profileError) => {
                                        console.warn('Failed to fetch user profile:', profileError);
                                    });
                            } else {
                                console.warn('Spring Boot login succeeded but no token received:', springResponse);
                            }
                        }

                        // Return Laravel login response
                        return resolve({
                            complete: laravelResponse.data.data.complete,
                            intended: laravelResponse.data.data.intended || undefined,
                            confirmationToken: laravelResponse.data.data.confirmation_token || undefined,
                        });
                    })
                    .catch((error) => {
                        // If Laravel login fails, reject
                        reject(error);
                    });
            })
            .catch(reject);
    });
};
