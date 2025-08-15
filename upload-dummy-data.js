// Upload Dummy Data to Firebase
// Run this script to upload dummy data to Firebase

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, 'service-account-key.json');

// Check if service account exists
const fs = require('fs');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service account key not found at:', serviceAccountPath);
    console.log('Please download your service account key from Firebase Console > Project Settings > Service accounts');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'sistem-penyimpanan-fail-tongod'
});

const db = admin.firestore();

// Dummy data
const dummyLocations = [
    {
        name: 'Bilik Pentadbiran A',
        type: 'room',
        parentId: null,
        description: 'Bilik utama untuk fail pentadbiran',
        status: 'empty',
        sortOrder: 1,
        isAvailable: true,
        filesCount: 5,
        qrCode: 'LOC_ADMIN_A',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        name: 'Bilik Kewangan',
        type: 'room',
        parentId: null,
        description: 'Bilik penyimpanan dokumen kewangan',
        status: 'occupied',
        sortOrder: 2,
        isAvailable: true,
        filesCount: 12,
        qrCode: 'LOC_FINANCE',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        name: 'Bilik Arkib',
        type: 'room',
        parentId: null,
        description: 'Bilik arkib untuk fail lama',
        status: 'empty',
        sortOrder: 3,
        isAvailable: true,
        filesCount: 0,
        qrCode: 'LOC_ARCHIVE',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
];

const dummyFiles = [
    {
        file_id: 'ADM001',
        title: 'Surat Arahan Baharu 2024',
        department: 'Pentadbiran',
        category: 'Surat Arahan',
        description: 'Surat arahan mengenai prosedur baharu',
        status: 'tersedia',
        created_by: 'admin',
        tags: ['surat', 'arahan', '2024'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        file_id: 'KEW001',
        title: 'Laporan Kewangan Q1 2024',
        department: 'Kewangan',
        category: 'Laporan',
        description: 'Laporan kewangan suku tahun pertama',
        status: 'tersedia',
        created_by: 'admin',
        tags: ['laporan', 'kewangan', 'Q1'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        file_id: 'KEW002',
        title: 'Baucer Perbelanjaan Januari',
        department: 'Kewangan',
        category: 'Baucer',
        description: 'Baucer perbelanjaan untuk bulan Januari',
        status: 'dipinjam',
        created_by: 'admin',
        tags: ['baucer', 'januari', 'perbelanjaan'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        file_id: 'ADM002',
        title: 'Minit Mesyuarat Bulanan',
        department: 'Pentadbiran',
        category: 'Minit Mesyuarat',
        description: 'Minit mesyuarat bulanan Februari 2024',
        status: 'tersedia',
        created_by: 'staff',
        tags: ['minit', 'mesyuarat', 'februari'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        file_id: 'ARK001',
        title: 'Dokumen Arkib Lama 2020',
        department: 'Pentadbiran',
        category: 'Arkib',
        description: 'Dokumen arkib dari tahun 2020',
        status: 'arkib',
        created_by: 'admin',
        tags: ['arkib', '2020', 'lama'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
];

const dummyUsers = [
    {
        name: 'Ahmad Bin Ali',
        email: 'ahmad@tongod.gov.my',
        user_role: 'admin',
        jabatan: 'Pentadbiran',
        phone: '088-123456',
        is_active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        name: 'Siti Aminah',
        email: 'siti@tongod.gov.my',
        user_role: 'staff_jabatan',
        jabatan: 'Kewangan',
        phone: '088-123457',
        is_active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        name: 'Raj Kumar',
        email: 'raj@tongod.gov.my',
        user_role: 'staff_pembantu',
        jabatan: 'Pentadbiran',
        phone: '088-123458',
        is_active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
];

const dummyBorrowings = [
    {
        file_id: 'KEW002',
        borrower_name: 'Siti Aminah',
        borrow_date: admin.firestore.FieldValue.serverTimestamp(),
        expected_return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        purpose: 'Untuk audit kewangan',
        status: 'dipinjam',
        created_by: 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
];

async function uploadDummyData() {
    try {
        console.log('🚀 Starting dummy data upload to Firebase...');
        
        // Upload locations
        console.log('📍 Uploading locations...');
        const batch1 = db.batch();
        dummyLocations.forEach(location => {
            const docRef = db.collection('locations').doc();
            batch1.set(docRef, location);
        });
        await batch1.commit();
        console.log(`✅ Uploaded ${dummyLocations.length} locations`);
        
        // Upload files
        console.log('📁 Uploading files...');
        const batch2 = db.batch();
        dummyFiles.forEach(file => {
            const docRef = db.collection('files').doc();
            batch2.set(docRef, file);
        });
        await batch2.commit();
        console.log(`✅ Uploaded ${dummyFiles.length} files`);
        
        // Upload users
        console.log('👥 Uploading users...');
        const batch3 = db.batch();
        dummyUsers.forEach(user => {
            const docRef = db.collection('users').doc();
            batch3.set(docRef, user);
        });
        await batch3.commit();
        console.log(`✅ Uploaded ${dummyUsers.length} users`);
        
        // Upload borrowing records
        console.log('📋 Uploading borrowing records...');
        const batch4 = db.batch();
        dummyBorrowings.forEach(borrowing => {
            const docRef = db.collection('borrowing_records').doc();
            batch4.set(docRef, borrowing);
        });
        await batch4.commit();
        console.log(`✅ Uploaded ${dummyBorrowings.length} borrowing records`);
        
        console.log('');
        console.log('🎉 All dummy data uploaded successfully!');
        console.log('📊 Summary:');
        console.log(`   • Locations: ${dummyLocations.length}`);
        console.log(`   • Files: ${dummyFiles.length}`);
        console.log(`   • Users: ${dummyUsers.length}`);
        console.log(`   • Borrowings: ${dummyBorrowings.length}`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error uploading dummy data:', error);
        process.exit(1);
    }
}

// Clean up existing data (optional)
async function cleanupData() {
    try {
        console.log('🧹 Cleaning up existing data...');
        
        const collections = ['locations', 'files', 'users', 'borrowing_records'];
        
        for (const collectionName of collections) {
            const snapshot = await db.collection(collectionName).get();
            const batch = db.batch();
            
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            if (snapshot.docs.length > 0) {
                await batch.commit();
                console.log(`🗑️  Cleaned ${collectionName}: ${snapshot.docs.length} documents`);
            }
        }
        
        console.log('✅ Cleanup completed');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--clean')) {
        await cleanupData();
    }
    
    await uploadDummyData();
}

main().catch(console.error);