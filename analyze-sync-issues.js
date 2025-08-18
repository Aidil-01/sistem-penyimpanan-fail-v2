// Firebase Sync Analysis Script untuk Sistem Penyimpanan Fail Tongod
// Menganalisis masalah sinkronisasi antara koleksi fail dan lokasi

import { db, collection, getDocs, doc, getDoc, query, where } from './firebase-conversion/js/firebase-config.js';

class FirebaseSyncAnalyzer {
    constructor() {
        this.issues = {
            orphanedFiles: [],
            missingLocations: [],
            invalidLocationRefs: [],
            inconsistentData: []
        };
    }

    async analyzeDataIntegrity() {
        console.log('🔍 Memulakan analisis integriti data...');
        
        try {
            // 1. Ambil semua fail dan lokasi
            const [filesSnapshot, locationsSnapshot] = await Promise.all([
                getDocs(collection(db, 'files')),
                getDocs(collection(db, 'locations'))
            ]);

            const files = {};
            const locations = {};

            // Process files data
            filesSnapshot.forEach(doc => {
                files[doc.id] = { id: doc.id, ...doc.data() };
            });

            // Process locations data
            locationsSnapshot.forEach(doc => {
                locations[doc.id] = { id: doc.id, ...doc.data() };
            });

            console.log(`📊 Dijumpai ${Object.keys(files).length} fail dan ${Object.keys(locations).length} lokasi`);

            // 2. Periksa fail yang merujuk lokasi yang tidak wujud
            await this.checkOrphanedFileReferences(files, locations);

            // 3. Periksa lokasi yang tidak dirujuk oleh mana-mana fail
            await this.checkUnusedLocations(files, locations);

            // 4. Periksa fail tanpa lokasi yang ditetapkan
            await this.checkFilesWithoutLocation(files);

            // 5. Periksa konsistensi status lokasi
            await this.checkLocationAvailability(files, locations);

            // Generate laporan
            this.generateReport();

        } catch (error) {
            console.error('❌ Ralat semasa analisis:', error);
        }
    }

    async checkOrphanedFileReferences(files, locations) {
        console.log('🔎 Memeriksa rujukan lokasi yang tidak wujud...');
        
        for (const [fileId, file] of Object.entries(files)) {
            if (file.location_id) {
                if (!locations[file.location_id]) {
                    this.issues.orphanedFiles.push({
                        fileId: fileId,
                        fileName: file.title,
                        missingLocationId: file.location_id,
                        department: file.department
                    });
                }
            } else {
                this.issues.missingLocations.push({
                    fileId: fileId,
                    fileName: file.title,
                    department: file.department,
                    status: file.status
                });
            }
        }
    }

    async checkUnusedLocations(files, locations) {
        console.log('🔎 Memeriksa lokasi yang tidak digunakan...');
        
        const usedLocationIds = new Set();
        
        // Kumpul semua location_id yang digunakan
        Object.values(files).forEach(file => {
            if (file.location_id) {
                usedLocationIds.add(file.location_id);
            }
        });

        // Periksa lokasi yang tidak digunakan
        for (const [locationId, location] of Object.entries(locations)) {
            if (!usedLocationIds.has(locationId)) {
                this.issues.invalidLocationRefs.push({
                    locationId: locationId,
                    room: location.room,
                    rack: location.rack,
                    slot: location.slot,
                    description: location.description,
                    isAvailable: location.is_available
                });
            }
        }
    }

    async checkFilesWithoutLocation(files) {
        console.log('🔎 Memeriksa fail tanpa lokasi...');
        
        for (const [fileId, file] of Object.entries(files)) {
            if (!file.location_id || file.location_id === '') {
                this.issues.missingLocations.push({
                    fileId: fileId,
                    fileName: file.title,
                    department: file.department,
                    status: file.status,
                    reason: 'Tiada location_id'
                });
            }
        }
    }

    async checkLocationAvailability(files, locations) {
        console.log('🔎 Memeriksa konsistensi ketersediaan lokasi...');
        
        for (const [fileId, file] of Object.entries(files)) {
            if (file.location_id && locations[file.location_id]) {
                const location = locations[file.location_id];
                
                // Periksa jika fail berstatus "tersedia" tetapi lokasi tidak tersedia
                if (file.status === 'tersedia' && !location.is_available) {
                    this.issues.inconsistentData.push({
                        type: 'location_availability_mismatch',
                        fileId: fileId,
                        fileName: file.title,
                        fileStatus: file.status,
                        locationId: file.location_id,
                        locationAvailable: location.is_available,
                        issue: 'Fail berstatus tersedia tetapi lokasi tidak tersedia'
                    });
                }

                // Periksa jika fail berstatus "dipinjam" tetapi lokasi masih tersedia
                if (file.status === 'dipinjam' && location.is_available) {
                    this.issues.inconsistentData.push({
                        type: 'borrowing_status_mismatch',
                        fileId: fileId,
                        fileName: file.title,
                        fileStatus: file.status,
                        locationId: file.location_id,
                        locationAvailable: location.is_available,
                        issue: 'Fail berstatus dipinjam tetapi lokasi masih tersedia'
                    });
                }
            }
        }
    }

    generateReport() {
        console.log('\n📋 LAPORAN ANALISIS SINKRONISASI');
        console.log('====================================\n');

        // Fail orphaned (merujuk lokasi yang tidak wujud)
        if (this.issues.orphanedFiles.length > 0) {
            console.log('❌ FAIL DENGAN RUJUKAN LOKASI TIDAK WUJUD:');
            this.issues.orphanedFiles.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.fileName} (${issue.fileId})`);
                console.log(`   Lokasi tidak wujud: ${issue.missingLocationId}`);
                console.log(`   Jabatan: ${issue.department}\n`);
            });
        }

        // Fail tanpa lokasi
        if (this.issues.missingLocations.length > 0) {
            console.log('⚠️  FAIL TANPA LOKASI DITETAPKAN:');
            this.issues.missingLocations.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.fileName} (${issue.fileId})`);
                console.log(`   Jabatan: ${issue.department}`);
                console.log(`   Status: ${issue.status}`);
                if (issue.reason) console.log(`   Sebab: ${issue.reason}`);
                console.log('');
            });
        }

        // Lokasi tidak digunakan
        if (this.issues.invalidLocationRefs.length > 0) {
            console.log('📍 LOKASI TIDAK DIGUNAKAN:');
            this.issues.invalidLocationRefs.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.room} - ${issue.rack}/${issue.slot} (${issue.locationId})`);
                console.log(`   Keterangan: ${issue.description}`);
                console.log(`   Tersedia: ${issue.isAvailable}\n`);
            });
        }

        // Data tidak konsisten
        if (this.issues.inconsistentData.length > 0) {
            console.log('🔄 DATA TIDAK KONSISTEN:');
            this.issues.inconsistentData.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.fileName} (${issue.fileId})`);
                console.log(`   Isu: ${issue.issue}`);
                console.log(`   Status fail: ${issue.fileStatus}`);
                console.log(`   Lokasi tersedia: ${issue.locationAvailable}\n`);
            });
        }

        // Ringkasan
        console.log('📊 RINGKASAN:');
        console.log(`• Fail orphaned: ${this.issues.orphanedFiles.length}`);
        console.log(`• Fail tanpa lokasi: ${this.issues.missingLocations.length}`);
        console.log(`• Lokasi tidak digunakan: ${this.issues.invalidLocationRefs.length}`);
        console.log(`• Data tidak konsisten: ${this.issues.inconsistentData.length}`);

        return this.issues;
    }

    // Generate sync script based on found issues
    generateSyncScript() {
        let script = `// Skrip pembetulan sinkronisasi yang dijana secara automatik
// Tarikh: ${new Date().toISOString()}

import { db, doc, updateDoc, addDoc, collection, serverTimestamp } from './firebase-conversion/js/firebase-config.js';

async function fixSyncIssues() {
    console.log('🔧 Memulakan pembetulan isu sinkronisasi...');
    
`;

        // Fix orphaned files
        if (this.issues.orphanedFiles.length > 0) {
            script += `    // 1. Betulkan fail dengan rujukan lokasi tidak wujud
    const orphanedFiles = ${JSON.stringify(this.issues.orphanedFiles, null, 4)};
    
    for (const issue of orphanedFiles) {
        try {
            // Tetapkan lokasi default atau null
            await updateDoc(doc(db, 'files', issue.fileId), {
                location_id: null, // atau tetapkan ke lokasi default
                updated_at: serverTimestamp(),
                sync_notes: \`Rujukan lokasi \${issue.missingLocationId} tidak wujud - direset\`
            });
            console.log(\`✅ Diperbaiki: \${issue.fileName}\`);
        } catch (error) {
            console.error(\`❌ Gagal membaiki \${issue.fileName}:\`, error);
        }
    }
    
`;
        }

        // Fix files without location
        if (this.issues.missingLocations.length > 0) {
            script += `    // 2. Tetapkan lokasi untuk fail tanpa lokasi
    const filesWithoutLocation = ${JSON.stringify(this.issues.missingLocations, null, 4)};
    
    // Cipta lokasi default jika diperlukan
    const defaultLocation = await addDoc(collection(db, 'locations'), {
        room: 'Stor Default',
        rack: 'DEF001',
        slot: '001',
        description: 'Lokasi default untuk fail tanpa lokasi ditetapkan',
        is_available: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
    });
    
    for (const issue of filesWithoutLocation) {
        try {
            await updateDoc(doc(db, 'files', issue.fileId), {
                location_id: defaultLocation.id,
                updated_at: serverTimestamp(),
                sync_notes: 'Lokasi default ditetapkan secara automatik'
            });
            console.log(\`✅ Lokasi ditetapkan: \${issue.fileName}\`);
        } catch (error) {
            console.error(\`❌ Gagal menetapkan lokasi untuk \${issue.fileName}:\`, error);
        }
    }
    
`;
        }

        // Fix inconsistent data
        if (this.issues.inconsistentData.length > 0) {
            script += `    // 3. Betulkan data tidak konsisten
    const inconsistentData = ${JSON.stringify(this.issues.inconsistentData, null, 4)};
    
    for (const issue of inconsistentData) {
        try {
            if (issue.type === 'location_availability_mismatch') {
                // Kemas kini ketersediaan lokasi berdasarkan status fail
                await updateDoc(doc(db, 'locations', issue.locationId), {
                    is_available: issue.fileStatus === 'tersedia',
                    updated_at: serverTimestamp()
                });
            }
            console.log(\`✅ Data konsisten diperbaiki: \${issue.fileName}\`);
        } catch (error) {
            console.error(\`❌ Gagal membaiki konsistensi untuk \${issue.fileName}:\`, error);
        }
    }
    
`;
        }

        script += `    console.log('🎉 Pembetulan selesai!');
}

// Jalankan pembetulan
fixSyncIssues().catch(console.error);`;

        return script;
    }
}

// Jalankan analisis
const analyzer = new FirebaseSyncAnalyzer();
analyzer.analyzeDataIntegrity().then(() => {
    // Generate dan simpan skrip pembetulan
    const syncScript = analyzer.generateSyncScript();
    console.log('\n💾 Skrip pembetulan telah dijana. Simpan sebagai fix-sync-issues.js');
    console.log('\n' + syncScript);
});

export default FirebaseSyncAnalyzer;