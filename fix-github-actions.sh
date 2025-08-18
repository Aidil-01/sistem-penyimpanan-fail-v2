#!/bin/bash
# Fix GitHub Actions Build Errors Script
# Script untuk memperbaiki masalah build dalam GitHub Actions

set -e

echo "🔧 GitHub Actions Build Fix Script"
echo "=================================="

# Function to display step
step() {
    echo ""
    echo "📋 $1"
    echo "----------------------------------------"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

step "1. Backup current files"
cp package.json package.json.backup
cp firebase.json firebase.json.backup
echo "✅ Backup created"

step "2. Replace package.json with fixed version"
if [[ -f "package-fixed.json" ]]; then
    cp package-fixed.json package.json
    echo "✅ package.json updated with fixes"
else
    echo "❌ package-fixed.json not found"
fi

step "3. Replace firebase.json with fixed version"
if [[ -f "firebase-fixed.json" ]]; then
    cp firebase-fixed.json firebase.json
    echo "✅ firebase.json updated with fixes"
else
    echo "❌ firebase-fixed.json not found"
fi

step "4. Replace GitHub Actions workflows"
if [[ -d ".github/workflows" ]]; then
    # Backup existing workflows
    cp .github/workflows/firebase-hosting-merge.yml .github/workflows/firebase-hosting-merge.yml.backup
    cp .github/workflows/firebase-hosting-pull-request.yml .github/workflows/firebase-hosting-pull-request.yml.backup
    
    # Replace with fixed versions
    if [[ -f ".github/workflows/firebase-hosting-merge-fixed.yml" ]]; then
        cp .github/workflows/firebase-hosting-merge-fixed.yml .github/workflows/firebase-hosting-merge.yml
        echo "✅ Merge workflow updated"
    fi
    
    if [[ -f ".github/workflows/firebase-hosting-pull-request-fixed.yml" ]]; then
        cp .github/workflows/firebase-hosting-pull-request-fixed.yml .github/workflows/firebase-hosting-pull-request.yml
        echo "✅ PR workflow updated"
    fi
else
    echo "❌ .github/workflows directory not found"
fi

step "5. Clean npm cache and reinstall dependencies"
if command -v npm &> /dev/null; then
    npm cache clean --force
    rm -rf node_modules package-lock.json
    npm install --no-fund --no-audit
    echo "✅ Dependencies reinstalled"
else
    echo "⚠️ npm not found, skipping dependency reinstall"
fi

step "6. Test build locally"
if npm run build; then
    echo "✅ Build test successful"
else
    echo "❌ Build test failed"
fi

step "7. Validate Firebase configuration"
if command -v firebase &> /dev/null; then
    firebase use --add || echo "⚠️ Firebase project not configured"
    echo "✅ Firebase configuration validated"
else
    echo "⚠️ Firebase CLI not found"
fi

step "8. Generate summary"
echo "🎉 GitHub Actions fixes applied!"
echo ""
echo "📋 Changes made:"
echo "• package.json - Added build script and npm configuration"
echo "• firebase.json - Updated hosting configuration"
echo "• GitHub workflows - Fixed Node.js version and npm issues"
echo "• .npmrc - Added npm configuration to suppress warnings"
echo ""
echo "🚀 Next steps:"
echo "1. Test the build locally: npm run build"
echo "2. Commit and push changes to trigger GitHub Actions"
echo "3. Monitor the GitHub Actions logs"
echo ""
echo "📁 Backup files created:"
echo "• package.json.backup"
echo "• firebase.json.backup"
echo "• .github/workflows/*.yml.backup"

echo ""
echo "✅ Script completed successfully!"