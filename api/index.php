<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Vercel serverless function entry point for Laravel
// Set the correct paths for Vercel deployment
$app_base = realpath(__DIR__ . '/..');

// Check if we're in Vercel environment
$is_vercel = isset($_ENV['VERCEL']) || isset($_ENV['NOW_REGION']);

if ($is_vercel) {
    // Vercel specific configurations
    $_ENV['APP_BASE_PATH'] = $app_base;
    $_ENV['STORAGE_PATH'] = '/tmp/storage';
    
    // Create storage directories in /tmp for Vercel
    if (!file_exists('/tmp/storage')) {
        mkdir('/tmp/storage', 0755, true);
        mkdir('/tmp/storage/logs', 0755, true);
        mkdir('/tmp/storage/framework', 0755, true);
        mkdir('/tmp/storage/framework/cache', 0755, true);
        mkdir('/tmp/storage/framework/sessions', 0755, true);
        mkdir('/tmp/storage/framework/views', 0755, true);
    }
}

// Check for maintenance mode
if (file_exists($maintenance = $app_base.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Load Composer autoloader
if (!file_exists($app_base.'/vendor/autoload.php')) {
    http_response_code(500);
    echo 'Error: Dependencies not installed. Please run "composer install"';
    exit(1);
}

require_once $app_base.'/vendor/autoload.php';

// Bootstrap Laravel application
$app = require_once $app_base.'/bootstrap/app.php';

// Set the public path for Laravel to work with Vercel
$app->bind('path.public', function() use ($app_base) {
    return $app_base . '/public';
});

// Override storage path for Vercel
if ($is_vercel) {
    $app->bind('path.storage', function() {
        return '/tmp/storage';
    });
}

$kernel = $app->make(Kernel::class);

try {
    $response = $kernel->handle(
        $request = Request::capture()
    );

    $response->send();

    $kernel->terminate($request, $response);
} catch (Exception $e) {
    http_response_code(500);
    if (env('APP_DEBUG', false)) {
        echo 'Laravel Error: ' . $e->getMessage();
    } else {
        echo 'Application Error';
    }
}