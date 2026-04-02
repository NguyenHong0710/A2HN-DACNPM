<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Thay '*' bằng URL cụ thể của React để tránh lỗi bảo mật khi dùng Sanctum
    'allowed_origins' => [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // CHUYỂN THÀNH TRUE: Quan trọng để Sanctum có thể gửi/nhận Cookie/Token
    'supports_credentials' => true, 

];