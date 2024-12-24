<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use PragmaRX\Google2FA\Google2FA;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class TwoFactorController extends Controller
{
    protected $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    public function enable(Request $request)
    {
        $user = $request->user();

        // Check if 2FA is already enabled
        if ($user->two_factor_enabled) {
            return response()->json([
                'message' => 'Two-factor authentication is already enabled'
            ], 400);
        }

        // Generate the secret key
        $secret = $this->google2fa->generateSecretKey();

        // Generate recovery codes
        $recoveryCodes = [];
        for ($i = 0; $i < 8; $i++) {
            $recoveryCodes[] = Str::random(10);
        }

        // Store the secret and recovery codes
        $user->two_factor_secret = $secret;
        $user->two_factor_recovery_codes = $recoveryCodes;
        $user->save();

        // Generate the QR code URL
        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        return response()->json([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'recovery_codes' => $recoveryCodes
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6'
        ]);

        $user = $request->user();
        $valid = $this->google2fa->verifyKey($user->two_factor_secret, $request->code);

        if (!$valid) {
            return response()->json([
                'message' => 'Invalid authentication code'
            ], 400);
        }

        $user->two_factor_enabled = true;
        $user->save();

        return response()->json([
            'message' => 'Two-factor authentication enabled successfully'
        ]);
    }

    public function disable(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6'
        ]);

        $user = $request->user();

        if (!$user->two_factor_enabled) {
            return response()->json([
                'message' => 'Two-factor authentication is not enabled'
            ], 400);
        }

        $valid = $this->google2fa->verifyKey($user->two_factor_secret, $request->code);

        if (!$valid) {
            return response()->json([
                'message' => 'Invalid authentication code'
            ], 400);
        }

        $user->two_factor_enabled = false;
        $user->two_factor_secret = null;
        $user->two_factor_recovery_codes = null;
        $user->save();

        return response()->json([
            'message' => 'Two-factor authentication disabled successfully'
        ]);
    }

    public function validateCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6'
        ]);

        $user = $request->user();
        $valid = $this->google2fa->verifyKey($user->two_factor_secret, $request->code);

        return response()->json([
            'valid' => $valid
        ]);
    }

    public function validateRecoveryCode(Request $request)
    {
        $request->validate([
            'recovery_code' => 'required|string'
        ]);

        $user = $request->user();
        $recoveryCodes = $user->two_factor_recovery_codes ?? [];
        
        $valid = in_array($request->recovery_code, $recoveryCodes);

        if ($valid) {
            // Remove used recovery code
            $recoveryCodes = array_diff($recoveryCodes, [$request->recovery_code]);
            $user->two_factor_recovery_codes = array_values($recoveryCodes);
            $user->save();
        }

        return response()->json([
            'valid' => $valid
        ]);
    }

    public function generateRecoveryCodes(Request $request)
    {
        $user = $request->user();

        if (!$user->two_factor_enabled) {
            return response()->json([
                'message' => 'Two-factor authentication is not enabled'
            ], 400);
        }

        $recoveryCodes = [];
        for ($i = 0; $i < 8; $i++) {
            $recoveryCodes[] = Str::random(10);
        }

        $user->two_factor_recovery_codes = $recoveryCodes;
        $user->save();

        return response()->json([
            'recovery_codes' => $recoveryCodes
        ]);
    }

    public function getRecoveryCodes(Request $request)
    {
        $user = $request->user();

        if (!$user->two_factor_enabled) {
            return response()->json([
                'message' => 'Two-factor authentication is not enabled'
            ], 400);
        }

        return response()->json([
            'recovery_codes' => $user->two_factor_recovery_codes
        ]);
    }
}
