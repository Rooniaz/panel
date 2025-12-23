<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class SpringLoginController extends AbstractLoginController
{
    /**
     * Authenticate user with Spring Boot token
     * This creates a Laravel session after Spring Boot authentication
     */
    public function authenticate(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'token' => 'required|string',
        ]);

        $username = $request->input('username');
        $token = $request->input('token');

        // Verify token with Spring Boot API
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
            ])->get('http://localhost:9000/api/auth/verify');

            if (!$response->successful() || !$response->json('success')) {
                throw new \Exception('Invalid token');
            }
        } catch (\Exception $e) {
            return new JsonResponse([
                'data' => [
                    'success' => false,
                    'message' => 'Token verification failed',
                ],
            ], 401);
        }

        // Find or create user in Laravel database
        try {
            $user = User::where('username', $username)->first();
            
            if (!$user) {
                // Get user info from Spring Boot to create user
                $userInfo = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $token,
                ])->get('http://localhost:9000/api/auth/user')->json();

                // Create new user in Laravel
                $user = User::create([
                    'username' => $username,
                    'email' => $userInfo['email'] ?? $username . '@example.com',
                    'password' => bcrypt(Str::random(32)), // Random password, won't be used
                    'uuid' => Str::uuid()->toString(),
                    'root_admin' => false,
                    'language' => 'en',
                ]);
            }

            // Create Laravel session
            $request->session()->regenerate();
            $this->auth->guard()->login($user, true);

            return new JsonResponse([
                'data' => [
                    'success' => true,
                    'complete' => true,
                    'intended' => '/',
                    'user' => $user->toVueObject(),
                ],
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'data' => [
                    'success' => false,
                    'message' => 'Failed to authenticate: ' . $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Alternative: Authenticate using username/password after Spring Boot verification
     * This is simpler if Spring Boot returns user info directly
     */
    public function authenticateWithUserInfo(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'email' => 'nullable|string|email',
        ]);

        $username = strtolower($request->input('username'));
        $email = $request->input('email');

        try {
            // Find user by username or email
            $user = User::where('username', $username)
                ->orWhere('email', $email ?? '')
                ->first();

            if (!$user) {
                // Create new user in Laravel (sync with Spring Boot user)
                // Password is not stored here since authentication is handled by Spring Boot
                $user = User::create([
                    'username' => $username,
                    'email' => $email ?? $username . '@minelan.local',
                    'password' => bcrypt(Str::random(64)), // Random password, not used for auth
                    'uuid' => Str::uuid()->toString(),
                    'name_first' => $username, // Default to username if not provided
                    'name_last' => '',
                    'root_admin' => false,
                    'language' => 'en',
                ]);
            } else {
                // Update email if provided and different
                if ($email && $user->email !== $email) {
                    $user->email = $email;
                    $user->save();
                }
            }

            // Create Laravel session
            $request->session()->regenerate();
            $this->auth->guard()->login($user, true);

            return new JsonResponse([
                'data' => [
                    'success' => true,
                    'complete' => true,
                    'intended' => '/',
                    'user' => $user->toVueObject(),
                ],
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'data' => [
                    'success' => false,
                    'message' => 'Failed to authenticate: ' . $e->getMessage(),
                ],
            ], 500);
        }
    }
}

