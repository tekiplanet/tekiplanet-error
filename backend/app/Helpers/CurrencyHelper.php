<?php

namespace App\Helpers;

class CurrencyHelper
{
    public static function formatCurrency($amount, $currency = 'NGN')
    {
        $symbol = '₦'; // Default to Naira symbol
        
        // Add more currency symbols as needed
        $symbols = [
            'NGN' => '₦',
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£'
        ];

        if (isset($symbols[$currency])) {
            $symbol = $symbols[$currency];
        }

        return $symbol . number_format($amount, 2);
    }
} 