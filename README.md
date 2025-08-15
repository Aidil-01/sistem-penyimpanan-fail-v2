# Sistem Penyimpanan Fail Tongod v2.0

Firebase-powered Progressive Web App untuk pengurusan dokumen pejabat.

## 🚀 Live Demo

- **Production**: https://sistem-penyimpanan-fail-tongod.web.app
- **Firebase Console**: https://console.firebase.google.com/project/sistem-penyimpanan-fail-tongod/overview

## ✨ Features

### Sistem Utama
- 📁 **File Management** - Upload, organize, dan track dokumen
- 📍 **Location Management** - Manage lokasi penyimpanan (Bilik → Rak → Slot)
- 👥 **User Management** - Role-based access control
- 📋 **Borrowing System** - Track peminjaman dokumen
- 📊 **Dashboard & Reports** - Analytics dan laporan
- 🔍 **Advanced Search** - Cari dokumen dengan metadata

### Technical Features
- 💻 **Progressive Web App (PWA)** - Install sebagai app
- 📱 **Responsive Design** - Mobile-first approach
- 🔥 **Firebase Backend** - Real-time database
- ⚡ **Offline Support** - Kerja tanpa internet
- 🔐 **Authentication** - Google OAuth + Email/Password
- 🏗️ **Modern Stack** - HTML5, CSS3, ES6+, Bootstrap 5

## 🛠️ Setup Development

### Prerequisites
- Node.js 16+
- Firebase CLI
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/Aidil-01/sistem-penyimpanan-fail-v2.git
cd sistem-penyimpanan-fail-v2

# Install dependencies
npm install

# Login to Firebase
firebase login

# Set Firebase project
firebase use sistem-penyimpanan-fail-tongod
```

### Development Server

```bash
# Serve locally
firebase serve
# Access: http://localhost:5000
```

### Deploy

```bash
# Deploy to Firebase
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Deploy Firestore rules only
firebase deploy --only firestore
```

## 📊 Upload Dummy Data

### Method 1: Browser Upload (Recommended)
1. Buka: `firebase-conversion/upload-data-browser.html`
2. Klik "Test Connection"
3. Klik "Upload Data"
4. Data akan di-upload ke Firebase

### Method 2: CLI Upload
```bash
# Upload using Node.js script
npm run upload-data

# Clean all data and upload fresh
npm run clean-upload
```

### Method 3: Manual Setup
1. Buka: `firebase-conversion/setup-data.html`
2. Ikut arahan di interface

## 📁 Project Structure

```
sistem-penyimpanan-fail-v2/
├── firebase-conversion/          # Main application
│   ├── js/                      # JavaScript modules
│   │   ├── firebase-config.js   # Firebase configuration
│   │   ├── auth.js             # Authentication
│   │   ├── app.js              # Main app logic
│   │   ├── locations.js        # Location management
│   │   ├── models.js           # Data models
│   │   └── utils.js            # Utility functions
│   ├── assets/                 # Static assets
│   ├── index.html              # Main application
│   ├── locations.html          # Location management page
│   ├── setup-data.html         # Data setup interface
│   ├── test-locations.html     # Testing interface
│   └── upload-data-browser.html # Browser upload tool
├── firebase.json               # Firebase configuration
├── firestore.rules            # Database security rules
├── firestore.indexes.json     # Database indexes
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## 🔧 Configuration

### Firebase Config
File: `firebase-conversion/js/firebase-config.js`
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDVHVJlKBIqBtly_pPg8E9vg8kOb_Cv6vk",
    authDomain: "sistem-penyimpanan-fail-tongod.firebaseapp.com",
    projectId: "sistem-penyimpanan-fail-tongod",
    storageBucket: "sistem-penyimpanan-fail-tongod.firebasestorage.app",
    messagingSenderId: "639209872138",
    appId: "1:639209872138:web:c408eb225a2a7f9c8f38f3"
};
```

### Database Structure
```
locations/          # Location hierarchy
├── {id}
│   ├── name: string
│   ├── type: 'room'|'rack'|'slot'
│   ├── parentId: string|null
│   ├── status: 'empty'|'occupied'|'maintenance'
│   └── ...

files/             # Document metadata
├── {id}
│   ├── file_id: string
│   ├── title: string
│   ├── department: string
│   ├── status: 'tersedia'|'dipinjam'|'arkib'
│   └── ...

users/             # User accounts
└── borrowing_records/  # Borrowing history
```

## 🎯 Dummy Data

### Locations (11 total)
- **3 Bilik**: Pentadbiran A, Kewangan, Arkib
- **4 Rak**: 2 dalam Pentadbiran A, 2 dalam Kewangan  
- **4 Slot**: Dalam rak-rak yang ada

### Files (5 dokumen)
- ADM001: Surat Arahan Baharu 2024
- KEW001: Laporan Kewangan Q1 2024
- KEW002: Baucer Perbelanjaan Januari (dipinjam)
- ADM002: Minit Mesyuarat Bulanan
- ARK001: Dokumen Arkib Lama 2020

### Users (3 pengguna)
- Ahmad Bin Ali (Admin)
- Siti Aminah (Staff Jabatan)
- Raj Kumar (Staff Pembantu)

## 🐛 Troubleshooting

### Loading Issues
- Sistem akan auto-fallback ke dummy data jika Firebase gagal
- Check browser console untuk error messages
- Pastikan Firebase project aktif

### Authentication Issues
- Enable Authentication di Firebase Console
- Add domain ke Authorized domains
- Check network connectivity

### Data Upload Issues
- Gunakan `upload-data-browser.html` untuk troubleshooting
- Check Firestore rules
- Verify project permissions

## 📝 Scripts Available

```bash
npm run upload-data      # Upload dummy data
npm run clean-upload     # Clean + upload data
npm run deploy           # Deploy to Firebase
npm run serve            # Local development server
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Aidil**
- GitHub: [@Aidil-01](https://github.com/Aidil-01)
- Project: [sistem-penyimpanan-fail-v2](https://github.com/Aidil-01/sistem-penyimpanan-fail-v2)

---

## 🔄 Version History

### v2.0.0 (Current)
- ✅ Fixed infinite loading issue
- ✅ Added comprehensive dummy data system
- ✅ Firebase integration with PWA
- ✅ Multiple upload methods for data
- ✅ Production deployment ready
- ✅ Complete documentation

### v1.0.0
- Basic PHP/MySQL system
- Local XAMPP deployment only

---

*Sistem ini dibangunkan untuk Pejabat Daerah Tongod dengan teknologi Firebase dan PWA.*