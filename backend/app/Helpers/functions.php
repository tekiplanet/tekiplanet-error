<?php

use App\Helpers\CurrencyHelper;

if (!function_exists('formatCurrency')) {
    function formatCurrency($amount, $currency = 'NGN') {
        return CurrencyHelper::formatCurrency($amount, $currency);
    }
} 