# Sistem Penyimpanan Fail Tongod - Firebase PWA

A modern file storage management system converted from Laravel to Firebase, featuring Progressive Web App (PWA) capabilities for offline access.

## 🚀 Features

### Core Functionality
- **File Management**: Create, read, update, delete file records
- **Location Tracking**: Physical storage location management (room-rack-slot system)
- **Borrowing System**: File lending with approval workflow and due date tracking
- **User Management**: Role-based access control (Admin, Staff, View-only)
- **Activity Logging**: Complete audit trail of all system actions
- **Search & Filtering**: Advanced file search and filtering capabilities

### PWA Features
- **Offline Support**: Works without internet connection
- **Installable**: Can be installed as native app on mobile and desktop
- **Push Notifications**: Real-time notifications for overdue files and updates
- **Background Sync**: Syncs data when connection is restored
- **Responsive Design**: Optimized for all device sizes

### Security
- **Firebase Authentication**: Secure user login and session management
- **Role-based Access Control**: Granular permissions based on user roles
- **Firestore Security Rules**: Server-side data validation and access control
- **Activity Monitoring**: Complete audit trail with IP and user agent tracking

## 📁 Project Structure

```
firebase-conversion/
├── index.html              # Main application entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker for offline functionality
├── offline.html            # Offline fallback page
├── firebase.json           # Firebase hosting configuration
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Database indexes
├── js/
│   ├── firebase-config.js  # Firebase SDK configuration
│   ├── auth.js            # Authentication management
│   ├── models.js          # Data models and Firestore operations
│   ├── app.js             # Main application logic
│   └── pwa-install.js     # PWA installation handling
├── assets/
│   ├── css/
│   │   └── style.css      # Application styles
│   └── icons/             # PWA icons (192x192, 512x512, etc.)
└── README.md              # This file
```

## 🛠 Setup Instructions

### Prerequisites
- Node.js (version 16 or later)
- Firebase CLI
- A Google/Firebase account

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project called "sistem-penyimpanan-fail-tongod"
3. Enable the following services:
   - Authentication (Email/Password provider)
   - Firestore Database
   - Hosting
   - Storage (optional, for file attachments)

### 2. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 3. Initialize Firebase Project

```bash
cd firebase-conversion
firebase init
```

Select the following options:
- ✅ Firestore: Configure security rules and indexes files
- ✅ Hosting: Configure files for Firebase Hosting
- Use existing project: sistem-penyimpanan-fail-tongod
- Firestore rules file: firestore.rules
- Firestore indexes file: firestore.indexes.json
- Public directory: . (current directory)
- Single-page app: Yes
- Overwrite index.html: No

### 4. Configure Firebase SDK

Edit `js/firebase-config.js` and replace the configuration object with your project's config:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};
```

You can find these values in:
Firebase Console → Project Settings → General → Your apps → Config

### 5. Set up Authentication

1. In Firebase Console, go to Authentication → Sign-in method
2. Enable "Email/Password" provider
3. Create initial admin user:
   - Go to Authentication → Users
   - Add user with email and password
   - Note the User UID for next step

### 6. Initialize Database with Admin User

1. Go to Firestore Database in Firebase Console
2. Create a new document in the `users` collection with the admin UID:

```json
{
  "name": "Administrator",
  "email": "admin@tongod.gov.my",
  "role": "admin",
  "department": "Pentadbiran",
  "position": "Pentadbir Sistem",
  "phone": "",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 7. Deploy to Firebase

```bash
firebase deploy
```

This will deploy:
- Firestore security rules
- Firestore indexes
- Web app to Firebase Hosting

### 8. Test the Application

1. Open the deployed URL (shown after deployment)
2. Login with the admin credentials you created
3. Test basic functionality:
   - Create locations
   - Add files
   - Create borrowing records
   - Test PWA installation

## 🔧 Development Setup

### Local Development

1. Install Firebase emulators:

```bash
firebase init emulators
```

Select: Authentication, Firestore, Hosting

2. Start local development:

```bash
firebase emulators:start
```

3. Open http://localhost:5000 in your browser

### Testing PWA Features

1. Use Chrome DevTools → Application → Service Workers
2. Test offline functionality by going offline in DevTools
3. Test PWA installation using the install prompt

## 📱 PWA Installation Guide

### Android (Chrome)
1. Open the web app in Chrome
2. Tap the menu (⋮) → "Install app" or "Add to Home screen"
3. Tap "Install"

### iOS (Safari)
1. Open the web app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

### Desktop (Chrome/Edge)
1. Look for the install icon (⊕) in the address bar
2. Click it and confirm installation
3. Or use Chrome menu → "Install [App Name]"

## 🔐 User Roles and Permissions

### Admin (`admin`)
- Full system access
- User management
- All file operations
- System configuration
- Reports and analytics

### Staff Jabatan (`staff_jabatan`)
- File management
- Borrowing management
- Location management
- Reports viewing

### Staff Pembantu (`staff_pembantu`)
- File management
- Borrowing management
- Location management

### User View Only (`user_view`)
- View files only
- View own borrowing history

## 🗄 Database Collections

### Users
```json
{
  "name": "string",
  "email": "string",
  "role": "admin|staff_jabatan|staff_pembantu|user_view",
  "department": "string",
  "position": "string",
  "phone": "string",
  "is_active": "boolean",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Files
```json
{
  "file_id": "string (auto-generated)",
  "title": "string",
  "reference_number": "string",
  "document_year": "number",
  "department": "string",
  "document_type": "surat_rasmi|perjanjian|permit|laporan|lain_lain",
  "description": "string",
  "status": "tersedia|dipinjam|arkib|tidak_aktif",
  "location_id": "string",
  "created_by": "string (user ID)",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Locations
```json
{
  "room": "string",
  "rack": "string",
  "slot": "string",
  "description": "string",
  "is_available": "boolean",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Borrowing Records
```json
{
  "file_id": "string",
  "borrower_id": "string",
  "approved_by": "string",
  "purpose": "string",
  "borrowed_date": "date",
  "due_date": "date",
  "returned_date": "date",
  "returned_to": "string",
  "status": "dipinjam|dikembalikan",
  "notes": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## 🔧 Customization

### Styling
- Edit `assets/css/style.css` for visual customization
- Modify CSS variables at the top of the file for color scheme changes

### Adding New Features
1. Add new models in `js/models.js`
2. Add new pages in `js/app.js`
3. Update Firestore security rules in `firestore.rules`
4. Add new indexes in `firestore.indexes.json` if needed

### Localization
The system is currently in Bahasa Malaysia. To add English support:
1. Create language files in `js/i18n/`
2. Update text strings throughout the application
3. Add language selector to the UI

## 🚨 Troubleshooting

### Common Issues

1. **Firebase config not found**
   - Ensure `firebase-config.js` has correct project configuration

2. **Authentication not working**
   - Check if Email/Password provider is enabled in Firebase Console
   - Verify user exists in Authentication → Users

3. **Firestore permission denied**
   - Check Firestore security rules
   - Ensure user has correct role in users collection

4. **PWA not installing**
   - Must be served over HTTPS (Firebase Hosting provides this)
   - Check manifest.json is accessible
   - Ensure service worker is registered correctly

5. **Offline functionality not working**
   - Check service worker registration
   - Verify cache strategies in sw.js
   - Check browser's Application → Storage

### Performance Optimization

1. **Image Optimization**
   - Compress PWA icons
   - Use WebP format where supported

2. **Bundle Size**
   - Consider using Firebase SDK v9 modular approach
   - Remove unused CSS/JS

3. **Database Optimization**
   - Use compound indexes for complex queries
   - Implement pagination for large datasets
   - Consider using Firebase Analytics for usage insights

## 📈 Monitoring and Analytics

### Firebase Analytics
1. Enable Google Analytics in Firebase Console
2. Add measurement ID to firebase-config.js
3. Track user interactions and app performance

### Error Tracking
Consider integrating:
- Firebase Crashlytics for error reporting
- Performance Monitoring for app performance metrics

## 🔄 Backup and Migration

### Data Export
Use Firebase CLI to export data:
```bash
firebase firestore:export gs://your-bucket/backup-folder
```

### Laravel to Firebase Migration
If migrating from existing Laravel system:
1. Export data from MySQL/PostgreSQL
2. Transform data to Firestore format
3. Use Firebase Admin SDK to import data
4. Update user authentication (create Firebase users)

## 📞 Support

For technical support or questions:
- Create issues in the project repository
- Check Firebase documentation: https://firebase.google.com/docs
- PWA best practices: https://web.dev/progressive-web-apps/

## 📄 License

This project is developed for Pejabat Daerah Tongod and is proprietary software.

---

**SPF Tongod - Firebase PWA Version 1.0.0**  
*Developed for modern file management with offline capabilities*