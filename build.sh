#!/bin/bash

echo "🔧 Starting Vercel PHP build process..."

# Install Composer dependencies
echo "📦 Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Create required directories for Laravel
echo "📁 Creating required directories..."
mkdir -p storage/logs
mkdir -p storage/framework/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p bootstrap/cache

# Set proper permissions
echo "🔒 Setting permissions..."
chmod -R 755 storage
chmod -R 755 bootstrap/cache

# Create .env if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from example..."
    cp .env.example .env
fi

# Generate app key if needed
echo "🔑 Checking application key..."
if ! grep -q "APP_KEY=base64:" .env; then
    echo "Generating new application key..."
    php artisan key:generate --no-interaction
fi

echo "✅ Build process completed successfully!"
echo "📱 PWA files are ready for deployment"