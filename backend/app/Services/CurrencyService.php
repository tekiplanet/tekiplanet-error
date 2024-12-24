<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class CurrencyService
{
    protected $apiKey;
    protected $baseUrl = 'https://v6.exchangerate-api.com/v6/';

    public function __construct()
    {
        $this->apiKey = config('services.exchangerate.key');
    }

    public function convertToNGN($amount, $fromCurrency)
    {
        if ($fromCurrency === 'NGN') {
            return $amount;
        }

        $rate = $this->getExchangeRate($fromCurrency, 'NGN');
        return $amount * $rate;
    }

    protected function getExchangeRate($from, $to)
    {
        $cacheKey = "exchange_rate_{$from}_{$to}";

        // Cache the rate for 24 hours to avoid hitting API limits
        return Cache::remember($cacheKey, 60 * 60 * 24, function () use ($from, $to) {
            $response = Http::get("{$this->baseUrl}{$this->apiKey}/pair/{$from}/{$to}");
            
            if ($response->successful()) {
                return $response->json()['conversion_rate'];
            }

            // Fallback to 1 if API fails
            return 1;
        });
    }
}
