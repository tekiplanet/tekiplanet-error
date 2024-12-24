<?php

namespace App\Http\Controllers;

use App\Models\Professional;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ProfessionalSettingsController extends Controller
{
    public function updateProfile(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|min:2',
                'specialization' => 'required|string|min:2',
                'expertise_areas' => 'required|array|min:1',
                'years_of_experience' => 'required|integer|min:0',
                'hourly_rate' => 'required|numeric|min:0',
                'bio' => 'required|string|max:500',
                'certifications' => 'nullable|array',
                'linkedin_url' => 'nullable|url',
                'github_url' => 'nullable|url',
                'portfolio_url' => 'nullable|url',
                'preferred_contact_method' => 'required|in:email,phone,whatsapp,platform',
                'timezone' => 'required|string',
                'languages' => 'required|array|min:1'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $professional = Professional::where('user_id', auth()->id())->firstOrFail();
            $professional->update($request->all());

            return response()->json([
                'message' => 'Professional profile updated successfully',
                'profile' => $professional->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating professional profile:', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update professional profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 