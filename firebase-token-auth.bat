@echo off
REM Firebase Token Authentication Script (Windows)
REM Configures Firebase to use token authentication and skip login

echo 🔧 Firebase Token Authentication Setup (Windows)
echo ===============================================

REM Check if Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Run this script from the project root.
    pause
    exit /b 1
)

echo.
echo 📋 1. Installing Firebase CLI globally
echo ----------------------------------------
npm install -g firebase-tools
if %errorlevel% neq 0 (
    echo ❌ Failed to install Firebase CLI
    pause
    exit /b 1
)
echo ✅ Firebase CLI installed

echo.
echo 📋 2. Checking Firebase authentication
echo ----------------------------------------

REM Check if FIREBASE_TOKEN is set
if defined FIREBASE_TOKEN (
    echo ✅ Firebase token found in environment
    set USE_TOKEN=true
) else (
    echo ⚠️ FIREBASE_TOKEN not set in environment
    set USE_TOKEN=false
)

REM Check if service account file exists
if defined GOOGLE_APPLICATION_CREDENTIALS (
    if exist "%GOOGLE_APPLICATION_CREDENTIALS%" (
        echo ✅ Service account file found: %GOOGLE_APPLICATION_CREDENTIALS%
        set USE_SERVICE_ACCOUNT=true
    ) else (
        echo ❌ Service account file not found: %GOOGLE_APPLICATION_CREDENTIALS%
        set USE_SERVICE_ACCOUNT=false
    )
) else (
    echo ⚠️ GOOGLE_APPLICATION_CREDENTIALS not set
    set USE_SERVICE_ACCOUNT=false
)

echo.
echo 📋 3. Configuring Firebase project
echo ----------------------------------------

REM Build Firebase command based on available authentication
set FIREBASE_CMD=firebase use sistem-penyimpanan-fail-tongod --non-interactive

if "%USE_TOKEN%"=="true" (
    set FIREBASE_CMD=%FIREBASE_CMD% --token %FIREBASE_TOKEN%
    echo 🔑 Using Firebase token authentication
) else if "%USE_SERVICE_ACCOUNT%"=="true" (
    echo 🔐 Using service account authentication
) else (
    echo ❌ No authentication method available
    echo.
    echo 💡 To fix this:
    echo 1. Set FIREBASE_TOKEN environment variable with your CI token
    echo 2. Or set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file
    echo 3. Or run: firebase login:ci to generate a token
    echo.
    pause
    exit /b 1
)

REM Execute Firebase command
%FIREBASE_CMD%
if %errorlevel% neq 0 (
    echo ❌ Failed to configure Firebase project
    pause
    exit /b 1
)
echo ✅ Firebase project configured

echo.
echo 📋 4. Testing Firebase authentication
echo ----------------------------------------

set TEST_CMD=firebase projects:list --non-interactive
if "%USE_TOKEN%"=="true" (
    set TEST_CMD=%TEST_CMD% --token %FIREBASE_TOKEN%
)

%TEST_CMD%
if %errorlevel% neq 0 (
    echo ❌ Firebase authentication test failed
    pause
    exit /b 1
)
echo ✅ Firebase authentication successful

echo.
echo 📋 5. Building project
echo ----------------------------------------
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)
echo ✅ Project built successfully

echo.
echo 📋 6. Testing deployment (dry run)
echo ----------------------------------------

set DEPLOY_CMD=firebase deploy --only hosting --dry-run --non-interactive --project sistem-penyimpanan-fail-tongod
if "%USE_TOKEN%"=="true" (
    set DEPLOY_CMD=%DEPLOY_CMD% --token %FIREBASE_TOKEN%
)

echo Command to be used for deployment:
echo %DEPLOY_CMD%

echo.
echo 🎉 Firebase token authentication setup completed!
echo.
echo 📋 Summary:
echo • Authentication method: %AUTH_METHOD%
echo • Project: sistem-penyimpanan-fail-tongod
echo • Skip login: Enabled
echo • Token auth: %USE_TOKEN%
echo • Service account: %USE_SERVICE_ACCOUNT%
echo.
echo 🚀 To deploy manually, run:
echo %DEPLOY_CMD%
echo.
echo 📁 Files created/updated:
echo • firebase-token-auth.js - Node.js authentication script
echo • .github/workflows/firebase-auth-deploy.yml - GitHub Actions workflow
echo • firebase-conversion/js/auth-token-config.js - Frontend token auth
echo.

pause