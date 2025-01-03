<?php

namespace App\Http\Controllers;

use App\Models\Professional;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ProfessionalController extends Controller
{
    public function checkProfile()
    {
        try {
            $user = Auth::user();
            $professional = Professional::with('user')->where('user_id', $user->id)->first();

            return response()->json([
                'has_profile' => !is_null($professional),
                'profile' => $professional
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking professional profile:', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'message' => 'Error checking professional profile'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'title' => 'required|string|max:255',
                'category_id' => 'required|exists:professional_categories,id',
                'specialization' => 'nullable|string|max:255',
                'expertise_areas' => 'required|array',
                'years_of_experience' => 'required|integer|min:0',
                // 'hourly_rate' => 'required|numeric|min:0',
                'bio' => 'nullable|string',
                'certifications' => 'nullable|array',
                'linkedin_url' => 'nullable|url',
                'github_url' => 'nullable|url',
                'portfolio_url' => 'nullable|url',
                'preferred_contact_method' => 'required|in:email,phone,whatsapp,platform',
                'timezone' => 'required|string',
                'languages' => 'required|array',
                'availability_status' => 'required|in:available,busy,on_leave,inactive'
            ]);

            // Check if profile already exists
            $existingProfile = Professional::where('user_id', Auth::id())->first();
            if ($existingProfile) {
                return response()->json([
                    'message' => 'Professional profile already exists'
                ], 400);
            }

            $professional = Professional::create([
                'user_id' => Auth::id(),
                'category_id' => $validatedData['category_id'],
                'title' => $validatedData['title'],
                'specialization' => $validatedData['specialization'],
                'expertise_areas' => $validatedData['expertise_areas'],
                'years_of_experience' => $validatedData['years_of_experience'],
                'bio' => $validatedData['bio'],
                'certifications' => $validatedData['certifications'],
                'linkedin_url' => $validatedData['linkedin_url'],
                'github_url' => $validatedData['github_url'],
                'portfolio_url' => $validatedData['portfolio_url'],
                'preferred_contact_method' => $validatedData['preferred_contact_method'],
                'timezone' => $validatedData['timezone'],
                'languages' => $validatedData['languages'],
                'availability_status' => $validatedData['availability_status'],
                'status' => 'inactive',
                'rating' => null,
                'total_sessions' => 0
            ]);

            return response()->json([
                'message' => 'Professional profile created successfully',
                'profile' => $professional
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating professional profile:', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'message' => 'Error creating professional profile'
            ], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'specialization' => 'required|string|max:255',
                'category_id' => 'required|exists:professional_categories,id',
                'expertise_areas' => 'required|array',
                'years_of_experience' => 'required|integer|min:0',
                'hourly_rate' => 'required|numeric|min:0',
                'bio' => 'nullable|string',
                'certifications' => 'nullable|array',
                'linkedin_url' => 'nullable|url',
                'github_url' => 'nullable|url',
                'portfolio_url' => 'nullable|url',
                'preferred_contact_method' => 'required|in:email,phone,whatsapp,platform',
                'timezone' => 'required|string',
                'languages' => 'required|array',
                'availability_status' => 'required|in:available,busy,on_leave,inactive'
            ]);

            $professional = Professional::where('user_id', Auth::id())->firstOrFail();
            $professional->update($validated);

            return response()->json([
                'message' => 'Professional profile updated successfully',
                'profile' => $professional
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating professional profile:', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'message' => 'Error updating professional profile'
            ], 500);
        }
    }
} 