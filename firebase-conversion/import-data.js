// Data import script for Firebase
// Run this in your browser console when logged in as admin

import { db } from './js/firebase-config.js';
import { collection, addDoc, setDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

async function importSampleData() {
    const sampleData = {
    "users": [
        {
            "id": "admin-user-id",
            "name": "Administrator",
            "email": "admin@tongod.gov.my",
            "role": "admin",
            "department": "Pentadbiran",
            "position": "Pentadbir Sistem",
            "phone": "+60123456789",
            "is_active": true
        },
        {
            "id": "staff-user-id-1",
            "name": "Ahmad bin Ali",
            "email": "ahmad@tongod.gov.my",
            "role": "staff_jabatan",
            "department": "Pentadbiran",
            "position": "Pegawai Tadbir",
            "phone": "+60123456780",
            "is_active": true
        },
        {
            "id": "staff-user-id-2",
            "name": "Siti Aminah",
            "email": "siti@tongod.gov.my",
            "role": "staff_pembantu",
            "department": "Kewangan",
            "position": "Pembantu Tadbir",
            "phone": "+60123456781",
            "is_active": true
        }
    ],
    "locations": [
        {
            "room": "Bilik Arkib A",
            "rack": "Rak 001",
            "slot": "001",
            "description": "Fail pentadbiran tahun 2024",
            "is_available": true
        },
        {
            "room": "Bilik Arkib A",
            "rack": "Rak 001",
            "slot": "002",
            "description": "Fail kewangan tahun 2024",
            "is_available": true
        },
        {
            "room": "Bilik Arkib A",
            "rack": "Rak 002",
            "slot": "001",
            "description": "Fail pembangunan tahun 2024",
            "is_available": true
        },
        {
            "room": "Bilik Arkib B",
            "rack": "Rak 001",
            "slot": "001",
            "description": "Fail kejuruteraan tahun 2024",
            "is_available": true
        },
        {
            "room": "Bilik Arkib B",
            "rack": "Rak 001",
            "slot": "002",
            "description": "Fail perancangan tahun 2024",
            "is_available": true
        },
        {
            "room": "Bilik Arkib B",
            "rack": "Rak 002",
            "slot": "001",
            "description": "Fail arkib lama",
            "is_available": true
        }
    ],
    "files": [
        {
            "file_id": "FAIL20240001",
            "title": "Surat Pekeliling Perkhidmatan Bil. 1/2024",
            "reference_number": "PD.TONGOD/100-1/1/24",
            "document_year": 2024,
            "department": "Pentadbiran",
            "document_type": "surat_rasmi",
            "description": "Pekeliling berkaitan prosedur baharu pentadbiran",
            "status": "tersedia",
            "location_id": "location-1"
        },
        {
            "file_id": "FAIL20240002",
            "title": "Laporan Kewangan Q1 2024",
            "reference_number": "PD.TONGOD/200-2/1/24",
            "document_year": 2024,
            "department": "Kewangan",
            "document_type": "laporan",
            "description": "Laporan kewangan suku pertama tahun 2024",
            "status": "tersedia",
            "location_id": "location-2"
        },
        {
            "file_id": "FAIL20240003",
            "title": "Perjanjian Kontraktor Projek Jalan Raya",
            "reference_number": "PD.TONGOD/300-3/1/24",
            "document_year": 2024,
            "department": "Pembangunan",
            "document_type": "perjanjian",
            "description": "Dokumen perjanjian dengan kontraktor untuk projek jalan raya",
            "status": "dipinjam",
            "location_id": "location-3"
        }
    ]
};
    
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
importSampleData();