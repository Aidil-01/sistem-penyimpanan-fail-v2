#!/bin/bash

# Deployment script for Vercel
echo "🚀 Preparing Laravel deployment for Vercel..."

# Generate APP_KEY if not exists
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
fi

# Generate a secure key for production
echo "🔑 Generating application key..."
php artisan key:generate --force

# Cache configuration for better performance
echo "⚡ Caching configuration..."
php artisan config:cache
php artisan route:cache

# Set proper permissions
echo "🔒 Setting permissions..."
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage/logs storage/framework

echo "✅ Deployment preparation complete!"
echo ""
echo "📌 Next steps:"
echo "1. Copy the generated APP_KEY from .env to your Vercel environment variables"
echo "2. Deploy to Vercel: vercel --prod"
echo "3. Your PWA files will be accessible at:"
echo "   - /manifest.json"
echo "   - /sw.js"
echo "   - /offline.html"
echo "   - /icon-192x192.svg"
echo "   - /icon-512x512.svg"