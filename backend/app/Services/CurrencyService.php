<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CurrencyService
{
    protected $apiKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->apiKey = env('EXCHANGE_RATE_API_KEY');
        $this->baseUrl = "https://v6.exchangerate-api.com/v6/{$this->apiKey}/latest/";
    }

    public function convertToNGN($amount, $fromCurrency)
    {
        Log::info('Starting currency conversion', [
            'amount' => $amount,
            'from_currency' => $fromCurrency,
            'api_key_exists' => !empty($this->apiKey)
        ]);

        if ($fromCurrency === 'NGN') {
            return $amount;
        }

        try {
            $cacheKey = "exchange_rate_{$fromCurrency}_NGN";

            // Get exchange rate from cache or API
            $rate = Cache::remember($cacheKey, 3600, function () use ($fromCurrency) {
                Log::info('Fetching fresh exchange rate', [
                    'url' => "{$this->baseUrl}{$fromCurrency}",
                    'from_currency' => $fromCurrency
                ]);

                $response = Http::get("{$this->baseUrl}{$fromCurrency}");
                
                Log::info('API Response', [
                    'status' => $response->status(),
                    'body' => $response->json()
                ]);

                if (!$response->successful()) {
                    throw new \Exception('Failed to fetch exchange rate: ' . $response->body());
                }

                $data = $response->json();
                $rate = $data['conversion_rates']['NGN'] ?? null;

                Log::info('Exchange rate fetched', [
                    'rate' => $rate,
                    'from_currency' => $fromCurrency
                ]);

                return $rate;
            });

            if (!$rate) {
                throw new \Exception("Could not get exchange rate for {$fromCurrency}");
            }

            $convertedAmount = round($amount * $rate, 2);

            Log::info('Currency conversion completed', [
                'from_currency' => $fromCurrency,
                'amount' => $amount,
                'rate' => $rate,
                'converted_amount' => $convertedAmount
            ]);

            return $convertedAmount;

        } catch (\Exception $e) {
            Log::error('Currency conversion failed:', [
                'error' => $e->getMessage(),
                'from_currency' => $fromCurrency,
                'amount' => $amount,
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
    }
}
