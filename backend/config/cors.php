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
        'http://localhost:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
        'http://192.168.100.78:5174',
        'http://192.168.100.78:5175',
        'http://192.168.100.78:8000',
        'http://192.168.100.78',
        'http://192.168.2.87:5174',
        'http://192.168.2.87:5175',
        'http://192.168.2.87:8000',
        'http://192.168.2.87',
        'http://127.0.0.1:8001',
        'capacitor://localhost',
        'http://localhost',
        'http://localhost:8000',
        'http://192.168.100.*',
        'http://192.168.2.*',
    ],

    'allowed_origins_patterns' => [
        '/^http:\/\/localhost:\d+$/',
        '/^http:\/\/127\.0\.0\.1:\d+$/',
        '/^http:\/\/192\.168\.\d+\.\d+$/',
        '/^http:\/\/192\.168\.\d+\.\d+:\d+$/',
        '/^capacitor:\/\/.*$/',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
