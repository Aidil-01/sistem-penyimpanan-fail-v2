// Firebase Data Debugging Script
// Comprehensive debugging for lokasi collection data loading issues

import { 
    db, 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    onSnapshot,
    query,
    where,
    orderBy
} from './firebase-config.js';

class FirebaseDataDebugger {
    constructor() {
        this.debugLogs = [];
        this.startTime = Date.now();
        
        console.log('🔍 Firebase Data Debugger initialized');
    }

    log(message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            elapsed: Date.now() - this.startTime,
            message,
            data
        };
        
        this.debugLogs.push(logEntry);
        
        if (data) {
            console.log(`🐛 [${timestamp}] ${message}`, data);
        } else {
            console.log(`🐛 [${timestamp}] ${message}`);
        }
    }

    // 1. Debug Firebase connection
    async testFirebaseConnection() {
        this.log('Testing Firebase connection...');
        
        try {
            // Test basic collection access
            const testRef = collection(db, 'test');
            this.log('✅ Firebase connection successful - collection reference created');
            return true;
        } catch (error) {
            this.log('❌ Firebase connection failed', error);
            return false;
        }
    }

    // 2. Debug lokasi collection specifically
    async debugLokasiCollection() {
        this.log('Debugging lokasi collection...');
        
        try {
            // Try multiple collection name variations
            const collectionNames = ['lokasi', 'locations', 'Lokasi', 'LOKASI'];
            
            for (const name of collectionNames) {
                this.log(`Checking collection: ${name}`);
                
                try {
                    const collectionRef = collection(db, name);
                    const snapshot = await getDocs(collectionRef);
                    
                    this.log(`📊 Collection '${name}': ${snapshot.size} documents found`);
                    
                    if (snapshot.size > 0) {
                        // Log first document structure
                        const firstDoc = snapshot.docs[0];
                        const data = firstDoc.data();
                        
                        this.log(`📋 First document in '${name}':`, {
                            id: firstDoc.id,
                            data: data,
                            fields: Object.keys(data)
                        });
                        
                        return { collectionName: name, snapshot, firstDoc: { id: firstDoc.id, data } };
                    }
                } catch (error) {
                    this.log(`❌ Error accessing collection '${name}':`, error);
                }
            }
            
            this.log('❌ No lokasi collections found with any naming variation');
            return null;
            
        } catch (error) {
            this.log('❌ Error debugging lokasi collection', error);
            return null;
        }
    }

    // 3. Debug data structure
    async debugDataStructure(collectionName = 'lokasi') {
        this.log(`Debugging data structure for collection: ${collectionName}`);
        
        try {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            if (snapshot.empty) {
                this.log(`❌ Collection '${collectionName}' is empty`);
                return null;
            }

            const documentsData = [];
            const fieldAnalysis = {};

            snapshot.forEach((doc) => {
                const data = doc.data();
                const docInfo = {
                    id: doc.id,
                    data: data,
                    fields: Object.keys(data),
                    fieldTypes: {}
                };

                // Analyze field types
                Object.keys(data).forEach(field => {
                    const value = data[field];
                    const type = typeof value;
                    docInfo.fieldTypes[field] = type;
                    
                    // Track field occurrences
                    if (!fieldAnalysis[field]) {
                        fieldAnalysis[field] = { count: 0, types: new Set(), samples: [] };
                    }
                    fieldAnalysis[field].count++;
                    fieldAnalysis[field].types.add(type);
                    if (fieldAnalysis[field].samples.length < 3) {
                        fieldAnalysis[field].samples.push(value);
                    }
                });

                documentsData.push(docInfo);
            });

            // Convert Sets to Arrays for logging
            Object.keys(fieldAnalysis).forEach(field => {
                fieldAnalysis[field].types = Array.from(fieldAnalysis[field].types);
            });

            this.log(`📊 Data structure analysis for '${collectionName}':`, {
                totalDocuments: documentsData.length,
                fieldAnalysis: fieldAnalysis,
                sampleDocuments: documentsData.slice(0, 3)
            });

            return { documentsData, fieldAnalysis };

        } catch (error) {
            this.log('❌ Error debugging data structure', error);
            return null;
        }
    }

    // 4. Debug query with different options
    async debugQueries(collectionName = 'lokasi') {
        this.log(`Testing different query options for: ${collectionName}`);
        
        const queryTests = [
            {
                name: 'Simple getDocs',
                query: () => getDocs(collection(db, collectionName))
            },
            {
                name: 'Ordered by nama',
                query: () => getDocs(query(collection(db, collectionName), orderBy('nama')))
            },
            {
                name: 'Ordered by name',
                query: () => getDocs(query(collection(db, collectionName), orderBy('name')))
            },
            {
                name: 'Ordered by id',
                query: () => getDocs(query(collection(db, collectionName), orderBy('id')))
            }
        ];

        const results = {};

        for (const test of queryTests) {
            try {
                this.log(`Testing: ${test.name}`);
                const startTime = Date.now();
                const snapshot = await test.query();
                const duration = Date.now() - startTime;
                
                results[test.name] = {
                    success: true,
                    documentCount: snapshot.size,
                    duration: duration,
                    documents: snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
                };
                
                this.log(`✅ ${test.name}: ${snapshot.size} documents in ${duration}ms`);
                
            } catch (error) {
                results[test.name] = {
                    success: false,
                    error: error.message,
                    code: error.code
                };
                
                this.log(`❌ ${test.name} failed:`, error);
            }
        }

        return results;
    }

    // 5. Debug permissions
    async debugPermissions(collectionName = 'lokasi') {
        this.log(`Testing read permissions for: ${collectionName}`);
        
        try {
            // Test collection read
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            this.log(`✅ Collection read permission: OK (${snapshot.size} docs)`);
            
            // Test document read if documents exist
            if (snapshot.size > 0) {
                const firstDocId = snapshot.docs[0].id;
                const docRef = doc(db, collectionName, firstDocId);
                const docSnapshot = await getDoc(docRef);
                
                if (docSnapshot.exists()) {
                    this.log(`✅ Document read permission: OK`);
                    return { collection: true, document: true };
                } else {
                    this.log(`❌ Document read permission: Failed`);
                    return { collection: true, document: false };
                }
            }
            
            return { collection: true, document: null };
            
        } catch (error) {
            this.log(`❌ Permission test failed:`, error);
            return { collection: false, document: false, error };
        }
    }

    // 6. Debug real-time listener
    async debugRealtimeListener(collectionName = 'lokasi') {
        this.log(`Testing real-time listener for: ${collectionName}`);
        
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                this.log('❌ Real-time listener timeout (10 seconds)');
                resolve({ success: false, reason: 'timeout' });
            }, 10000);

            try {
                const collectionRef = collection(db, collectionName);
                const unsubscribe = onSnapshot(collectionRef, 
                    (snapshot) => {
                        clearTimeout(timeout);
                        
                        this.log(`✅ Real-time listener triggered: ${snapshot.size} documents`);
                        
                        const changes = snapshot.docChanges();
                        this.log(`📝 Document changes: ${changes.length}`, 
                            changes.map(change => ({
                                type: change.type,
                                id: change.doc.id,
                                data: change.doc.data()
                            }))
                        );
                        
                        unsubscribe();
                        resolve({ 
                            success: true, 
                            documentCount: snapshot.size,
                            changes: changes.length 
                        });
                    },
                    (error) => {
                        clearTimeout(timeout);
                        this.log('❌ Real-time listener error:', error);
                        resolve({ success: false, error });
                    }
                );
                
            } catch (error) {
                clearTimeout(timeout);
                this.log('❌ Failed to set up real-time listener:', error);
                resolve({ success: false, error });
            }
        });
    }

    // 7. Run comprehensive diagnostic
    async runComprehensiveDiagnostic() {
        this.log('🚀 Starting comprehensive Firebase diagnostic...');
        
        const results = {
            connection: await this.testFirebaseConnection(),
            collections: await this.debugLokasiCollection(),
            permissions: null,
            dataStructure: null,
            queries: null,
            realtimeListener: null
        };

        // If we found a collection, run detailed tests
        if (results.collections) {
            const collectionName = results.collections.collectionName;
            this.log(`Found collection: ${collectionName}, running detailed tests...`);
            
            results.permissions = await this.debugPermissions(collectionName);
            results.dataStructure = await this.debugDataStructure(collectionName);
            results.queries = await this.debugQueries(collectionName);
            results.realtimeListener = await this.debugRealtimeListener(collectionName);
        }

        this.log('🏁 Diagnostic complete');
        return results;
    }

    // Generate diagnostic report
    generateReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            totalTime: Date.now() - this.startTime,
            summary: {
                firebaseConnection: results.connection,
                collectionsFound: results.collections ? 1 : 0,
                collectionName: results.collections?.collectionName || 'NONE',
                documentsFound: results.collections?.snapshot?.size || 0,
                permissionsOK: results.permissions?.collection && results.permissions?.document,
                realtimeListenerOK: results.realtimeListener?.success
            },
            details: results,
            logs: this.debugLogs,
            recommendations: this.generateRecommendations(results)
        };

        return report;
    }

    generateRecommendations(results) {
        const recommendations = [];

        if (!results.connection) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'Firebase connection failed',
                solution: 'Check firebase-config.js and network connectivity'
            });
        }

        if (!results.collections) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'No lokasi collection found',
                solution: 'Create lokasi collection or verify collection name spelling'
            });
        }

        if (results.collections && results.collections.snapshot.size === 0) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'Collection exists but has no documents',
                solution: 'Add location documents to the collection'
            });
        }

        if (results.permissions && !results.permissions.collection) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'Collection read permission denied',
                solution: 'Update Firestore security rules to allow read access'
            });
        }

        if (results.realtimeListener && !results.realtimeListener.success) {
            recommendations.push({
                priority: 'MEDIUM',
                issue: 'Real-time listener failed',
                solution: 'Check onSnapshot implementation and error handling'
            });
        }

        return recommendations;
    }
}

// Export for use in other modules
export default FirebaseDataDebugger;

// Auto-run diagnostic when imported with debug flag
if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
    window.addEventListener('DOMContentLoaded', async () => {
        const debugger = new FirebaseDataDebugger();
        const results = await debugger.runComprehensiveDiagnostic();
        const report = debugger.generateReport(results);
        
        console.log('📋 DIAGNOSTIC REPORT:', report);
        
        // Add to window for easy access from console
        window.firebaseDebugReport = report;
        window.firebaseDebugger = debugger;
        
        // Show summary in page if element exists
        const summaryElement = document.getElementById('firebaseDebugSummary');
        if (summaryElement) {
            summaryElement.innerHTML = `
                <h4>Firebase Debug Summary</h4>
                <ul>
                    <li>Connection: ${report.summary.firebaseConnection ? '✅' : '❌'}</li>
                    <li>Collection: ${report.summary.collectionName} (${report.summary.documentsFound} docs)</li>
                    <li>Permissions: ${report.summary.permissionsOK ? '✅' : '❌'}</li>
                    <li>Real-time: ${report.summary.realtimeListenerOK ? '✅' : '❌'}</li>
                </ul>
                <p>Check console for detailed logs</p>
            `;
        }
    });
}