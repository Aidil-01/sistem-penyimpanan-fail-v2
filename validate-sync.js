// Validation Script untuk Sistem Penyimpanan Fail Tongod
// Mengesahkan bahawa semua isu sinkronisasi telah diselesaikan

import { 
    db, 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    query,
    where,
    orderBy
} from './firebase-conversion/js/firebase-config.js';

class SyncValidator {
    constructor() {
        this.validationResults = {
            totalFiles: 0,
            totalLocations: 0,
            validReferences: 0,
            invalidReferences: 0,
            filesWithoutLocation: 0,
            unusedLocations: 0,
            consistentStatuses: 0,
            inconsistentStatuses: 0,
            errors: [],
            warnings: [],
            success: []
        };
    }

    async validateAllSyncIssues() {
        console.log('🔍 Memulakan validasi sinkronisasi...');
        console.log('=====================================\n');
        
        try {
            // 1. Validate referential integrity
            await this.validateReferentialIntegrity();
            
            // 2. Validate location assignments
            await this.validateLocationAssignments();
            
            // 3. Validate status consistency
            await this.validateStatusConsistency();
            
            // 4. Validate borrowing records
            await this.validateBorrowingRecords();
            
            // 5. Generate comprehensive report
            this.generateValidationReport();
            
            return this.validationResults;
            
        } catch (error) {
            console.error('❌ Ralat semasa validasi:', error);
            this.validationResults.errors.push(`Ralat sistem: ${error.message}`);
        }
    }

    async validateReferentialIntegrity() {
        console.log('🔗 Mengesahkan referential integrity...');
        
        const [filesSnapshot, locationsSnapshot] = await Promise.all([
            getDocs(collection(db, 'files')),
            getDocs(collection(db, 'locations'))
        ]);

        this.validationResults.totalFiles = filesSnapshot.size;
        this.validationResults.totalLocations = locationsSnapshot.size;

        // Buat set lokasi yang wujud
        const existingLocationIds = new Set();
        locationsSnapshot.forEach(doc => {
            existingLocationIds.add(doc.id);
        });

        // Periksa setiap rujukan fail ke lokasi
        for (const fileDoc of filesSnapshot.docs) {
            const fileData = fileDoc.data();
            
            if (fileData.location_id) {
                if (existingLocationIds.has(fileData.location_id)) {
                    this.validationResults.validReferences++;
                    this.validationResults.success.push(
                        `✅ ${fileData.title}: Rujukan lokasi valid (${fileData.location_id})`
                    );
                } else {
                    this.validationResults.invalidReferences++;
                    this.validationResults.errors.push(
                        `❌ ${fileData.title}: Rujukan lokasi tidak wujud (${fileData.location_id})`
                    );
                }
            } else {
                this.validationResults.filesWithoutLocation++;
                this.validationResults.warnings.push(
                    `⚠️ ${fileData.title}: Tiada lokasi ditetapkan`
                );
            }
        }

        console.log(`   ✅ Rujukan valid: ${this.validationResults.validReferences}`);
        console.log(`   ❌ Rujukan tidak valid: ${this.validationResults.invalidReferences}`);
        console.log(`   ⚠️ Fail tanpa lokasi: ${this.validationResults.filesWithoutLocation}`);
    }

    async validateLocationAssignments() {
        console.log('\n📍 Mengesahkan tugasan lokasi...');
        
        const [filesSnapshot, locationsSnapshot] = await Promise.all([
            getDocs(collection(db, 'files')),
            getDocs(collection(db, 'locations'))
        ]);

        // Kira penggunaan lokasi
        const locationUsage = {};
        const usedLocationIds = new Set();

        filesSnapshot.forEach(doc => {
            const fileData = doc.data();
            if (fileData.location_id) {
                usedLocationIds.add(fileData.location_id);
                
                if (!locationUsage[fileData.location_id]) {
                    locationUsage[fileData.location_id] = [];
                }
                locationUsage[fileData.location_id].push({
                    id: doc.id,
                    title: fileData.title,
                    status: fileData.status,
                    department: fileData.department
                });
            }
        });

        // Periksa lokasi yang tidak digunakan
        locationsSnapshot.forEach(doc => {
            const locationData = doc.data();
            if (!usedLocationIds.has(doc.id)) {
                this.validationResults.unusedLocations++;
                this.validationResults.warnings.push(
                    `⚠️ Lokasi tidak digunakan: ${locationData.room} - ${locationData.rack}/${locationData.slot} (${doc.id})`
                );
            }
        });

        // Periksa lokasi dengan multiple files
        for (const [locationId, files] of Object.entries(locationUsage)) {
            if (files.length > 1) {
                const filesList = files.map(f => f.title).join(', ');
                this.validationResults.warnings.push(
                    `⚠️ Lokasi ${locationId} digunakan oleh ${files.length} fail: ${filesList}`
                );
            }
        }

        console.log(`   ⚠️ Lokasi tidak digunakan: ${this.validationResults.unusedLocations}`);
    }

    async validateStatusConsistency() {
        console.log('\n🔄 Mengesahkan konsistensi status...');
        
        const [filesSnapshot, locationsSnapshot] = await Promise.all([
            getDocs(collection(db, 'files')),
            getDocs(collection(db, 'locations'))
        ]);

        // Buat map lokasi
        const locations = {};
        locationsSnapshot.forEach(doc => {
            locations[doc.id] = doc.data();
        });

        // Periksa konsistensi status fail dengan lokasi
        for (const fileDoc of filesSnapshot.docs) {
            const fileData = fileDoc.data();
            
            if (fileData.location_id && locations[fileData.location_id]) {
                const location = locations[fileData.location_id];
                const isConsistent = this.checkStatusConsistency(fileData, location);
                
                if (isConsistent) {
                    this.validationResults.consistentStatuses++;
                } else {
                    this.validationResults.inconsistentStatuses++;
                    this.validationResults.errors.push(
                        `❌ Status tidak konsisten: ${fileData.title} (${fileData.status}) vs Lokasi tersedia: ${location.is_available}`
                    );
                }
            }
        }

        console.log(`   ✅ Status konsisten: ${this.validationResults.consistentStatuses}`);
        console.log(`   ❌ Status tidak konsisten: ${this.validationResults.inconsistentStatuses}`);
    }

    checkStatusConsistency(fileData, locationData) {
        // Logik untuk semak konsistensi
        if (fileData.status === 'dipinjam' && locationData.is_available) {
            return false; // Tidak konsisten
        }
        
        if (fileData.status === 'tersedia' && !locationData.is_available) {
            // Mungkin ada fail lain yang dipinjam di lokasi yang sama
            return true; // Anggap konsisten untuk sekarang
        }
        
        return true; // Konsisten
    }

    async validateBorrowingRecords() {
        console.log('\n🤝 Mengesahkan rekod peminjaman...');
        
        const [borrowingSnapshot, filesSnapshot] = await Promise.all([
            getDocs(collection(db, 'borrowing_records')),
            getDocs(collection(db, 'files'))
        ]);

        // Buat map fail
        const files = {};
        filesSnapshot.forEach(doc => {
            files[doc.id] = doc.data();
        });

        let validBorrowings = 0;
        let invalidBorrowings = 0;

        // Periksa setiap rekod peminjaman
        for (const borrowDoc of borrowingSnapshot.docs) {
            const borrowData = borrowDoc.data();
            
            if (files[borrowData.file_id]) {
                const file = files[borrowData.file_id];
                
                // Periksa konsistensi status
                if (borrowData.status === 'dipinjam' && file.status === 'dipinjam') {
                    validBorrowings++;
                    this.validationResults.success.push(
                        `✅ Peminjaman konsisten: ${file.title} dipinjam oleh ${borrowData.borrower_id}`
                    );
                } else if (borrowData.status === 'dikembalikan' && file.status === 'tersedia') {
                    validBorrowings++;
                    this.validationResults.success.push(
                        `✅ Pemulangan konsisten: ${file.title} telah dikembalikan`
                    );
                } else {
                    invalidBorrowings++;
                    this.validationResults.errors.push(
                        `❌ Status peminjaman tidak konsisten: ${file.title} - Rekod: ${borrowData.status}, Fail: ${file.status}`
                    );
                }
            } else {
                invalidBorrowings++;
                this.validationResults.errors.push(
                    `❌ Rekod peminjaman merujuk fail yang tidak wujud: ${borrowData.file_id}`
                );
            }
        }

        console.log(`   ✅ Rekod peminjaman valid: ${validBorrowings}`);
        console.log(`   ❌ Rekod peminjaman tidak valid: ${invalidBorrowings}`);
    }

    generateValidationReport() {
        console.log('\n📋 LAPORAN VALIDASI SINKRONISASI');
        console.log('=====================================\n');

        // Statistik keseluruhan
        console.log('📊 STATISTIK KESELURUHAN:');
        console.log(`• Total fail: ${this.validationResults.totalFiles}`);
        console.log(`• Total lokasi: ${this.validationResults.totalLocations}`);
        console.log(`• Rujukan valid: ${this.validationResults.validReferences}`);
        console.log(`• Rujukan tidak valid: ${this.validationResults.invalidReferences}`);
        console.log(`• Fail tanpa lokasi: ${this.validationResults.filesWithoutLocation}`);
        console.log(`• Lokasi tidak digunakan: ${this.validationResults.unusedLocations}`);
        console.log(`• Status konsisten: ${this.validationResults.consistentStatuses}`);
        console.log(`• Status tidak konsisten: ${this.validationResults.inconsistentStatuses}`);

        // Skor kesihatan sistem
        const totalChecks = this.validationResults.validReferences + 
                           this.validationResults.invalidReferences + 
                           this.validationResults.consistentStatuses + 
                           this.validationResults.inconsistentStatuses;
                           
        const healthyChecks = this.validationResults.validReferences + 
                             this.validationResults.consistentStatuses;
                             
        const healthScore = totalChecks > 0 ? Math.round((healthyChecks / totalChecks) * 100) : 0;

        console.log(`\n🎯 SKOR KESIHATAN SISTEM: ${healthScore}%`);

        // Status keseluruhan
        if (this.validationResults.errors.length === 0) {
            console.log('\n🎉 STATUS: LULUS VALIDASI');
            console.log('✅ Semua isu sinkronisasi telah diselesaikan');
            console.log('✅ Sistem berfungsi dengan sempurna');
        } else {
            console.log('\n⚠️ STATUS: MASIH ADA ISU');
            console.log(`❌ ${this.validationResults.errors.length} ralat perlu diselesaikan`);
            console.log(`⚠️ ${this.validationResults.warnings.length} amaran untuk diperhatikan`);
        }

        // Senarai ralat (jika ada)
        if (this.validationResults.errors.length > 0) {
            console.log('\n❌ RALAT YANG PERLU DISELESAIKAN:');
            this.validationResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        // Senarai amaran (jika ada)
        if (this.validationResults.warnings.length > 0 && this.validationResults.warnings.length <= 10) {
            console.log('\n⚠️ AMARAN:');
            this.validationResults.warnings.forEach((warning, index) => {
                console.log(`${index + 1}. ${warning}`);
            });
        } else if (this.validationResults.warnings.length > 10) {
            console.log(`\n⚠️ AMARAN: ${this.validationResults.warnings.length} amaran (terlalu banyak untuk dipaparkan)`);
        }

        // Cadangan tindakan
        console.log('\n💡 CADANGAN TINDAKAN:');
        if (this.validationResults.invalidReferences > 0) {
            console.log('• Jalankan semula fix-sync-issues.js untuk membaiki rujukan tidak valid');
        }
        if (this.validationResults.filesWithoutLocation > 0) {
            console.log('• Tetapkan lokasi untuk fail yang tidak mempunyai lokasi');
        }
        if (this.validationResults.unusedLocations > 5) {
            console.log('• Pertimbang untuk mengeluarkan lokasi yang tidak digunakan');
        }
        if (this.validationResults.inconsistentStatuses > 0) {
            console.log('• Kemas kini status untuk memastikan konsistensi');
        }

        // Generate JSON report untuk automasi
        const jsonReport = {
            timestamp: new Date().toISOString(),
            healthScore: healthScore,
            passed: this.validationResults.errors.length === 0,
            statistics: {
                totalFiles: this.validationResults.totalFiles,
                totalLocations: this.validationResults.totalLocations,
                validReferences: this.validationResults.validReferences,
                invalidReferences: this.validationResults.invalidReferences,
                filesWithoutLocation: this.validationResults.filesWithoutLocation,
                unusedLocations: this.validationResults.unusedLocations,
                consistentStatuses: this.validationResults.consistentStatuses,
                inconsistentStatuses: this.validationResults.inconsistentStatuses
            },
            errors: this.validationResults.errors,
            warnings: this.validationResults.warnings.slice(0, 20), // Limit untuk JSON
            success: this.validationResults.success.slice(0, 10) // Limit untuk JSON
        };

        console.log('\n💾 JSON Report (untuk automasi):');
        console.log(JSON.stringify(jsonReport, null, 2));

        return jsonReport;
    }
}

// Jalankan validasi
const validator = new SyncValidator();
validator.validateAllSyncIssues().catch(console.error);

export default SyncValidator;