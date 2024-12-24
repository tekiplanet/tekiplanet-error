<?php

namespace App\Http\Controllers;

use App\Models\BusinessProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class BusinessSettingsController extends Controller
{
    public function updateProfile(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'business_name' => 'required|string|min:2',
                'business_email' => 'required|email',
                'phone_number' => 'required|string|min:10',
                'registration_number' => 'nullable|string',
                'tax_number' => 'nullable|string',
                'website' => 'nullable|url',
                'description' => 'required|string|max:500',
                'address' => 'required|string|min:5',
                'city' => 'required|string|min:2',
                'state' => 'required|string|min:2',
                'country' => 'required|string|min:2',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $businessProfile = $user->businessProfile;

            $businessProfile->update($request->all());

            return response()->json([
                'message' => 'Business profile updated successfully',
                'business_profile' => $businessProfile->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating business profile:', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update business profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateLogo(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'logo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $businessProfile = $user->businessProfile;

            if ($request->hasFile('logo')) {
                // Delete old logo if it exists
                if ($businessProfile->logo) {
                    Storage::disk('public')->delete($businessProfile->logo);
                }

                // Store new logo
                $path = $request->file('logo')->store('business-logos', 'public');
                $businessProfile->logo = $path;
                $businessProfile->save();
            }

            return response()->json([
                'message' => 'Logo updated successfully',
                'user' => $user->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating business logo:', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update logo',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 