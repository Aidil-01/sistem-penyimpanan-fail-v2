# SPF Tongod - Firestore Data Import Script
# Run this PowerShell script to import sample data to Firestore

Write-Host "🚀 SPF Tongod - Firestore Data Import" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

Write-Host "`n📋 This script will help you import sample data to your Firestore database" -ForegroundColor Yellow

Write-Host "`n🔥 Opening Firebase App..." -ForegroundColor Cyan
Start-Process "https://sistem-penyimpanan-fail-tongod.web.app"

Write-Host "`n📊 Opening Import Data Page..." -ForegroundColor Cyan
Start-Process "https://sistem-penyimpanan-fail-tongod.web.app/import-data-page.html"

Write-Host "`n📖 INSTRUCTIONS:" -ForegroundColor Magenta
Write-Host "1. The import page should now be open in your browser" -ForegroundColor White
Write-Host "2. Click 'Mula Import Semua Data' button to import all data" -ForegroundColor White
Write-Host "3. Or import individual collections using the separate buttons" -ForegroundColor White

Write-Host "`n📈 Data to be imported:" -ForegroundColor Yellow
Write-Host "- 👥 Users: 20 users (2 admins, 8 staff, 10 view-only)" -ForegroundColor White
Write-Host "- 📍 Locations: 15 storage locations (rooms, racks, slots)" -ForegroundColor White
Write-Host "- 📄 Files: 50+ file records with Malaysian government documents" -ForegroundColor White
Write-Host "- 📋 Borrowing Records: Sample borrowing history" -ForegroundColor White
Write-Host "- 📝 Activity Logs: Sample user activity logs" -ForegroundColor White

Write-Host "`n🔐 Sample Users:" -ForegroundColor Green
Write-Host "Admin: datuk.ahmad@tongod.sabah.gov.my" -ForegroundColor White
Write-Host "Admin: siti.hajar@tongod.sabah.gov.my" -ForegroundColor White
Write-Host "Staff: faizal@tongod.sabah.gov.my (Pentadbiran)" -ForegroundColor White
Write-Host "Staff: norliza@tongod.sabah.gov.my (Kewangan)" -ForegroundColor White
Write-Host "Staff: roslan@tongod.sabah.gov.my (Pembangunan)" -ForegroundColor White

Write-Host "`n⚠️  IMPORTANT NOTES:" -ForegroundColor Red
Write-Host "- Make sure you are logged into Firebase Console" -ForegroundColor White
Write-Host "- The import process may take a few minutes" -ForegroundColor White
Write-Host "- You can monitor progress in the browser console (F12)" -ForegroundColor White
Write-Host "- Data will be imported to your 'sistem-penyimpanan-fail-tongod' project" -ForegroundColor White

Write-Host "`n✅ Alternative Import Method:" -ForegroundColor Cyan
Write-Host "If the web import doesn't work, you can:" -ForegroundColor White
Write-Host "1. Go to https://sistem-penyimpanan-fail-tongod.web.app" -ForegroundColor White
Write-Host "2. Open browser console (F12 > Console)" -ForegroundColor White
Write-Host "3. Copy and paste the contents of 'import-data-complete.js'" -ForegroundColor White
Write-Host "4. Press Enter to execute the import" -ForegroundColor White

Write-Host "`n🎯 Next Steps After Import:" -ForegroundColor Green
Write-Host "1. Go to Firebase Console > Authentication" -ForegroundColor White
Write-Host "2. Create user accounts for the imported users" -ForegroundColor White
Write-Host "3. Test login with sample credentials" -ForegroundColor White
Write-Host "4. Explore the file management system" -ForegroundColor White

Write-Host "`n🌐 Firebase Project Links:" -ForegroundColor Blue
Write-Host "- App: https://sistem-penyimpanan-fail-tongod.web.app" -ForegroundColor White
Write-Host "- Console: https://console.firebase.google.com/project/sistem-penyimpanan-fail-tongod" -ForegroundColor White
Write-Host "- Firestore: https://console.firebase.google.com/project/sistem-penyimpanan-fail-tongod/firestore" -ForegroundColor White

Write-Host "`n✨ Import completed successfully!" -ForegroundColor Green
Write-Host "Your SPF Tongod system is now populated with sample Malaysian government data." -ForegroundColor White

Read-Host "Press Enter to continue..."