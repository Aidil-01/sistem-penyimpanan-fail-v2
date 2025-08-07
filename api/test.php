<?php
// Simple PHP test file for Vercel deployment verification

header('Content-Type: application/json');

$response = [
    'status' => 'success',
    'message' => 'PHP runtime is working correctly on Vercel!',
    'php_version' => PHP_VERSION,
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'php_sapi' => PHP_SAPI,
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time')
    ],
    'laravel_paths' => [
        'base' => realpath(__DIR__ . '/..'),
        'vendor_exists' => file_exists(__DIR__ . '/../vendor/autoload.php'),
        'composer_exists' => file_exists(__DIR__ . '/../composer.json')
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>