<?php
header('Content-Type: text/plain; charset=UTF-8');

// CORS
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$logFile = __DIR__ . '/audit.txt';

if (!file_exists($logFile)) {
    http_response_code(404);
    echo 'Log file not found';
    exit;
}

readfile($logFile);
