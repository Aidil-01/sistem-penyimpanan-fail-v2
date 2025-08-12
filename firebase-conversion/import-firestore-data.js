// Firestore data import script for browser console
// This script imports the comprehensive Malaysian data to Firestore

console.log('🚀 Starting Firestore data import...');

// Import Firebase modules (these should already be loaded in your web app)
import { collection, addDoc, setDoc, doc, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db } from './js/firebase-config.js';

// Helper function to convert timestamp strings to Firestore Timestamps
function convertTimestamp(timestampStr) {
    return Timestamp.fromDate(new Date(timestampStr));
}

// Sample data with all collections
const firestoreData = {
    users: {
        "admin001": {
            "name": "Datuk Ahmad bin Rahman",
            "email": "datuk.ahmad@tongod.sabah.gov.my",
            "role": "admin",
            "department": "Pentadbiran Utama",
            "position": "Pegawai Daerah",
            "phone": "+6088-123456",
            "is_active": true,
            "created_at": convertTimestamp("2024-01-01T08:00:00.000Z"),
            "updated_at": convertTimestamp("2024-01-01T08:00:00.000Z")
        },
        "admin002": {
            "name": "Puan Siti Hajar binti Abdullah",
            "email": "siti.hajar@tongod.sabah.gov.my",
            "role": "admin",
            "department": "Pentadbiran Utama",
            "position": "Penolong Pegawai Daerah",
            "phone": "+6088-123457",
            "is_active": true,
            "created_at": convertTimestamp("2024-01-01T08:00:00.000Z"),
            "updated_at": convertTimestamp("2024-01-01T08:00:00.000Z")
        },
        "staff001": {
            "name": "Encik Muhammad Faizal bin Omar",
            "email": "faizal@tongod.sabah.gov.my",
            "role": "staff_jabatan",
            "department": "Pentadbiran",
            "position": "Pegawai Tadbir N41",
            "phone": "+6088-234567",
            "is_active": true,
            "created_at": convertTimestamp("2024-01-02T08:00:00.000Z"),
            "updated_at": convertTimestamp("2024-01-02T08:00:00.000Z")
        },
        "staff002": {
            "name": "Puan Norliza binti Kassim",
            "email": "norliza@tongod.sabah.gov.my",
            "role": "staff_jabatan",
            "department": "Kewangan",
            "position": "Pegawai Kewangan W41",
            "phone": "+6088-234568",
            "is_active": true,
            "created_at": convertTimestamp("2024-01-02T08:00:00.000Z"),
            "updated_at": convertTimestamp("2024-01-02T08:00:00.000Z")
        },
        "staff003": {
            "name": "Encik Roslan bin Sulaiman",
            "email": "roslan@tongod.sabah.gov.my",
            "role": "staff_jabatan",
            "department": "Pembangunan",
            "position": "Pegawai Perancang Bandar N41",
            "phone": "+6088-234569",
            "is_active": true,
            "created_at": convertTimestamp("2024-01-03T08:00:00.000Z"),
            "updated_at": convertTimestamp("2024-01-03T08:00:00.000Z")
        }
    },
    locations: {
        "loc001": {
            "room": "Bilik Rekod Utama",
            "rack": "A001",
            "slot": "001",
            "description": "Fail pentadbiran tahun 2024",
            "is_available": true,
            "created_at": convertTimestamp("2024-01-01T08:00:00.000Z"),
            "updated_at": convertTimestamp("2024-01-01T08:00:00.000Z")
        },
        "loc002": {
            "room": "Bilik Rekod Utama",
            "rack": "A001",
            "slot": "002",
            "description": "Fail kewangan tahun 2024",
            "is_available": true,
            "created_at": convertTimestamp("2024-01-01T08:00:00.000Z"),
            "updated_at": convertTimestamp("2024-01-01T08:00:00.000Z")
        }
    },
    files: {
        "FILE20240001": {
            "file_id": "FILE20240001",
            "title": "Surat Pekeliling Perkhidmatan Bil. 1/2024",
            "reference_number": "PD.TONGOD/100-1/1/24",
            "document_year": 2024,
            "department": "Pentadbiran",
            "document_type": "surat_rasmi",
            "description": "Pekeliling berkaitan prosedur baharu pentadbiran",
            "status": "tersedia",
            "location_id": "loc001",
            "created_by": "admin001",
            "created_at": convertTimestamp("2024-01-15T08:00:00.000Z"),
            "updated_at": convertTimestamp("2024-01-15T08:00:00.000Z")
        }
    }
};

// Import function
async function importData() {
    try {
        console.log('📝 Importing users...');
        for (const [userId, userData] of Object.entries(firestoreData.users)) {
            await setDoc(doc(db, 'users', userId), userData);
            console.log(`✅ User imported: ${userData.name}`);
        }

        console.log('📍 Importing locations...');
        for (const [locationId, locationData] of Object.entries(firestoreData.locations)) {
            await setDoc(doc(db, 'locations', locationId), locationData);
            console.log(`✅ Location imported: ${locationData.room} - ${locationData.rack}`);
        }

        console.log('📄 Importing files...');
        for (const [fileId, fileData] of Object.entries(firestoreData.files)) {
            await setDoc(doc(db, 'files', fileId), fileData);
            console.log(`✅ File imported: ${fileData.title}`);
        }

        console.log('🎉 Data import completed successfully!');
        console.log(`Total imported: ${Object.keys(firestoreData.users).length} users, ${Object.keys(firestoreData.locations).length} locations, ${Object.keys(firestoreData.files).length} files`);

    } catch (error) {
        console.error('❌ Import failed:', error);
    }
}

// Auto-run the import
importData();