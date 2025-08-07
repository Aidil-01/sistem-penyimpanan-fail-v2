<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Set the correct paths for Vercel
$_ENV['APP_BASE_PATH'] = __DIR__ . '/..';

if (file_exists($maintenance = $_ENV['APP_BASE_PATH'].'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require_once $_ENV['APP_BASE_PATH'].'/vendor/autoload.php';

$app = require_once $_ENV['APP_BASE_PATH'].'/bootstrap/app.php';

// Set the public path for Laravel to work with Vercel
$app->bind('path.public', function() {
    return $_ENV['APP_BASE_PATH'] . '/public';
});

$kernel = $app->make(Kernel::class);

$response = $kernel->handle(
    $request = Request::capture()
);

$response->send();

$kernel->terminate($request, $response);