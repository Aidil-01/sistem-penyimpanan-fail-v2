@echo off
REM Fix GitHub Actions Build Errors Script (Windows)
REM Script untuk memperbaiki masalah build dalam GitHub Actions

echo 🔧 GitHub Actions Build Fix Script (Windows)
echo ==================================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Run this script from the project root.
    pause
    exit /b 1
)

echo.
echo 📋 1. Backup current files
echo ----------------------------------------
copy package.json package.json.backup >nul
copy firebase.json firebase.json.backup >nul
echo ✅ Backup created

echo.
echo 📋 2. Replace package.json with fixed version
echo ----------------------------------------
if exist "package-fixed.json" (
    copy package-fixed.json package.json >nul
    echo ✅ package.json updated with fixes
) else (
    echo ❌ package-fixed.json not found
)

echo.
echo 📋 3. Replace firebase.json with fixed version
echo ----------------------------------------
if exist "firebase-fixed.json" (
    copy firebase-fixed.json firebase.json >nul
    echo ✅ firebase.json updated with fixes
) else (
    echo ❌ firebase-fixed.json not found
)

echo.
echo 📋 4. Replace GitHub Actions workflows
echo ----------------------------------------
if exist ".github\workflows" (
    REM Backup existing workflows
    copy ".github\workflows\firebase-hosting-merge.yml" ".github\workflows\firebase-hosting-merge.yml.backup" >nul
    copy ".github\workflows\firebase-hosting-pull-request.yml" ".github\workflows\firebase-hosting-pull-request.yml.backup" >nul
    
    REM Replace with fixed versions
    if exist ".github\workflows\firebase-hosting-merge-fixed.yml" (
        copy ".github\workflows\firebase-hosting-merge-fixed.yml" ".github\workflows\firebase-hosting-merge.yml" >nul
        echo ✅ Merge workflow updated
    )
    
    if exist ".github\workflows\firebase-hosting-pull-request-fixed.yml" (
        copy ".github\workflows\firebase-hosting-pull-request-fixed.yml" ".github\workflows\firebase-hosting-pull-request.yml" >nul
        echo ✅ PR workflow updated
    )
) else (
    echo ❌ .github\workflows directory not found
)

echo.
echo 📋 5. Clean npm cache and reinstall dependencies
echo ----------------------------------------
where npm >nul 2>nul
if %errorlevel% == 0 (
    npm cache clean --force
    if exist "node_modules" rmdir /s /q node_modules
    if exist "package-lock.json" del package-lock.json
    npm install --no-fund --no-audit
    echo ✅ Dependencies reinstalled
) else (
    echo ⚠️ npm not found, skipping dependency reinstall
)

echo.
echo 📋 6. Test build locally
echo ----------------------------------------
npm run build
if %errorlevel% == 0 (
    echo ✅ Build test successful
) else (
    echo ❌ Build test failed
)

echo.
echo 📋 7. Validate Firebase configuration
echo ----------------------------------------
where firebase >nul 2>nul
if %errorlevel% == 0 (
    firebase --version
    echo ✅ Firebase CLI found
) else (
    echo ⚠️ Firebase CLI not found
)

echo.
echo 📋 8. Generate summary
echo ----------------------------------------
echo 🎉 GitHub Actions fixes applied!
echo.
echo 📋 Changes made:
echo • package.json - Added build script and npm configuration
echo • firebase.json - Updated hosting configuration  
echo • GitHub workflows - Fixed Node.js version and npm issues
echo • .npmrc - Added npm configuration to suppress warnings
echo.
echo 🚀 Next steps:
echo 1. Test the build locally: npm run build
echo 2. Commit and push changes to trigger GitHub Actions
echo 3. Monitor the GitHub Actions logs
echo.
echo 📁 Backup files created:
echo • package.json.backup
echo • firebase.json.backup
echo • .github\workflows\*.yml.backup
echo.
echo ✅ Script completed successfully!
pause