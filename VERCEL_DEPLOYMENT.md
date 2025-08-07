# Vercel Deployment Guide - SPF Tongod

## 🚀 Quick Deploy

### Prerequisites
- Vercel CLI installed: `npm i -g vercel`
- Railway PostgreSQL database running
- Laravel app key generated

### ⚠️ Common Issue: "invalid runtime nodejs18.x" 
If you see this error, it means Vercel detected Node.js instead of PHP. This has been fixed with:
- Specific PHP runtime configuration in `vercel.json`
- Proper function definition for `api/index.php`
- Laravel-optimized serverless entry point

### Step 1: Environment Setup
1. Generate app key:
```bash
php artisan key:generate
```

2. Copy the generated key from `.env` file (starts with `base64:`)

### Step 2: Vercel Environment Variables
Set these in your Vercel dashboard or via CLI:

```bash
vercel env add APP_NAME "Sistem Penyimpanan Fail Tongod"
vercel env add APP_ENV production
vercel env add APP_KEY "base64:your-generated-key-here"
vercel env add APP_DEBUG false
vercel env add APP_URL "https://your-vercel-url.vercel.app"
vercel env add DB_CONNECTION pgsql
vercel env add DB_HOST postgres.railway.internal
vercel env add DB_PORT 5432
vercel env add DB_DATABASE railway
vercel env add DB_USERNAME postgres
vercel env add DB_PASSWORD NvOz72WrYxgvbMafHFyELjMQtdQZIKLU
vercel env add LOG_CHANNEL stderr
vercel env add SESSION_DRIVER array
vercel env add CACHE_DRIVER array
vercel env add QUEUE_CONNECTION sync
```

### Step 3: Deploy
```bash
vercel --prod
```

## 📱 PWA Features

Your PWA will be accessible at:
- **Manifest**: `https://your-domain.vercel.app/manifest.json`
- **Service Worker**: `https://your-domain.vercel.app/sw.js`
- **Offline Page**: `https://your-domain.vercel.app/offline.html`
- **Icons**: `https://your-domain.vercel.app/icon-192x192.svg`

## 🔧 File Structure

```
├── api/
│   └── index.php          # Vercel PHP entry point
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js             # Service worker
│   ├── offline.html      # Offline page
│   ├── icon-*.svg        # App icons
│   └── ...               # Static assets
├── vercel.json           # Vercel configuration
└── .vercelignore         # Deployment exclusions
```

## 🐛 Troubleshooting

### Issue: Raw PHP code displayed
- **Cause**: Vercel not recognizing PHP files
- **Solution**: Ensure `api/index.php` exists and routes in `vercel.json` are correct

### Issue: 404 on routes
- **Cause**: Laravel routing not working
- **Solution**: Check that all routes go to `/api/index.php`

### Issue: Database connection failed
- **Cause**: Incorrect database credentials
- **Solution**: Verify Railway PostgreSQL credentials in environment variables

### Issue: PWA not installing
- **Cause**: Manifest or service worker not served correctly
- **Solution**: Check Vercel routes for PWA files are properly configured

## 🔒 Security Notes

1. **Never commit** `.env` files to version control
2. **Generate unique APP_KEY** for production
3. **Use HTTPS** for PWA functionality
4. **Set APP_DEBUG=false** in production

## ⚡ Performance Tips

1. **Caching**: Laravel config and routes are cached automatically
2. **Assets**: Static files are served with long-term caching headers
3. **Database**: Consider connection pooling for Railway PostgreSQL

## 🌍 Going Live

1. Update `APP_URL` in environment variables to your custom domain
2. Configure custom domain in Vercel dashboard
3. Test PWA installation on mobile devices
4. Monitor logs via `vercel logs`

## 📞 Support

If you encounter issues:
1. Check Vercel build logs: `vercel logs`
2. Verify environment variables: `vercel env ls`
3. Test locally with `vercel dev`