// Real-time Synchronization Functions untuk Sistem Penyimpanan Fail Tongod
// Memastikan sinkronisasi masa nyata antara fail dan lokasi

import { 
    db, 
    collection, 
    doc, 
    updateDoc, 
    onSnapshot,
    serverTimestamp,
    writeBatch,
    query,
    where,
    getDocs
} from './firebase-conversion/js/firebase-config.js';

class RealtimeSyncManager {
    constructor() {
        this.listeners = [];
        this.isActive = false;
    }

    // Mulakan semua real-time listeners
    startAllListeners() {
        console.log('🔄 Memulakan real-time sync listeners...');
        
        this.listeners.push(this.setupFileLocationSync());
        this.listeners.push(this.setupLocationUsageSync());
        this.listeners.push(this.setupBorrowingSync());
        
        this.isActive = true;
        console.log('✅ Semua real-time listeners aktif');
    }

    // Hentikan semua listeners
    stopAllListeners() {
        console.log('⏹️ Menghentikan real-time sync listeners...');
        
        this.listeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        
        this.listeners = [];
        this.isActive = false;
        console.log('✅ Semua listeners dihentikan');
    }

    // Monitor perubahan pada fail dan auto-update lokasi
    setupFileLocationSync() {
        console.log('📁 Setup file-location sync listener...');
        
        return onSnapshot(collection(db, 'files'), (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                try {
                    const fileData = change.doc.data();
                    const fileId = change.doc.id;
                    
                    if (change.type === 'modified' && fileData.location_id) {
                        await this.updateLocationAvailability(fileData.location_id, fileData.status, fileId);
                    }
                    
                    // Log untuk debugging
                    if (change.type !== 'modified') {
                        console.log(`📁 File ${change.type}: ${fileData.title}`);
                    }
                    
                } catch (error) {
                    console.error('❌ Ralat dalam file sync:', error);
                }
            });
        }, (error) => {
            console.error('❌ Ralat file listener:', error);
        });
    }

    // Monitor penggunaan lokasi dan kemas kini statistik
    setupLocationUsageSync() {
        console.log('📍 Setup location usage sync listener...');
        
        return onSnapshot(collection(db, 'locations'), (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                try {
                    const locationData = change.doc.data();
                    const locationId = change.doc.id;
                    
                    if (change.type === 'modified') {
                        await this.updateLocationStatistics(locationId);
                    }
                    
                    console.log(`📍 Location ${change.type}: ${locationData.room} - ${locationData.rack}/${locationData.slot}`);
                    
                } catch (error) {
                    console.error('❌ Ralat dalam location sync:', error);
                }
            });
        }, (error) => {
            console.error('❌ Ralat location listener:', error);
        });
    }

    // Monitor peminjaman dan auto-update status
    setupBorrowingSync() {
        console.log('🤝 Setup borrowing sync listener...');
        
        return onSnapshot(collection(db, 'borrowing_records'), (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                try {
                    const borrowData = change.doc.data();
                    
                    if (change.type === 'added' || change.type === 'modified') {
                        await this.syncBorrowingStatus(borrowData);
                    }
                    
                    console.log(`🤝 Borrowing ${change.type}: ${borrowData.file_id}`);
                    
                } catch (error) {
                    console.error('❌ Ralat dalam borrowing sync:', error);
                }
            });
        }, (error) => {
            console.error('❌ Ralat borrowing listener:', error);
        });
    }

    // Kemas kini ketersediaan lokasi berdasarkan status fail
    async updateLocationAvailability(locationId, fileStatus, fileId) {
        try {
            const locationRef = doc(db, 'locations', locationId);
            const updateData = {
                updated_at: serverTimestamp(),
                last_sync: serverTimestamp()
            };

            // Kira semula ketersediaan berdasarkan semua fail di lokasi ini
            const filesInLocation = await getDocs(
                query(collection(db, 'files'), where('location_id', '==', locationId))
            );

            let hasActiveBorrowing = false;
            let totalFiles = 0;
            let availableFiles = 0;
            let borrowedFiles = 0;
            let archivedFiles = 0;

            filesInLocation.forEach(doc => {
                const data = doc.data();
                totalFiles++;
                
                switch (data.status) {
                    case 'tersedia':
                        availableFiles++;
                        break;
                    case 'dipinjam':
                        borrowedFiles++;
                        hasActiveBorrowing = true;
                        break;
                    case 'arkib':
                        archivedFiles++;
                        break;
                }
            });

            // Update ketersediaan dan statistik
            updateData.is_available = !hasActiveBorrowing;
            updateData.usage_stats = {
                total_files: totalFiles,
                available_files: availableFiles,
                borrowed_files: borrowedFiles,
                archived_files: archivedFiles,
                last_updated: new Date().toISOString()
            };

            // Tambah timestamp berdasarkan status
            if (fileStatus === 'dipinjam') {
                updateData.last_borrowed = serverTimestamp();
                updateData.last_borrowed_file = fileId;
            } else if (fileStatus === 'tersedia') {
                updateData.last_returned = serverTimestamp();
                updateData.last_returned_file = fileId;
            }

            await updateDoc(locationRef, updateData);
            
            console.log(`✅ Lokasi ${locationId} dikemas kini: ${updateData.is_available ? 'tersedia' : 'tidak tersedia'}`);
            
        } catch (error) {
            console.error(`❌ Gagal mengemas kini lokasi ${locationId}:`, error);
        }
    }

    // Kemas kini statistik lokasi
    async updateLocationStatistics(locationId) {
        try {
            // Kira statistik penggunaan
            const filesQuery = query(collection(db, 'files'), where('location_id', '==', locationId));
            const filesSnapshot = await getDocs(filesQuery);
            
            const stats = {
                total_files: filesSnapshot.size,
                file_types: {},
                departments: {},
                status_count: {
                    tersedia: 0,
                    dipinjam: 0,
                    arkib: 0
                },
                last_calculated: new Date().toISOString()
            };

            filesSnapshot.forEach(doc => {
                const data = doc.data();
                
                // Kira jenis dokumen
                stats.file_types[data.document_type] = (stats.file_types[data.document_type] || 0) + 1;
                
                // Kira jabatan
                stats.departments[data.department] = (stats.departments[data.department] || 0) + 1;
                
                // Kira status
                stats.status_count[data.status] = (stats.status_count[data.status] || 0) + 1;
            });

            // Update lokasi dengan statistik
            await updateDoc(doc(db, 'locations', locationId), {
                detailed_stats: stats,
                stats_updated_at: serverTimestamp()
            });
            
        } catch (error) {
            console.error(`❌ Gagal mengemas kini statistik lokasi ${locationId}:`, error);
        }
    }

    // Sinkronkan status peminjaman dengan fail dan lokasi
    async syncBorrowingStatus(borrowData) {
        try {
            const batch = writeBatch(db);
            
            // Update status fail
            const fileRef = doc(db, 'files', borrowData.file_id);
            const fileStatus = borrowData.status === 'dipinjam' ? 'dipinjam' : 'tersedia';
            
            batch.update(fileRef, {
                status: fileStatus,
                current_borrowing: borrowData.status === 'dipinjam' ? doc(db, 'borrowing_records', borrowData.id) : null,
                updated_at: serverTimestamp()
            });

            // Jika fail dipulangkan, kemas kini rekod peminjaman
            if (borrowData.returned_date) {
                batch.update(doc(db, 'borrowing_records', borrowData.id || 'unknown'), {
                    status: 'dikembalikan',
                    returned_date: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
            }

            await batch.commit();
            
            console.log(`✅ Status peminjaman disinkronkan untuk fail ${borrowData.file_id}`);
            
        } catch (error) {
            console.error('❌ Gagal menyinkronkan status peminjaman:', error);
        }
    }

    // Validate dan repair integrity secara berkala
    async runPeriodicIntegrityCheck() {
        console.log('🔍 Menjalankan pemeriksaan integriti berkala...');
        
        try {
            const issues = await this.findIntegrityIssues();
            
            if (issues.length > 0) {
                console.log(`⚠️ Dijumpai ${issues.length} isu integriti`);
                await this.autoFixMinorIssues(issues);
            } else {
                console.log('✅ Tiada isu integriti dijumpai');
            }
            
        } catch (error) {
            console.error('❌ Ralat semasa pemeriksaan integriti:', error);
        }
    }

    // Cari isu integriti
    async findIntegrityIssues() {
        const issues = [];
        
        // Periksa rujukan lokasi
        const filesSnapshot = await getDocs(collection(db, 'files'));
        
        for (const fileDoc of filesSnapshot.docs) {
            const fileData = fileDoc.data();
            
            if (fileData.location_id) {
                const locationDoc = await getDocs(
                    query(collection(db, 'locations'), where('__name__', '==', fileData.location_id))
                );
                
                if (locationDoc.empty) {
                    issues.push({
                        type: 'orphaned_reference',
                        fileId: fileDoc.id,
                        locationId: fileData.location_id
                    });
                }
            }
        }
        
        return issues;
    }

    // Auto-fix isu minor
    async autoFixMinorIssues(issues) {
        console.log('🔧 Membaiki isu minor secara automatik...');
        
        const batch = writeBatch(db);
        let batchCount = 0;
        
        for (const issue of issues) {
            if (issue.type === 'orphaned_reference') {
                batch.update(doc(db, 'files', issue.fileId), {
                    location_id: null,
                    status: 'perlu_lokasi',
                    auto_fixed: true,
                    auto_fixed_at: serverTimestamp(),
                    previous_location_id: issue.locationId
                });
                
                batchCount++;
                
                if (batchCount >= 400) {
                    await batch.commit();
                    batchCount = 0;
                }
            }
        }
        
        if (batchCount > 0) {
            await batch.commit();
        }
        
        console.log(`✅ ${issues.length} isu minor diperbaiki`);
    }

    // Status checker
    getStatus() {
        return {
            isActive: this.isActive,
            listenersCount: this.listeners.length,
            timestamp: new Date().toISOString()
        };
    }
}

// Export single instance
const syncManager = new RealtimeSyncManager();

// Export functions untuk digunakan dalam aplikasi
export default syncManager;

export const {
    startAllListeners,
    stopAllListeners,
    runPeriodicIntegrityCheck,
    getStatus
} = syncManager;

// Auto-start jika dalam browser environment
if (typeof window !== 'undefined') {
    console.log('🔄 Real-time sync manager ready');
    
    // Optional: auto-start listeners
    // syncManager.startAllListeners();
    
    // Setup periodic integrity check (setiap 1 jam)
    setInterval(() => {
        syncManager.runPeriodicIntegrityCheck();
    }, 60 * 60 * 1000);
}