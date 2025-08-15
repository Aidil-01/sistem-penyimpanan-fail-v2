// Setup Dummy Data Script for Firebase
// Run this in browser console after loading Firebase

import { 
    db, 
    collection, 
    addDoc, 
    serverTimestamp 
} from './js/firebase-config.js';

// Dummy locations data
const dummyLocations = [
    // Bilik-bilik (Rooms)
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }
];

// Dummy files data
const dummyFiles = [
    {
        file_id: 'ADM001',
        title: 'Surat Arahan Baharu 2024',
        department: 'Pentadbiran',
        category: 'Surat Arahan',
        description: 'Surat arahan mengenai prosedur baharu',
        status: 'tersedia',
        location_id: 'room_admin_a',
        created_by: 'admin',
        tags: ['surat', 'arahan', '2024'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    },
    {
        file_id: 'KEW001',
        title: 'Laporan Kewangan Q1 2024',
        department: 'Kewangan',
        category: 'Laporan',
        description: 'Laporan kewangan suku tahun pertama',
        status: 'tersedia',
        location_id: 'room_finance',
        created_by: 'admin',
        tags: ['laporan', 'kewangan', 'Q1'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    },
    {
        file_id: 'KEW002',
        title: 'Baucer Perbelanjaan Januari',
        department: 'Kewangan',
        category: 'Baucer',
        description: 'Baucer perbelanjaan untuk bulan Januari',
        status: 'dipinjam',
        location_id: 'room_finance',
        created_by: 'admin',
        tags: ['baucer', 'januari', 'perbelanjaan'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    },
    {
        file_id: 'ADM002',
        title: 'Minit Mesyuarat Bulanan',
        department: 'Pentadbiran',
        category: 'Minit Mesyuarat',
        description: 'Minit mesyuarat bulanan Februari 2024',
        status: 'tersedia',
        location_id: 'room_admin_a',
        created_by: 'staff',
        tags: ['minit', 'mesyuarat', 'februari'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    },
    {
        file_id: 'ARK001',
        title: 'Dokumen Arkib Lama 2020',
        department: 'Pentadbiran',
        category: 'Arkib',
        description: 'Dokumen arkib dari tahun 2020',
        status: 'arkib',
        location_id: 'room_archive',
        created_by: 'admin',
        tags: ['arkib', '2020', 'lama'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }
];

// Dummy users data
const dummyUsers = [
    {
        name: 'Ahmad Bin Ali',
        email: 'ahmad@tongod.gov.my',
        user_role: 'admin',
        jabatan: 'Pentadbiran',
        phone: '088-123456',
        is_active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    },
    {
        name: 'Siti Aminah',
        email: 'siti@tongod.gov.my',
        user_role: 'staff_jabatan',
        jabatan: 'Kewangan',
        phone: '088-123457',
        is_active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    },
    {
        name: 'Raj Kumar',
        email: 'raj@tongod.gov.my',
        user_role: 'staff_pembantu',
        jabatan: 'Pentadbiran',
        phone: '088-123458',
        is_active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }
];

// Dummy borrowing records
const dummyBorrowings = [
    {
        file_id: 'KEW002',
        borrower_id: 'user_siti',
        borrower_name: 'Siti Aminah',
        borrow_date: serverTimestamp(),
        expected_return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        purpose: 'Untuk audit kewangan',
        status: 'dipinjam',
        created_by: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }
];

// Function to setup all dummy data
export async function setupDummyData() {
    try {
        console.log('Setting up dummy data...');
        
        if (!db) {
            throw new Error('Firebase not initialized');
        }
        
        // Add locations
        console.log('Adding dummy locations...');
        const locationPromises = dummyLocations.map(location => 
            addDoc(collection(db, 'locations'), location)
        );
        await Promise.all(locationPromises);
        console.log(`Added ${dummyLocations.length} locations`);
        
        // Add files
        console.log('Adding dummy files...');
        const filePromises = dummyFiles.map(file => 
            addDoc(collection(db, 'files'), file)
        );
        await Promise.all(filePromises);
        console.log(`Added ${dummyFiles.length} files`);
        
        // Add users
        console.log('Adding dummy users...');
        const userPromises = dummyUsers.map(user => 
            addDoc(collection(db, 'users'), user)
        );
        await Promise.all(userPromises);
        console.log(`Added ${dummyUsers.length} users`);
        
        // Add borrowing records
        console.log('Adding dummy borrowing records...');
        const borrowingPromises = dummyBorrowings.map(borrowing => 
            addDoc(collection(db, 'borrowing_records'), borrowing)
        );
        await Promise.all(borrowingPromises);
        console.log(`Added ${dummyBorrowings.length} borrowing records`);
        
        console.log('✅ Dummy data setup completed successfully!');
        return {
            success: true,
            message: 'Dummy data berhasil ditambahkan ke Firebase',
            data: {
                locations: dummyLocations.length,
                files: dummyFiles.length,
                users: dummyUsers.length,
                borrowings: dummyBorrowings.length
            }
        };
        
    } catch (error) {
        console.error('❌ Error setting up dummy data:', error);
        throw error;
    }
}

// Function to clean up all data (use carefully!)
export async function cleanupData() {
    try {
        console.log('⚠️  Cleaning up all data...');
        
        const collections = ['locations', 'files', 'users', 'borrowing_records'];
        
        for (const collectionName of collections) {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const batch = writeBatch(db);
            
            querySnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            console.log(`Cleaned up ${collectionName}: ${querySnapshot.size} documents deleted`);
        }
        
        console.log('✅ All data cleaned up successfully!');
        return { success: true, message: 'Semua data telah dibersihkan' };
        
    } catch (error) {
        console.error('❌ Error cleaning up data:', error);
        throw error;
    }
}

// Auto-setup if script is loaded directly
if (typeof window !== 'undefined') {
    window.setupDummyData = setupDummyData;
    window.cleanupData = cleanupData;
    
    console.log(`
🚀 Firebase Dummy Data Setup Ready!

Usage:
1. await setupDummyData() - Setup dummy data
2. await cleanupData()    - Clean all data (careful!)

Available dummy data:
- ${dummyLocations.length} locations
- ${dummyFiles.length} files  
- ${dummyUsers.length} users
- ${dummyBorrowings.length} borrowing records
    `);
}