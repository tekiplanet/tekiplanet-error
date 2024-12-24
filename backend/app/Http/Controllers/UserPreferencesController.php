<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UserPreferencesController extends Controller
{
    public function updatePreferences(Request $request)
    {
        $user = Auth::user();
        Log::info('Updating preferences for user', [
            'user_id' => $user->id,
            'request_data' => $request->all(),
            'current_user_data' => [
                'email_notifications' => $user->email_notifications,
                'push_notifications' => $user->push_notifications,
                'marketing_notifications' => $user->marketing_notifications,
                'profile_visibility' => $user->profile_visibility,
            ]
        ]);

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validatedData = $request->validate([
            'email_notifications' => 'boolean',
            'push_notifications' => 'boolean',
            'marketing_notifications' => 'boolean',
            'profile_visibility' => 'required|in:public,private',
        ]);

        Log::info('Validated data:', $validatedData);

        try {
            foreach ($validatedData as $key => $value) {
                $user->$key = $value;
                Log::info("Setting {$key} to:", ['value' => $value, 'type' => gettype($value)]);
            }

            $user->save();
            Log::info('User saved, new values:', [
                'email_notifications' => $user->email_notifications,
                'push_notifications' => $user->push_notifications,
                'marketing_notifications' => $user->marketing_notifications,
                'profile_visibility' => $user->profile_visibility,
            ]);

            $user->refresh();
            Log::info('User refreshed, final values:', [
                'email_notifications' => $user->email_notifications,
                'push_notifications' => $user->push_notifications,
                'marketing_notifications' => $user->marketing_notifications,
                'profile_visibility' => $user->profile_visibility,
            ]);

            return response()->json([
                'message' => 'Preferences updated successfully',
                'user' => $user->makeVisible([
                    'email_notifications',
                    'push_notifications',
                    'marketing_notifications',
                    'profile_visibility'
                ])
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update preferences:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to update preferences',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
