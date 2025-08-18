// Skrip Pembetulan Sinkronisasi Firebase untuk Sistem Penyimpanan Fail Tongod
// Membaiki isu antara koleksi fail dan lokasi

import { 
    db, 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    getDocs, 
    getDoc,
    writeBatch,
    serverTimestamp,
    query,
    where 
} from './firebase-conversion/js/firebase-config.js';

class FirebaseSyncFixer {
    constructor() {
        this.fixedCount = {
            orphanedFiles: 0,
            missingLocations: 0,
            inconsistentData: 0,
            createdLocations: 0
        };
    }

    async fixAllSyncIssues() {
        console.log('🔧 Memulakan pembetulan isu sinkronisasi secara komprehensif...');
        
        try {
            // 1. Betulkan fail orphaned
            await this.fixOrphanedFiles();
            
            // 2. Cipta dan tetapkan lokasi default
            await this.createDefaultLocationForFiles();
            
            // 3. Betulkan konsistensi status
            await this.fixLocationAvailabilityConsistency();
            
            // 4. Kemas kini referential integrity
            await this.enforceReferentialIntegrity();
            
            // 5. Setup real-time listeners
            await this.setupRealtimeSync();
            
            this.generateFixReport();
            
        } catch (error) {
            console.error('❌ Ralat semasa pembetulan:', error);
        }
    }

    async fixOrphanedFiles() {
        console.log('🔧 Membaiki fail dengan rujukan lokasi tidak wujud...');
        
        const filesSnapshot = await getDocs(collection(db, 'files'));
        const locationsSnapshot = await getDocs(collection(db, 'locations'));
        
        const locationIds = new Set();
        locationsSnapshot.forEach(doc => locationIds.add(doc.id));
        
        const batch = writeBatch(db);
        let batchCount = 0;
        
        for (const fileDoc of filesSnapshot.docs) {
            const fileData = fileDoc.data();
            
            if (fileData.location_id && !locationIds.has(fileData.location_id)) {
                // Reset rujukan lokasi yang tidak wujud
                batch.update(fileDoc.ref, {
                    location_id: null,
                    status: 'perlu_lokasi',
                    updated_at: serverTimestamp(),
                    sync_notes: `Rujukan lokasi ${fileData.location_id} tidak wujud - direset pada ${new Date().toISOString()}`
                });
                
                batchCount++;
                this.fixedCount.orphanedFiles++;
                
                // Firebase batch limit adalah 500
                if (batchCount >= 400) {
                    await batch.commit();
                    console.log(`✅ Batch ${Math.ceil(this.fixedCount.orphanedFiles / 400)} selesai`);
                    batchCount = 0;
                }
            }
        }
        
        if (batchCount > 0) {
            await batch.commit();
        }
        
        console.log(`✅ Diperbaiki ${this.fixedCount.orphanedFiles} fail orphaned`);
    }

    async createDefaultLocationForFiles() {
        console.log('🏗️ Mencipta lokasi default dan menetapkan untuk fail tanpa lokasi...');
        
        // Cipta lokasi default untuk setiap jabatan
        const departments = ['Pentadbiran', 'Kewangan', 'Pembangunan', 'Kesihatan'];
        const defaultLocations = {};
        
        for (const dept of departments) {
            const locationData = {
                room: `Stor Default ${dept}`,
                rack: `DEF${dept.substring(0, 3).toUpperCase()}001`,
                slot: '001',
                description: `Lokasi default untuk fail jabatan ${dept} tanpa lokasi ditetapkan`,
                is_available: true,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
                auto_created: true,
                department_default: dept
            };
            
            const docRef = await addDoc(collection(db, 'locations'), locationData);
            defaultLocations[dept] = docRef.id;
            this.fixedCount.createdLocations++;
            
            console.log(`✅ Lokasi default dicipta untuk ${dept}: ${docRef.id}`);
        }
        
        // Cipta lokasi default umum
        const generalDefaultData = {
            room: 'Stor Default Umum',
            rack: 'DEF001',
            slot: '001',
            description: 'Lokasi default untuk fail tanpa jabatan atau lokasi ditetapkan',
            is_available: true,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
            auto_created: true,
            department_default: 'Umum'
        };
        
        const generalDefault = await addDoc(collection(db, 'locations'), generalDefaultData);
        defaultLocations['Umum'] = generalDefault.id;
        this.fixedCount.createdLocations++;
        
        // Tetapkan lokasi untuk fail tanpa lokasi
        const filesQuery = query(collection(db, 'files'));
        const filesSnapshot = await getDocs(filesQuery);
        
        const batch = writeBatch(db);
        let batchCount = 0;
        
        for (const fileDoc of filesSnapshot.docs) {
            const fileData = fileDoc.data();
            
            if (!fileData.location_id || fileData.location_id === '' || fileData.location_id === null) {
                const defaultLocationId = defaultLocations[fileData.department] || defaultLocations['Umum'];
                
                batch.update(fileDoc.ref, {
                    location_id: defaultLocationId,
                    status: 'tersedia',
                    updated_at: serverTimestamp(),
                    sync_notes: `Lokasi default ditetapkan secara automatik pada ${new Date().toISOString()}`
                });
                
                batchCount++;
                this.fixedCount.missingLocations++;
                
                if (batchCount >= 400) {
                    await batch.commit();
                    console.log(`✅ Batch lokasi ${Math.ceil(this.fixedCount.missingLocations / 400)} selesai`);
                    batchCount = 0;
                }
            }
        }
        
        if (batchCount > 0) {
            await batch.commit();
        }
        
        console.log(`✅ Lokasi ditetapkan untuk ${this.fixedCount.missingLocations} fail`);
    }

    async fixLocationAvailabilityConsistency() {
        console.log('🔄 Membaiki konsistensi ketersediaan lokasi...');
        
        const filesSnapshot = await getDocs(collection(db, 'files'));
        const locationsSnapshot = await getDocs(collection(db, 'locations'));
        
        // Buat map lokasi untuk akses pantas
        const locations = {};
        locationsSnapshot.forEach(doc => {
            locations[doc.id] = { ref: doc.ref, data: doc.data() };
        });
        
        // Kira penggunaan lokasi
        const locationUsage = {};
        const borrowedFiles = new Set();
        
        filesSnapshot.forEach(doc => {
            const fileData = doc.data();
            if (fileData.location_id) {
                if (!locationUsage[fileData.location_id]) {
                    locationUsage[fileData.location_id] = {
                        total: 0,
                        available: 0,
                        borrowed: 0,
                        archived: 0
                    };
                }
                
                locationUsage[fileData.location_id].total++;
                
                switch (fileData.status) {
                    case 'tersedia':
                        locationUsage[fileData.location_id].available++;
                        break;
                    case 'dipinjam':
                        locationUsage[fileData.location_id].borrowed++;
                        borrowedFiles.add(fileData.location_id);
                        break;
                    case 'arkib':
                        locationUsage[fileData.location_id].archived++;
                        break;
                }
            }
        });
        
        // Kemas kini status lokasi berdasarkan penggunaan
        const batch = writeBatch(db);
        let batchCount = 0;
        
        for (const [locationId, usage] of Object.entries(locationUsage)) {
            if (locations[locationId]) {
                const currentData = locations[locationId].data;
                const shouldBeAvailable = usage.borrowed === 0; // Tersedia jika tiada fail dipinjam
                
                if (currentData.is_available !== shouldBeAvailable) {
                    batch.update(locations[locationId].ref, {
                        is_available: shouldBeAvailable,
                        updated_at: serverTimestamp(),
                        usage_stats: usage,
                        sync_notes: `Status ketersediaan dikemas kini secara automatik pada ${new Date().toISOString()}`
                    });
                    
                    batchCount++;
                    this.fixedCount.inconsistentData++;
                    
                    if (batchCount >= 400) {
                        await batch.commit();
                        console.log(`✅ Batch konsistensi ${Math.ceil(this.fixedCount.inconsistentData / 400)} selesai`);
                        batchCount = 0;
                    }
                }
            }
        }
        
        if (batchCount > 0) {
            await batch.commit();
        }
        
        console.log(`✅ Konsistensi diperbaiki untuk ${this.fixedCount.inconsistentData} lokasi`);
    }

    async enforceReferentialIntegrity() {
        console.log('🔗 Menguat kuasa referential integrity...');
        
        // Tambah field untuk tracking
        const filesSnapshot = await getDocs(collection(db, 'files'));
        const batch = writeBatch(db);
        let batchCount = 0;
        
        for (const fileDoc of filesSnapshot.docs) {
            const fileData = fileDoc.data();
            
            if (fileData.location_id) {
                // Verify location exists
                const locationDoc = await getDoc(doc(db, 'locations', fileData.location_id));
                
                if (!locationDoc.exists()) {
                    // Location doesn't exist, mark for fix
                    batch.update(fileDoc.ref, {
                        integrity_check: 'failed',
                        integrity_check_date: serverTimestamp(),
                        needs_location_fix: true
                    });
                } else {
                    // Location exists, mark as verified
                    batch.update(fileDoc.ref, {
                        integrity_check: 'passed',
                        integrity_check_date: serverTimestamp(),
                        needs_location_fix: false
                    });
                }
                
                batchCount++;
                
                if (batchCount >= 400) {
                    await batch.commit();
                    console.log(`✅ Batch integrity ${Math.ceil(batchCount / 400)} selesai`);
                    batchCount = 0;
                }
            }
        }
        
        if (batchCount > 0) {
            await batch.commit();
        }
        
        console.log('✅ Referential integrity dikuatkuasakan');
    }

    async setupRealtimeSync() {
        console.log('🔄 Menyediakan sistem sinkronisasi masa nyata...');
        
        // Setup function untuk auto-sync (untuk digunakan dalam aplikasi)
        const realtimeSyncFunction = `
// Real-time sync functions (tambah dalam aplikasi utama)
import { onSnapshot, doc, updateDoc } from './firebase-config.js';

// Monitor perubahan pada fail dan kemas kini lokasi
export function setupFileLocationSync() {
    return onSnapshot(collection(db, 'files'), (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'modified') {
                const fileData = change.doc.data();
                const previousData = change.doc.metadata.fromCache ? null : change.doc.data();
                
                // Jika status fail berubah, kemas kini lokasi
                if (fileData.location_id) {
                    const locationRef = doc(db, 'locations', fileData.location_id);
                    
                    if (fileData.status === 'dipinjam') {
                        await updateDoc(locationRef, {
                            is_available: false,
                            last_borrowed: serverTimestamp()
                        });
                    } else if (fileData.status === 'tersedia') {
                        await updateDoc(locationRef, {
                            is_available: true,
                            last_returned: serverTimestamp()
                        });
                    }
                }
            }
        });
    });
}

// Monitor perubahan pada lokasi
export function setupLocationSync() {
    return onSnapshot(collection(db, 'locations'), (snapshot) => {
        console.log('Lokasi dikemas kini:', snapshot.size);
    });
}
`;

        // Simpan function dalam fail berasingan
        const realtimeSyncPath = 'C:\\xampp\\htdocs\\sistem-penyimpanan-fail\\realtime-sync-functions.js';
        
        console.log('✅ Setup realtime sync functions');
        console.log(`💾 Simpan functions di: ${realtimeSyncPath}`);
        
        return realtimeSyncFunction;
    }

    generateFixReport() {
        console.log('\n🎉 LAPORAN PEMBETULAN SINKRONISASI');
        console.log('=====================================\n');
        
        console.log('📊 RINGKASAN PEMBETULAN:');
        console.log(`• Fail orphaned diperbaiki: ${this.fixedCount.orphanedFiles}`);
        console.log(`• Fail diberi lokasi: ${this.fixedCount.missingLocations}`);
        console.log(`• Lokasi default dicipta: ${this.fixedCount.createdLocations}`);
        console.log(`• Konsistensi diperbaiki: ${this.fixedCount.inconsistentData}`);
        
        console.log('\n✅ PEMBETULAN SELESAI!');
        console.log('• Semua rujukan lokasi telah diperbaiki');
        console.log('• Lokasi default telah dicipta untuk setiap jabatan');
        console.log('• Konsistensi status telah diperbaiki');
        console.log('• Referential integrity dikuatkuasakan');
        console.log('• Setup untuk real-time sync disediakan');
        
        console.log('\n📋 LANGKAH SETERUSNYA:');
        console.log('1. Jalankan validation script untuk verifikasi');
        console.log('2. Implementasi real-time sync functions dalam aplikasi');
        console.log('3. Setup monitoring untuk pencegahan isu masa depan');
        console.log('4. Update Firebase rules untuk enforce constraints');
    }
}

// Jalankan pembetulan
const fixer = new FirebaseSyncFixer();
fixer.fixAllSyncIssues().catch(console.error);

export default FirebaseSyncFixer;