<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Pterodactyl\Services\Users\UserCreationService;
use Illuminate\Validation\ValidationException;

class RegisterController extends AbstractLoginController
{
    public function __construct(private UserCreationService $creationService)
    {
        parent::__construct();
    }

    /**
     * Handle a registration request.
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => 'required|between:1,191|unique:users,username',
            'email' => 'required|email|between:1,191|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'name_first' => 'nullable|string|between:1,191',
            'name_last' => 'nullable|string|between:1,191',
        ]);

        try {
            // Create user using the UserCreationService
            $user = $this->creationService->handle([
                'username' => strtolower($data['username']),
                'email' => $data['email'],
                'password' => $data['password'],
                'name_first' => $data['name_first'] ?? $data['username'],
                'name_last' => $data['name_last'] ?? '-',
                'root_admin' => false,
                'language' => 'en',
            ]);

            // Automatically log in the user after registration
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
        } catch (ValidationException $e) {
            return new JsonResponse([
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return new JsonResponse([
                'errors' => [
                    'general' => ['Registration failed: ' . $e->getMessage()],
                ],
            ], 422);
        }
    }
}

