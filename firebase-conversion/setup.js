#!/usr/bin/env node

/**
 * Setup script for SPF Tongod Firebase PWA
 * This script helps initialize the Firebase project with sample data
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up SPF Tongod Firebase PWA...\n');

// Check if firebase-config.js has been updated
const configPath = path.join(__dirname, 'js', 'firebase-config.js');
if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    if (configContent.includes('your-api-key-here')) {
        console.log('⚠️  Warning: Please update your Firebase configuration in js/firebase-config.js');
        console.log('   You can find your config in Firebase Console → Project Settings → Config\n');
    }
}

// Sample data structure for initial setup
const sampleData = {
    users: [
        {
            id: 'admin-user-id', // This should be replaced with actual Firebase Auth UID
            name: 'Administrator',
            email: 'admin@tongod.gov.my',
            role: 'admin',
            department: 'Pentadbiran',
            position: 'Pentadbir Sistem',
            phone: '+60123456789',
            is_active: true
        },
        {
            id: 'staff-user-id-1',
            name: 'Ahmad bin Ali',
            email: 'ahmad@tongod.gov.my',
            role: 'staff_jabatan',
            department: 'Pentadbiran',
            position: 'Pegawai Tadbir',
            phone: '+60123456780',
            is_active: true
        },
        {
            id: 'staff-user-id-2',
            name: 'Siti Aminah',
            email: 'siti@tongod.gov.my',
            role: 'staff_pembantu',
            department: 'Kewangan',
            position: 'Pembantu Tadbir',
            phone: '+60123456781',
            is_active: true
        }
    ],
    locations: [
        {
            room: 'Bilik Arkib A',
            rack: 'Rak 001',
            slot: '001',
            description: 'Fail pentadbiran tahun 2024',
            is_available: true
        },
        {
            room: 'Bilik Arkib A',
            rack: 'Rak 001',
            slot: '002',
            description: 'Fail kewangan tahun 2024',
            is_available: true
        },
        {
            room: 'Bilik Arkib A',
            rack: 'Rak 002',
            slot: '001',
            description: 'Fail pembangunan tahun 2024',
            is_available: true
        },
        {
            room: 'Bilik Arkib B',
            rack: 'Rak 001',
            slot: '001',
            description: 'Fail kejuruteraan tahun 2024',
            is_available: true
        },
        {
            room: 'Bilik Arkib B',
            rack: 'Rak 001',
            slot: '002',
            description: 'Fail perancangan tahun 2024',
            is_available: true
        },
        {
            room: 'Bilik Arkib B',
            rack: 'Rak 002',
            slot: '001',
            description: 'Fail arkib lama',
            is_available: true
        }
    ],
    files: [
        {
            file_id: 'FAIL20240001',
            title: 'Surat Pekeliling Perkhidmatan Bil. 1/2024',
            reference_number: 'PD.TONGOD/100-1/1/24',
            document_year: 2024,
            department: 'Pentadbiran',
            document_type: 'surat_rasmi',
            description: 'Pekeliling berkaitan prosedur baharu pentadbiran',
            status: 'tersedia',
            location_id: 'location-1' // This should be replaced with actual location ID
        },
        {
            file_id: 'FAIL20240002',
            title: 'Laporan Kewangan Q1 2024',
            reference_number: 'PD.TONGOD/200-2/1/24',
            document_year: 2024,
            department: 'Kewangan',
            document_type: 'laporan',
            description: 'Laporan kewangan suku pertama tahun 2024',
            status: 'tersedia',
            location_id: 'location-2'
        },
        {
            file_id: 'FAIL20240003',
            title: 'Perjanjian Kontraktor Projek Jalan Raya',
            reference_number: 'PD.TONGOD/300-3/1/24',
            document_year: 2024,
            department: 'Pembangunan',
            document_type: 'perjanjian',
            description: 'Dokumen perjanjian dengan kontraktor untuk projek jalan raya',
            status: 'dipinjam',
            location_id: 'location-3'
        }
    ]
};

// Create sample data files for easy import
const sampleDataPath = path.join(__dirname, 'sample-data.json');
fs.writeFileSync(sampleDataPath, JSON.stringify(sampleData, null, 2));
console.log('✅ Sample data file created: sample-data.json');

// Create environment example file
const envExample = `# Firebase Configuration
# Get these values from Firebase Console → Project Settings → Config

FIREBASE_API_KEY=your-api-key-here
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id

# Application Settings
APP_NAME=Sistem Penyimpanan Fail Tongod
APP_VERSION=1.0.0
APP_ENVIRONMENT=production
`;

fs.writeFileSync('.env.example', envExample);
console.log('✅ Environment example file created: .env.example');

// Create a simple data import script
const importScript = `// Data import script for Firebase
// Run this in your browser console when logged in as admin

import { db } from './js/firebase-config.js';
import { collection, addDoc, setDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

async function importSampleData() {
    const sampleData = ${JSON.stringify(sampleData, null, 4)};
    
    try {
        console.log('Importing sample data...');
        
        // Import locations
        for (const location of sampleData.locations) {
            const docRef = await addDoc(collection(db, 'locations'), location);
            console.log('Location added:', docRef.id);
        }
        
        // Import files (update location_id with actual IDs)
        for (const file of sampleData.files) {
            const docRef = await addDoc(collection(db, 'files'), file);
            console.log('File added:', docRef.id);
        }
        
        console.log('✅ Sample data imported successfully!');
        console.log('Note: Remember to create users in Firebase Authentication');
        
    } catch (error) {
        console.error('❌ Error importing data:', error);
    }
}

// Run the import
importSampleData();`;

fs.writeFileSync('import-data.js', importScript);
console.log('✅ Data import script created: import-data.js');

// Setup checklist
console.log('\n📋 Setup Checklist:');
console.log('');
console.log('1. ⬜ Create Firebase project at https://console.firebase.google.com/');
console.log('2. ⬜ Enable Authentication (Email/Password provider)');
console.log('3. ⬜ Enable Firestore Database');
console.log('4. ⬜ Enable Hosting');
console.log('5. ⬜ Update js/firebase-config.js with your project config');
console.log('6. ⬜ Install Firebase CLI: npm install -g firebase-tools');
console.log('7. ⬜ Login to Firebase: firebase login');
console.log('8. ⬜ Initialize project: firebase init');
console.log('9. ⬜ Create admin user in Firebase Authentication');
console.log('10. ⬜ Add admin user document to Firestore users collection');
console.log('11. ⬜ Run data import script in browser console (optional)');
console.log('12. ⬜ Deploy: firebase deploy');
console.log('');
console.log('📖 For detailed instructions, see README.md');
console.log('');
console.log('🎉 Setup files created successfully!');
console.log('   Next step: Update your Firebase configuration and follow the checklist above.');
console.log('');