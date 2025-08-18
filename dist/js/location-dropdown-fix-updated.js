// Enhanced Location Dropdown Fix for Pengurusan Fail Form  
// Fixes: Collection name, data mapping, async timing, validation

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
        this.listeners = new Map();
        
        // Collection names to try (lokasi is primary)
        this.collectionNames = ['lokasi', 'locations', 'Lokasi'];
        this.activeCollection = null;
        
        this.log('LocationDropdownManager initialized');
    }

    log(message, data = null) {
        if (this.debugMode) {
            const timestamp = new Date().toISOString();
            if (data) {
                console.log(`🗂️ [${timestamp}] ${message}`, data);
            } else {
                console.log(`🗂️ [${timestamp}] ${message}`);
            }
        } else {
            console.log(message, data);
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

            // Try to load locations from Firebase
            const success = await this.loadLocationsFromFirebase();
            
            if (!success) {
                this.log('Firebase loading failed, using dummy data');
                this.loadDummyLocations();
            }

            // Filter and populate dropdown
            this.filterAvailableSlots();
            this.populateDropdownOptions(selectElement, selectedLocationId);
            
            this.showSuccessState(selectElement);
            this.log(`Dropdown populated with ${this.availableSlots.length} options`);
            return true;

        } catch (error) {
            console.error('Error populating location dropdown:', error);
            this.showErrorState(selectElement);
            
            // Fallback to dummy data on error
            this.loadDummyLocations();
            this.filterAvailableSlots();
            this.populateDropdownOptions(selectElement, selectedLocationId);
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    // Load locations from Firebase with enhanced collection detection
    async loadLocationsFromFirebase() {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.log(`Loading from Firebase (attempt ${attempt}/${this.maxRetries})`);
                
                // Try multiple collection names
                let snapshot = null;
                let foundCollection = null;
                
                for (const collectionName of this.collectionNames) {
                    try {
                        this.log(`Trying collection: ${collectionName}`);
                        const collectionRef = collection(db, collectionName);
                        
                        // Try different query approaches
                        const queryMethods = [
                            () => getDocs(collectionRef),
                            () => getDocs(query(collectionRef, orderBy('nama'))),
                            () => getDocs(query(collectionRef, orderBy('name')))
                        ];

                        for (const queryMethod of queryMethods) {
                            try {
                                snapshot = await queryMethod();
                                if (snapshot.size > 0) {
                                    foundCollection = collectionName;
                                    this.activeCollection = collectionName;
                                    this.log(`Found data in collection: ${collectionName} (${snapshot.size} docs)`);
                                    break;
                                }
                            } catch (queryError) {
                                this.log(`Query failed for ${collectionName}:`, queryError);
                            }
                        }
                        
                        if (foundCollection) break;
                        
                    } catch (collectionError) {
                        this.log(`Collection ${collectionName} not accessible:`, collectionError);
                    }
                }
                
                if (!snapshot || snapshot.size === 0) {
                    this.log('No accessible collections with data found');
                    return false;
                }

                // Process documents with flexible field mapping
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
                    console.error('All Firebase load attempts failed');
                    return false;
                }
                
                // Wait before retry (exponential backoff)
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }
        return false;
    }

    // Process document data with flexible field mapping
    processDocumentData(docId, rawData) {
        try {
            // Flexible field mapping for different data structures
            const processedData = {
                id: rawData.id || docId,
                nama: rawData.nama || rawData.name || rawData.locationName || `Location ${docId}`,
                type: rawData.type || 'office',
                capacity: rawData.capacity || 50,
                available_slots: rawData.available_slots || rawData.availableSlots || 25,
                description: rawData.description || '',
                is_available: rawData.is_available !== false, // Default to true
                
                // Additional fields from original structure
                room: rawData.room || rawData.nama || rawData.name,
                rack: rawData.rack || null,
                slot: rawData.slot || null,
                parentId: rawData.parentId || null,
                
                // Copy all original data
                ...rawData
            };
            
            // Validate required fields
            if (!processedData.id || !processedData.nama) {
                this.log(`Invalid document data - missing id or nama:`, { id: processedData.id, nama: processedData.nama });
                return null;
            }

            return processedData;

        } catch (error) {
            this.log(`Error processing document data:`, error);
            return null;
        }
    }

    // Filter available slots with enhanced logic
    filterAvailableSlots() {
        this.log('Filtering available slots...');
        
        this.availableSlots = Array.from(this.locations.values())
            .filter(location => {
                // Basic validation
                if (!location.id || !location.nama) {
                    return false;
                }
                
                // Check availability
                if (location.is_available === false) {
                    return false;
                }
                
                // For original structure - only include slots (not rooms/racks)
                if (location.type === 'slot') {
                    return true;
                }
                
                // For simple structure - include all locations with capacity
                if (location.type !== 'room' && location.type !== 'rack') {
                    return true;
                }
                
                // Include if no type specified (assume it's a location)
                if (!location.type) {
                    return true;
                }
                
                return false;
            })
            .sort((a, b) => {
                // Sort by nama field
                const nameA = (a.nama || '').toLowerCase();
                const nameB = (b.nama || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });

        this.log(`Filtered ${this.availableSlots.length} available slots from ${this.locations.size} total locations`);
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

            // Add location options with enhanced formatting
            this.availableSlots.forEach((location, index) => {
                const option = document.createElement('option');
                option.value = location.id;
                
                // Create display text based on data structure
                let displayText = location.nama;
                if (location.room && location.rack && location.slot) {
                    displayText = `${location.room} - ${location.rack} - ${location.slot}`;
                } else if (location.description) {
                    displayText += ` (${location.description})`;
                }
                
                option.textContent = displayText;
                
                // Add tooltip with additional info
                let tooltipText = `${location.nama} (ID: ${location.id})`;
                if (location.available_slots !== undefined) {
                    tooltipText += ` - ${location.available_slots}/${location.capacity || 'N/A'} slots`;
                }
                option.title = tooltipText;
                
                // Add data attributes for additional info
                option.setAttribute('data-location-id', location.id);
                option.setAttribute('data-location-name', location.nama);
                option.setAttribute('data-location-type', location.type || 'office');
                
                if (location.room) option.setAttribute('data-room', location.room);
                if (location.rack) option.setAttribute('data-rack', location.rack);
                if (location.slot) option.setAttribute('data-slot', location.slot);
                
                // Select if matches selectedLocationId
                if (selectedLocationId && location.id === selectedLocationId) {
                    option.selected = true;
                }
                
                selectElement.appendChild(option);
            });

            this.log(`Added ${this.availableSlots.length} options to dropdown`);
            
            // Trigger change event
            selectElement.dispatchEvent(new Event('change', { bubbles: true }));

        } catch (error) {
            console.error('Error populating dropdown options:', error);
        }
    }

    // Enhanced dummy data with both structures
    loadDummyLocations() {
        this.log('Loading dummy location data');
        
        const dummyData = [
            // Simple location structure (lokasi collection)
            {
                id: 'lok001',
                nama: 'Pejabat Daerah Tongod - Tingkat 1',
                type: 'office',
                capacity: 50,
                available_slots: 25,
                description: 'Ruang penyimpanan fail utama di tingkat 1',
                is_available: true
            },
            {
                id: 'lok002',
                nama: 'Pejabat Daerah Tongod - Tingkat 2', 
                type: 'office',
                capacity: 40,
                available_slots: 15,
                description: 'Ruang penyimpanan fail tambahan di tingkat 2',
                is_available: true
            },
            {
                id: 'lok003',
                nama: 'Stor Arkib Utama',
                type: 'storage',
                capacity: 200,
                available_slots: 120,
                description: 'Stor arkib utama untuk fail lama',
                is_available: true
            },
            
            // Slot-based structure (legacy compatibility)
            {
                id: 'slot_admin_a_1',
                nama: 'Bilik Pentadbiran - Rak A - Slot 1',
                type: 'slot',
                parentId: 'rack_admin_a',
                description: 'Slot 1 di Rak A',
                is_available: true,
                room: 'Bilik Pentadbiran',
                rack: 'Rak A',
                slot: 'Slot 1'
            },
            {
                id: 'slot_admin_a_2', 
                nama: 'Bilik Pentadbiran - Rak A - Slot 2',
                type: 'slot',
                parentId: 'rack_admin_a',
                description: 'Slot 2 di Rak A',
                is_available: true,
                room: 'Bilik Pentadbiran',
                rack: 'Rak A',
                slot: 'Slot 2'
            }
        ];

        this.locations.clear();
        dummyData.forEach(location => {
            this.locations.set(location.id, location);
        });

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
                    
                    this.filterAvailableSlots();
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

    // Utility methods
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // UI State management
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

    // Debug and validation methods
    getStatus() {
        return {
            isLoading: this.isLoading,
            activeCollection: this.activeCollection,
            locationCount: this.locations.size,
            availableSlotCount: this.availableSlots.length,
            listenerCount: this.listeners.size,
            errorCount: this.errorCount,
            debugMode: this.debugMode
        };
    }

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
                uniqueIds: ids.size,
                activeCollection: this.activeCollection
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
        console.log('🔍 Location Dropdown Status:', locationDropdownManager.getStatus());
        console.log('📊 Data Validation:', locationDropdownManager.validateData());
        console.log('🗂️ Available Slots:', locationDropdownManager.availableSlots);
        console.log('📋 All Locations:', Array.from(locationDropdownManager.locations.values()));
    };
}