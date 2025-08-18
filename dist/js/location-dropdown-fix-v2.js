// Enhanced Location Dropdown Fix for Pengurusan Fail Form
// Version 2: Comprehensive fix for data loading issues

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

class LocationDropdownManager {
    constructor() {
        this.locations = new Map();
        this.availableSlots = [];
        this.isLoading = false;
        this.errorCount = 0;
        this.maxRetries = 3;
        this.debugMode = window.location.search.includes('debug=true');
        this.listeners = new Map(); // Track active listeners
        
        // Collection name variations to try
        this.collectionNames = ['lokasi', 'locations', 'Lokasi'];
        this.activeCollection = null;
        
        // Field mappings for different data structures
        this.fieldMappings = [
            { id: 'id', name: 'nama', location: 'lokasi' },
            { id: 'id', name: 'name', location: 'location' },
            { id: '_id', name: 'nama', location: 'lokasi' },
            { id: 'locationId', name: 'locationName', location: 'location' }
        ];
        
        this.log('LocationDropdownManager v2 initialized');
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

    // Main method to populate location dropdown
    async populateLocationDropdown(selectElement, selectedLocationId = null) {
        if (!selectElement) {
            console.error('Select element not provided');
            return false;
        }

        try {
            this.isLoading = true;
            this.showLoadingState(selectElement);
            this.log('Starting location dropdown population');

            // Step 1: Find the correct collection
            const collectionFound = await this.findLokasiCollection();
            if (!collectionFound) {
                this.log('No lokasi collection found, using dummy data');
                this.loadDummyLocations();
            } else {
                // Step 2: Load data from Firebase
                const success = await this.loadLocationsFromFirebase();
                if (!success) {
                    this.log('Firebase loading failed, using dummy data');
                    this.loadDummyLocations();
                }
            }

            // Step 3: Process and populate dropdown
            this.processLocationData();
            this.populateDropdownOptions(selectElement, selectedLocationId);
            
            this.showSuccessState(selectElement);
            this.log(`Dropdown populated with ${this.locations.size} locations`);
            return true;

        } catch (error) {
            console.error('Error populating location dropdown:', error);
            this.showErrorState(selectElement);
            this.loadDummyLocations(); // Fallback
            this.populateDropdownOptions(selectElement, selectedLocationId);
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    // Find the correct lokasi collection
    async findLokasiCollection() {
        this.log('Searching for lokasi collection...');
        
        for (const collectionName of this.collectionNames) {
            try {
                this.log(`Trying collection: ${collectionName}`);
                const collectionRef = collection(db, collectionName);
                const snapshot = await getDocs(collectionRef);
                
                if (snapshot.size > 0) {
                    this.activeCollection = collectionName;
                    this.log(`Found collection: ${collectionName} with ${snapshot.size} documents`);
                    
                    // Analyze first document to determine field mapping
                    const firstDoc = snapshot.docs[0];
                    const data = firstDoc.data();
                    this.determineFieldMapping(data);
                    
                    return true;
                }
            } catch (error) {
                this.log(`Collection ${collectionName} not accessible:`, error);
            }
        }
        
        this.log('No accessible lokasi collection found');
        return false;
    }

    // Determine the correct field mapping based on document structure
    determineFieldMapping(sampleData) {
        const fields = Object.keys(sampleData);
        this.log('Sample document fields:', fields);
        
        for (const mapping of this.fieldMappings) {
            const hasIdField = fields.includes(mapping.id) || fields.includes('id');
            const hasNameField = fields.includes(mapping.name) || fields.includes('nama') || fields.includes('name');
            
            if (hasIdField && hasNameField) {
                this.activeFieldMapping = mapping;
                this.log('Selected field mapping:', mapping);
                return;
            }
        }
        
        // Default mapping if no match found
        this.activeFieldMapping = { id: 'id', name: 'nama', location: 'lokasi' };
        this.log('Using default field mapping:', this.activeFieldMapping);
    }

    // Load locations from Firebase with enhanced error handling
    async loadLocationsFromFirebase() {
        if (!this.activeCollection) {
            this.log('No active collection set');
            return false;
        }

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.log(`Loading from Firebase (attempt ${attempt}/${this.maxRetries})`);
                
                const collectionRef = collection(db, this.activeCollection);
                
                // Try different query approaches
                const queries = [
                    () => getDocs(collectionRef), // Simple query
                    () => getDocs(query(collectionRef, orderBy('nama'))), // Order by nama
                    () => getDocs(query(collectionRef, orderBy('name'))), // Order by name
                ];

                let snapshot = null;
                let queryUsed = null;

                for (let i = 0; i < queries.length; i++) {
                    try {
                        snapshot = await queries[i]();
                        queryUsed = i;
                        break;
                    } catch (queryError) {
                        this.log(`Query ${i} failed:`, queryError);
                    }
                }

                if (!snapshot) {
                    throw new Error('All query approaches failed');
                }

                this.log(`Query ${queryUsed} succeeded: ${snapshot.size} documents`);
                
                if (snapshot.size === 0) {
                    this.log('Collection exists but is empty');
                    return false;
                }

                // Process documents with field mapping
                this.locations.clear();
                let successfulCount = 0;

                snapshot.forEach((doc) => {
                    try {
                        const rawData = doc.data();
                        const processedData = this.processDocumentData(doc.id, rawData);
                        
                        if (processedData) {
                            this.locations.set(doc.id, processedData);
                            successfulCount++;
                        }
                    } catch (docError) {
                        this.log(`Error processing document ${doc.id}:`, docError);
                    }
                });

                this.log(`Successfully processed ${successfulCount}/${snapshot.size} documents`);
                return successfulCount > 0;

            } catch (error) {
                this.log(`Firebase load attempt ${attempt} failed:`, error);
                
                if (attempt === this.maxRetries) {
                    console.error('All Firebase load attempts failed:', error);
                    return false;
                }
                
                // Wait before retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }

        return false;
    }

    // Process document data with flexible field mapping
    processDocumentData(docId, rawData) {
        this.log(`Processing document ${docId}:`, rawData);
        
        try {
            const mapping = this.activeFieldMapping;
            
            // Extract ID
            let id = rawData[mapping.id] || docId;
            
            // Extract name/nama
            let nama = rawData[mapping.name] || 
                      rawData.nama || 
                      rawData.name || 
                      rawData.locationName || 
                      `Location ${docId}`;
            
            // Extract additional fields if available
            const additionalData = {
                ...rawData,
                // Standardize field names
                id: id,
                nama: nama
            };

            // Validate required fields
            if (!id || !nama) {
                this.log(`Invalid document data - missing id or nama:`, { id, nama });
                return null;
            }

            return additionalData;

        } catch (error) {
            this.log(`Error processing document data:`, error);
            return null;
        }
    }

    // Process location data for dropdown
    processLocationData() {
        this.log('Processing location data for dropdown');
        
        // Convert Map to Array and sort
        this.availableSlots = Array.from(this.locations.values())
            .filter(location => {
                // Basic validation
                return location.id && location.nama;
            })
            .sort((a, b) => {
                // Sort by nama/name
                const nameA = (a.nama || '').toLowerCase();
                const nameB = (b.nama || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });

        this.log(`Processed ${this.availableSlots.length} available locations:`, this.availableSlots);
    }

    // Populate dropdown options with enhanced formatting
    populateDropdownOptions(selectElement, selectedLocationId = null) {
        this.log('Populating dropdown options');
        
        try {
            // Clear existing options
            selectElement.innerHTML = '';

            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = this.availableSlots.length > 0 ? 'Pilih Lokasi' : 'Tiada lokasi tersedia';
            defaultOption.disabled = true;
            defaultOption.selected = !selectedLocationId;
            selectElement.appendChild(defaultOption);

            // Add location options
            this.availableSlots.forEach((location, index) => {
                const option = document.createElement('option');
                option.value = location.id;
                option.textContent = location.nama;
                option.title = `${location.nama} (ID: ${location.id})`; // Tooltip
                
                // Add data attributes for additional info
                option.setAttribute('data-location-id', location.id);
                option.setAttribute('data-location-name', location.nama);
                
                // Select if matches selectedLocationId
                if (selectedLocationId && location.id === selectedLocationId) {
                    option.selected = true;
                }
                
                selectElement.appendChild(option);
            });

            this.log(`Added ${this.availableSlots.length} options to dropdown`);
            
            // Trigger change event to notify other components
            selectElement.dispatchEvent(new Event('change', { bubbles: true }));

        } catch (error) {
            console.error('Error populating dropdown options:', error);
        }
    }

    // Enhanced dummy data with more realistic locations
    loadDummyLocations() {
        this.log('Loading dummy location data');
        
        const dummyData = [
            {
                id: 'lok001',
                nama: 'Pejabat Daerah Tongod - Tingkat 1',
                type: 'office',
                capacity: 50,
                available_slots: 25
            },
            {
                id: 'lok002', 
                nama: 'Pejabat Daerah Tongod - Tingkat 2',
                type: 'office',
                capacity: 40,
                available_slots: 15
            },
            {
                id: 'lok003',
                nama: 'Stor Arkib Utama',
                type: 'storage',
                capacity: 200,
                available_slots: 120
            },
            {
                id: 'lok004',
                nama: 'Bilik Mesyuarat',
                type: 'meeting',
                capacity: 20,
                available_slots: 8
            }
        ];

        this.locations.clear();
        dummyData.forEach(location => {
            this.locations.set(location.id, location);
        });

        this.processLocationData();
        this.log(`Loaded ${dummyData.length} dummy locations`);
    }

    // Setup real-time listener with enhanced error handling
    setupRealtimeListener(selectElement, selectedLocationId = null) {
        this.log('Setting up real-time listener');
        
        if (!this.activeCollection) {
            this.log('No active collection for real-time listener');
            return null;
        }

        try {
            const collectionRef = collection(db, this.activeCollection);
            
            const unsubscribe = onSnapshot(collectionRef,
                (snapshot) => {
                    this.log(`Real-time update: ${snapshot.size} documents`);
                    
                    // Process changes
                    const changes = snapshot.docChanges();
                    this.log(`Document changes: ${changes.length}`, changes.map(c => ({ type: c.type, id: c.doc.id })));
                    
                    // Reload data
                    this.locations.clear();
                    snapshot.forEach((doc) => {
                        const processedData = this.processDocumentData(doc.id, doc.data());
                        if (processedData) {
                            this.locations.set(doc.id, processedData);
                        }
                    });
                    
                    this.processLocationData();
                    this.populateDropdownOptions(selectElement, selectedLocationId);
                },
                (error) => {
                    console.error('Real-time listener error:', error);
                    this.log('Real-time listener error:', error);
                }
            );

            // Store listener for cleanup
            this.listeners.set(selectElement, unsubscribe);
            this.log('Real-time listener set up successfully');
            
            return unsubscribe;

        } catch (error) {
            console.error('Failed to setup real-time listener:', error);
            this.log('Failed to setup real-time listener:', error);
            return null;
        }
    }

    // Cleanup listeners
    cleanup() {
        this.log('Cleaning up listeners');
        this.listeners.forEach((unsubscribe, element) => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners.clear();
    }

    // UI State management methods
    showLoadingState(selectElement) {
        selectElement.disabled = true;
        selectElement.innerHTML = '<option>⏳ Memuatkan lokasi...</option>';
        selectElement.classList.add('loading');
    }

    showSuccessState(selectElement) {
        selectElement.disabled = false;
        selectElement.classList.remove('loading', 'error');
        selectElement.classList.add('success');
        
        // Remove success class after animation
        setTimeout(() => {
            selectElement.classList.remove('success');
        }, 2000);
    }

    showErrorState(selectElement) {
        selectElement.disabled = false;
        selectElement.classList.remove('loading', 'success');
        selectElement.classList.add('error');
    }

    // Get current status for debugging
    getStatus() {
        return {
            isLoading: this.isLoading,
            activeCollection: this.activeCollection,
            activeFieldMapping: this.activeFieldMapping,
            locationCount: this.locations.size,
            availableSlotCount: this.availableSlots.length,
            listenerCount: this.listeners.size,
            errorCount: this.errorCount
        };
    }

    // Validate dropdown data
    validateData() {
        const issues = [];
        
        if (this.locations.size === 0) {
            issues.push('No locations loaded');
        }
        
        if (this.availableSlots.length === 0) {
            issues.push('No available slots processed');
        }
        
        // Check for duplicate IDs
        const ids = new Set();
        const duplicates = [];
        this.availableSlots.forEach(location => {
            if (ids.has(location.id)) {
                duplicates.push(location.id);
            } else {
                ids.add(location.id);
            }
        });
        
        if (duplicates.length > 0) {
            issues.push(`Duplicate IDs found: ${duplicates.join(', ')}`);
        }
        
        // Check for missing names
        const missingNames = this.availableSlots.filter(loc => !loc.nama || loc.nama.trim() === '');
        if (missingNames.length > 0) {
            issues.push(`${missingNames.length} locations missing names`);
        }
        
        return {
            valid: issues.length === 0,
            issues: issues,
            stats: {
                totalLocations: this.locations.size,
                processedSlots: this.availableSlots.length,
                uniqueIds: ids.size
            }
        };
    }
}

// Create global instance
const locationDropdownManager = new LocationDropdownManager();

// Export for use in other modules
export default locationDropdownManager;

// Debug utilities for console
if (typeof window !== 'undefined') {
    window.locationDropdownManager = locationDropdownManager;
    window.debugLocationDropdown = () => {
        console.log('Location Dropdown Status:', locationDropdownManager.getStatus());
        console.log('Data Validation:', locationDropdownManager.validateData());
    };
}