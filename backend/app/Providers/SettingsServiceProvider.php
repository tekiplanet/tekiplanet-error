<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Setting;

class SettingsServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton('settings', function ($app) {
            return Setting::first() ?? new Setting();
        });
    }
} 