<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string|min:8',
            // Validate account type
            'type' => [
                'required', 
                Rule::in(User::$accountTypeOptions)
            ],
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            // Save account type
            'account_type' => $request->type,
            'first_name' => $request->first_name ?? null,
            'last_name' => $request->last_name ?? null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required',
            'password' => 'required'
        ]);

        $loginField = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $user = User::where($loginField, $request->login)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Revoke all existing tokens for this user
        $user->tokens()->delete();

        // Create a new token
        $token = $user->createToken('login_token')->plainTextToken;

        // Return full user data including wallet_balance
        return response()->json([
            'user' => array_merge(
                $user->makeVisible(['wallet_balance', 'dark_mode', 'two_factor_enabled', 'email_notifications', 'push_notifications', 'marketing_notifications'])->toArray(),
                [
                    'preferences' => [
                        'dark_mode' => $user->dark_mode ?? false,
                        'theme' => $user->dark_mode ? 'dark' : 'light'
                    ]
                ]
            ),
            'token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        $user = $request->user()->load(['professional', 'businessProfile']);
        
        Log::info('User data debug:', [
            'user_id' => $user->id,
            'professional' => $user->professional?->toArray(),
            'has_professional' => $user->professional !== null,
            'two_factor_enabled' => $user->two_factor_enabled
        ]);

        // Return user data with professional profile
        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'avatar' => $user->avatar,
            'account_type' => $user->account_type,
            'wallet_balance' => $user->wallet_balance,
            'dark_mode' => $user->dark_mode,
            'two_factor_enabled' => (bool) $user->two_factor_enabled,
            'professional' => $user->professional,
            'businessProfile' => $user->businessProfile
        ]);
    }
}
