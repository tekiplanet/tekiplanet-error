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
        $this->baseUrl = "https://v6.exchangerate-api.com/v6/{$this->apiKey}/pair/";
    }

    public function convertToNGN($amount, $fromCurrency)
    {
        if ($fromCurrency === 'NGN') {
            return $amount;
        }

        try {
            $response = Http::get("{$this->baseUrl}{$fromCurrency}/NGN");
            
            if (!$response->successful()) {
                throw new \Exception('Failed to fetch exchange rate');
            }

            $data = $response->json();
            
            if (!isset($data['conversion_rate'])) {
                throw new \Exception('Invalid response from exchange rate API');
            }

            return round($amount * $data['conversion_rate'], 2);

        } catch (\Exception $e) {
            Log::error('Currency conversion failed:', [
                'error' => $e->getMessage(),
                'from_currency' => $fromCurrency,
                'amount' => $amount,
                'api_response' => $response->json() ?? null
            ]);
            
            // Return original amount if conversion fails
            return $amount;
        }
    }
}
