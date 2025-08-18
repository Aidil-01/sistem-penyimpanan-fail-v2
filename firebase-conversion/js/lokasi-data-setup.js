// Lokasi Data Setup and Validation Script
// Creates proper lokasi collection structure for dropdown functionality

import { 
    db, 
    collection, 
    doc, 
    addDoc, 
    setDoc,
    getDocs, 
    updateDoc,
    deleteDoc,
    writeBatch,
    serverTimestamp
} from './firebase-config.js';

class LokasiDataManager {
    constructor() {
        this.collectionName = 'lokasi';
        this.debugMode = window.location.search.includes('debug=true');
        
        this.log('LokasiDataManager initialized');
    }

    log(message, data = null) {
        if (this.debugMode) {
            const timestamp = new Date().toISOString();
            if (data) {
                console.log(`🗂️ [${timestamp}] ${message}`, data);
            } else {
                console.log(`🗂️ [${timestamp}] ${message}`);
            }
        }
    }

    // Check if lokasi collection exists and has proper structure
    async checkLokasiCollection() {
        this.log('Checking lokasi collection...');
        
        try {
            const collectionRef = collection(db, this.collectionName);
            const snapshot = await getDocs(collectionRef);
            
            const result = {
                exists: snapshot.size > 0,
                documentCount: snapshot.size,
                documents: [],
                validStructure: true,
                missingFields: [],
                issues: []
            };

            if (snapshot.size > 0) {
                // Analyze document structure
                const requiredFields = ['id', 'nama'];
                const optionalFields = ['type', 'capacity', 'available_slots', 'description', 'created_at', 'updated_at'];
                
                snapshot.forEach((doc, index) => {
                    const data = doc.data();
                    const docInfo = {
                        id: doc.id,
                        data: data,
                        fields: Object.keys(data),
                        valid: true,
                        issues: []
                    };

                    // Check required fields
                    requiredFields.forEach(field => {
                        if (!data.hasOwnProperty(field) || data[field] === null || data[field] === undefined) {
                            docInfo.issues.push(`Missing required field: ${field}`);
                            docInfo.valid = false;
                            result.validStructure = false;
                        }
                    });

                    // Check field types
                    if (data.id && typeof data.id !== 'string') {
                        docInfo.issues.push('ID field should be string');
                    }
                    
                    if (data.nama && typeof data.nama !== 'string') {
                        docInfo.issues.push('Nama field should be string');
                    }

                    if (data.capacity && typeof data.capacity !== 'number') {
                        docInfo.issues.push('Capacity field should be number');
                    }

                    result.documents.push(docInfo);
                });

                // Overall collection issues
                const duplicateIds = this.findDuplicateIds(result.documents);
                if (duplicateIds.length > 0) {
                    result.issues.push(`Duplicate IDs found: ${duplicateIds.join(', ')}`);
                    result.validStructure = false;
                }

            } else {
                result.issues.push('Collection exists but is empty');
            }

            this.log('Collection check completed:', result);
            return result;

        } catch (error) {
            this.log('Error checking collection:', error);
            return {
                exists: false,
                error: error.message,
                issues: ['Failed to access collection']
            };
        }
    }

    // Find duplicate IDs across documents
    findDuplicateIds(documents) {
        const ids = {};
        const duplicates = [];

        documents.forEach(doc => {
            const id = doc.data.id || doc.id;
            if (ids[id]) {
                if (!duplicates.includes(id)) {
                    duplicates.push(id);
                }
            } else {
                ids[id] = true;
            }
        });

        return duplicates;
    }

    // Create sample lokasi data with proper structure
    async createSampleData() {
        this.log('Creating sample lokasi data...');
        
        const sampleLocations = [
            {
                id: 'lok001',
                nama: 'Pejabat Daerah Tongod - Tingkat 1',
                type: 'office',
                capacity: 50,
                available_slots: 25,
                description: 'Ruang penyimpanan fail utama di tingkat 1',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            },
            {
                id: 'lok002',
                nama: 'Pejabat Daerah Tongod - Tingkat 2', 
                type: 'office',
                capacity: 40,
                available_slots: 15,
                description: 'Ruang penyimpanan fail tambahan di tingkat 2',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            },
            {
                id: 'lok003',
                nama: 'Stor Arkib Utama',
                type: 'storage',
                capacity: 200,
                available_slots: 120,
                description: 'Stor arkib utama untuk fail lama',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            },
            {
                id: 'lok004',
                nama: 'Bilik Mesyuarat',
                type: 'meeting',
                capacity: 20,
                available_slots: 8,
                description: 'Ruang simpanan dokumen mesyuarat',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            },
            {
                id: 'lok005',
                nama: 'Stor Kewangan',
                type: 'financial',
                capacity: 75,
                available_slots: 35,
                description: 'Stor khusus untuk dokumen kewangan',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            }
        ];

        try {
            const batch = writeBatch(db);
            const collectionRef = collection(db, this.collectionName);
            
            sampleLocations.forEach((location) => {
                const docRef = doc(collectionRef, location.id);
                batch.set(docRef, location);
            });

            await batch.commit();
            
            this.log(`✅ Successfully created ${sampleLocations.length} sample locations`);
            return {
                success: true,
                count: sampleLocations.length,
                locations: sampleLocations
            };

        } catch (error) {
            this.log('❌ Error creating sample data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update existing documents to proper structure
    async fixDataStructure() {
        this.log('Fixing data structure...');
        
        try {
            const collectionRef = collection(db, this.collectionName);
            const snapshot = await getDocs(collectionRef);
            
            if (snapshot.empty) {
                this.log('Collection is empty, creating sample data...');
                return await this.createSampleData();
            }

            const fixes = [];
            const batch = writeBatch(db);

            snapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                const docRef = doc(db, this.collectionName, docSnapshot.id);
                const updates = {};
                let needsUpdate = false;

                // Ensure ID field matches document ID
                if (!data.id || data.id !== docSnapshot.id) {
                    updates.id = docSnapshot.id;
                    needsUpdate = true;
                    fixes.push(`Fixed ID for document ${docSnapshot.id}`);
                }

                // Ensure nama field exists
                if (!data.nama) {
                    if (data.name) {
                        updates.nama = data.name;
                    } else if (data.locationName) {
                        updates.nama = data.locationName;
                    } else {
                        updates.nama = `Location ${docSnapshot.id}`;
                    }
                    needsUpdate = true;
                    fixes.push(`Added nama field for document ${docSnapshot.id}`);
                }

                // Add missing timestamps
                if (!data.created_at) {
                    updates.created_at = serverTimestamp();
                    needsUpdate = true;
                }

                if (!data.updated_at) {
                    updates.updated_at = serverTimestamp();
                    needsUpdate = true;
                }

                // Add default capacity if missing
                if (!data.capacity) {
                    updates.capacity = 50;
                    updates.available_slots = 25;
                    needsUpdate = true;
                    fixes.push(`Added default capacity for document ${docSnapshot.id}`);
                }

                // Add default type if missing
                if (!data.type) {
                    updates.type = 'office';
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    batch.update(docRef, updates);
                }
            });

            if (fixes.length > 0) {
                await batch.commit();
                this.log(`✅ Applied ${fixes.length} fixes:`, fixes);
            } else {
                this.log('✅ No fixes needed - data structure is correct');
            }

            return {
                success: true,
                fixesApplied: fixes.length,
                fixes: fixes
            };

        } catch (error) {
            this.log('❌ Error fixing data structure:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Validate and clean duplicate documents
    async cleanDuplicates() {
        this.log('Cleaning duplicate documents...');
        
        try {
            const collectionRef = collection(db, this.collectionName);
            const snapshot = await getDocs(collectionRef);
            
            const seenIds = new Set();
            const duplicates = [];

            snapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                const dataId = data.id || docSnapshot.id;
                
                if (seenIds.has(dataId)) {
                    duplicates.push({
                        docId: docSnapshot.id,
                        dataId: dataId,
                        data: data
                    });
                } else {
                    seenIds.add(dataId);
                }
            });

            if (duplicates.length > 0) {
                this.log(`Found ${duplicates.length} duplicates:`, duplicates);
                
                // Delete duplicates (keep first occurrence)
                const batch = writeBatch(db);
                duplicates.forEach(duplicate => {
                    const docRef = doc(db, this.collectionName, duplicate.docId);
                    batch.delete(docRef);
                });

                await batch.commit();
                this.log(`✅ Deleted ${duplicates.length} duplicate documents`);
            } else {
                this.log('✅ No duplicates found');
            }

            return {
                success: true,
                duplicatesRemoved: duplicates.length,
                duplicates: duplicates
            };

        } catch (error) {
            this.log('❌ Error cleaning duplicates:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Comprehensive data setup and validation
    async setupLokasiData() {
        this.log('🚀 Starting comprehensive lokasi data setup...');
        
        const results = {
            checkResult: null,
            fixResult: null,
            cleanResult: null,
            finalCheck: null
        };

        try {
            // Step 1: Check current state
            results.checkResult = await this.checkLokasiCollection();
            
            // Step 2: Fix structure if needed
            if (!results.checkResult.validStructure || results.checkResult.documentCount === 0) {
                results.fixResult = await this.fixDataStructure();
            }

            // Step 3: Clean duplicates
            results.cleanResult = await this.cleanDuplicates();

            // Step 4: Final validation
            results.finalCheck = await this.checkLokasiCollection();

            this.log('🏁 Lokasi data setup completed:', results);
            return results;

        } catch (error) {
            this.log('❌ Error in data setup:', error);
            return {
                success: false,
                error: error.message,
                results: results
            };
        }
    }

    // Export data for backup
    async exportData() {
        this.log('Exporting lokasi data...');
        
        try {
            const collectionRef = collection(db, this.collectionName);
            const snapshot = await getDocs(collectionRef);
            
            const exportData = {
                collection: this.collectionName,
                timestamp: new Date().toISOString(),
                documentCount: snapshot.size,
                documents: []
            };

            snapshot.forEach((doc) => {
                exportData.documents.push({
                    id: doc.id,
                    data: doc.data()
                });
            });

            this.log(`✅ Exported ${exportData.documentCount} documents`);
            return exportData;

        } catch (error) {
            this.log('❌ Error exporting data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Import data from backup
    async importData(exportData) {
        this.log('Importing lokasi data...');
        
        try {
            if (!exportData.documents || !Array.isArray(exportData.documents)) {
                throw new Error('Invalid import data format');
            }

            const batch = writeBatch(db);
            const collectionRef = collection(db, this.collectionName);

            exportData.documents.forEach((docData) => {
                const docRef = doc(collectionRef, docData.id);
                batch.set(docRef, {
                    ...docData.data,
                    imported_at: serverTimestamp()
                });
            });

            await batch.commit();
            
            this.log(`✅ Imported ${exportData.documents.length} documents`);
            return {
                success: true,
                count: exportData.documents.length
            };

        } catch (error) {
            this.log('❌ Error importing data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Generate summary report
    generateReport(setupResults) {
        const report = {
            timestamp: new Date().toISOString(),
            collection: this.collectionName,
            summary: {
                initialDocuments: setupResults.checkResult?.documentCount || 0,
                finalDocuments: setupResults.finalCheck?.documentCount || 0,
                validStructure: setupResults.finalCheck?.validStructure || false,
                fixesApplied: setupResults.fixResult?.fixesApplied || 0,
                duplicatesRemoved: setupResults.cleanResult?.duplicatesRemoved || 0
            },
            details: setupResults,
            recommendations: []
        };

        // Generate recommendations
        if (report.summary.finalDocuments === 0) {
            report.recommendations.push({
                priority: 'HIGH',
                issue: 'No documents in lokasi collection',
                solution: 'Run createSampleData() to add sample locations'
            });
        }

        if (!report.summary.validStructure) {
            report.recommendations.push({
                priority: 'HIGH',
                issue: 'Invalid data structure detected',
                solution: 'Run fixDataStructure() to correct field mappings'
            });
        }

        if (report.summary.duplicatesRemoved > 0) {
            report.recommendations.push({
                priority: 'MEDIUM',
                issue: 'Duplicate documents were found and removed',
                solution: 'Review data entry processes to prevent future duplicates'
            });
        }

        return report;
    }
}

// Export for use in other modules
export default LokasiDataManager;

// Auto-setup when imported with setup flag
if (typeof window !== 'undefined' && window.location.search.includes('setup=true')) {
    window.addEventListener('DOMContentLoaded', async () => {
        const manager = new LokasiDataManager();
        console.log('🚀 Auto-running lokasi data setup...');
        
        const results = await manager.setupLokasiData();
        const report = manager.generateReport(results);
        
        console.log('📋 LOKASI SETUP REPORT:', report);
        
        // Add to window for easy access
        window.lokasiDataManager = manager;
        window.lokasiSetupReport = report;
    });
}