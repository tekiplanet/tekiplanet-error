<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */



    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost',
    ],

    'allowed_origins_patterns' => [
        // Allow all localhost ports
        '#^http://localhost:[0-9]+$#',
        // Allow all 192.168.* IP addresses
        '#^http://192\.168\.[0-9]+\.[0-9]+:[0-9]+$#'
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, // Enable credentials for authentication

];
