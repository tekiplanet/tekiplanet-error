<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class WithdrawalController extends Controller
{
    public function getBanks()
    {
        try {
            // Cache banks list for 24 hours
            return Cache::remember('nigerian_banks', 86400, function () {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . config('services.paystack.secret_key')
                ])->get('https://api.paystack.co/bank');

                if (!$response->successful()) {
                    throw new \Exception('Failed to fetch banks from Paystack');
                }

                return response()->json($response->json());
            });
        } catch (\Exception $e) {
            Log::error('Failed to fetch banks: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch banks. Please try again later.'], 500);
        }
    }

    public function verifyAccount(Request $request)
    {
        $request->validate([
            'account_number' => 'required|string|size:10',
            'bank_code' => 'required|string'
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.paystack.secret_key')
            ])->get('https://api.paystack.co/bank/resolve', [
                'account_number' => $request->account_number,
                'bank_code' => $request->bank_code
            ]);

            if (!$response->successful()) {
                return response()->json(['error' => 'Account verification failed'], 400);
            }

            $accountData = $response->json()['data'];
            
            // Verify account name matches user's name
            $user = auth()->user();
            if (strtolower($accountData['account_name']) !== strtolower($user->name)) {
                return response()->json([
                    'error' => 'Account name does not match user name',
                    'account_name' => $accountData['account_name'],
                    'user_name' => $user->name
                ], 400);
            }

            return response()->json($accountData);
        } catch (\Exception $e) {
            Log::error('Account verification failed: ' . $e->getMessage());
            return response()->json(['error' => 'Account verification failed. Please try again later.'], 500);
        }
    }

    public function addBankAccount(Request $request)
    {
        $request->validate([
            'bank_name' => 'required|string',
            'bank_code' => 'required|string',
            'account_number' => 'required|string|size:10',
            'account_name' => 'required|string'
        ]);

        try {
            $user = auth()->user();
            
            // Check if user already has 2 bank accounts
            $accountCount = BankAccount::where('user_id', $user->id)->count();
            if ($accountCount >= 2) {
                return response()->json(['error' => 'Maximum number of bank accounts (2) reached'], 400);
            }

            // Create recipient on Paystack
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.paystack.secret_key')
            ])->post('https://api.paystack.co/transferrecipient', [
                'type' => 'nuban',
                'name' => $request->account_name,
                'account_number' => $request->account_number,
                'bank_code' => $request->bank_code,
                'currency' => 'NGN'
            ]);

            if (!$response->successful()) {
                return response()->json(['error' => 'Failed to create transfer recipient'], 400);
            }

            $recipientData = $response->json()['data'];

            // Create bank account record
            $bankAccount = BankAccount::create([
                'user_id' => $user->id,
                'bank_name' => $request->bank_name,
                'bank_code' => $request->bank_code,
                'account_number' => $request->account_number,
                'account_name' => $request->account_name,
                'recipient_code' => $recipientData['recipient_code'],
                'is_verified' => true,
                'is_default' => $accountCount === 0 // Set as default if it's the first account
            ]);

            return response()->json($bankAccount);
        } catch (\Exception $e) {
            Log::error('Failed to add bank account: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to add bank account. Please try again later.'], 500);
        }
    }

    public function withdraw(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'bank_account_id' => 'required|exists:bank_accounts,id'
        ]);

        try {
            $user = auth()->user();
            $settings = app('settings');
            $bankAccount = BankAccount::findOrFail($request->bank_account_id);

            // Validate bank account ownership
            if ($bankAccount->user_id !== $user->id) {
                return response()->json(['error' => 'Invalid bank account'], 403);
            }

            // Check minimum withdrawal amount
            if ($request->amount < $settings->min_withdrawal_amount) {
                return response()->json([
                    'error' => "Minimum withdrawal amount is {$settings->min_withdrawal_amount}"
                ], 400);
            }

            // Check maximum withdrawal amount
            if ($request->amount > $settings->max_withdrawal_amount) {
                return response()->json([
                    'error' => "Maximum withdrawal amount is {$settings->max_withdrawal_amount}"
                ], 400);
            }

            // Check daily withdrawal limit
            $todayWithdrawals = Transaction::where('user_id', $user->id)
                ->where('type', 'debit')
                ->where('category', 'withdrawal')
                ->whereDate('created_at', Carbon::today())
                ->sum('amount');

            if (($todayWithdrawals + $request->amount) > $settings->daily_withdrawal_limit) {
                return response()->json([
                    'error' => "Daily withdrawal limit ({$settings->daily_withdrawal_limit}) exceeded"
                ], 400);
            }

            // Check sufficient balance
            if ($user->wallet_balance < $request->amount) {
                return response()->json(['error' => 'Insufficient balance'], 400);
            }

            // Process withdrawal using database transaction
            DB::beginTransaction();
            try {
                // Create withdrawal transaction
                $transaction = Transaction::create([
                    'user_id' => $user->id,
                    'amount' => $request->amount,
                    'type' => 'debit',
                    'category' => 'withdrawal',
                    'status' => 'pending',
                    'description' => "Withdrawal to {$bankAccount->bank_name} - {$bankAccount->account_number}",
                    'payment_method' => 'bank_transfer',
                    'reference_number' => uniqid('WTH-'),
                    'notes' => json_encode([
                        'bank_account_id' => $bankAccount->id,
                        'recipient_code' => $bankAccount->recipient_code
                    ])
                ]);

                // Update user's wallet balance
                $user->decrement('wallet_balance', $request->amount);

                DB::commit();

                return response()->json([
                    'message' => 'Withdrawal request submitted successfully',
                    'transaction' => $transaction
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Withdrawal failed: ' . $e->getMessage());
            return response()->json(['error' => 'Withdrawal failed. Please try again later.'], 500);
        }
    }

    public function getBankAccounts()
    {
        try {
            $user = auth()->user();
            $bankAccounts = BankAccount::where('user_id', $user->id)->get();
            return response()->json($bankAccounts);
        } catch (\Exception $e) {
            Log::error('Failed to fetch bank accounts: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch bank accounts'], 500);
        }
    }

    public function setDefaultAccount(Request $request)
    {
        $request->validate([
            'bank_account_id' => 'required|exists:bank_accounts,id'
        ]);

        try {
            $user = auth()->user();
            $bankAccount = BankAccount::findOrFail($request->bank_account_id);

            if ($bankAccount->user_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $bankAccount->setAsDefault();

            return response()->json(['message' => 'Default bank account updated successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to set default bank account: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to set default bank account'], 500);
        }
    }
}
