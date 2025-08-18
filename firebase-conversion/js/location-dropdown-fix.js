// Location Dropdown Fix for Pengurusan Fail Form
// Memperbaiki isu dropdown lokasi yang tidak dimuatkan dalam form fail

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
        
        console.log('LocationDropdownManager initialized');
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

            // Try to load locations from Firebase
            const success = await this.loadLocationsFromFirebase();
            
            if (!success) {
                // Fallback to dummy data
                this.loadDummyLocations();
            }

            // Filter and populate dropdown
            this.filterAvailableSlots();
            this.populateDropdownOptions(selectElement, selectedLocationId);
            
            this.showSuccessState(selectElement);
            return true;

        } catch (error) {
            console.error('Error populating location dropdown:', error);
            this.showErrorState(selectElement);
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    // Load locations from Firebase with retry mechanism
    async loadLocationsFromFirebase() {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`Loading locations from Firebase (attempt ${attempt}/${this.maxRetries})`);
                
                // Simple query first
                const locationsRef = collection(db, 'locations');
                const snapshot = await getDocs(locationsRef);
                
                console.log(`Loaded ${snapshot.size} locations from Firebase`);
                
                if (snapshot.size === 0) {
                    console.warn('No locations found in Firebase');
                    return false;
                }

                // Process locations
                this.locations.clear();
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    this.locations.set(doc.id, {
                        id: doc.id,
                        ...data
                    });
                });

                console.log(`Successfully loaded ${this.locations.size} locations`);
                return true;

            } catch (error) {
                console.warn(`Firebase load attempt ${attempt} failed:`, error);
                
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

    // Load dummy locations as fallback
    loadDummyLocations() {
        console.log('Loading dummy locations as fallback');
        
        const dummyLocations = [
            // Bilik
            {
                id: 'room_admin',
                name: 'Bilik Pentadbiran',
                type: 'room',
                parentId: null,
                description: 'Bilik penyimpanan fail pentadbiran',
                is_available: true,
                room: 'Bilik Pentadbiran',
                rack: null,
                slot: null
            },
            {
                id: 'room_finance',
                name: 'Bilik Kewangan', 
                type: 'room',
                parentId: null,
                description: 'Bilik penyimpanan fail kewangan',
                is_available: true,
                room: 'Bilik Kewangan',
                rack: null,
                slot: null
            },
            
            // Rak
            {
                id: 'rack_admin_a',
                name: 'Rak A',
                type: 'rack',
                parentId: 'room_admin',
                description: 'Rak A di bilik pentadbiran',
                is_available: true,
                room: 'Bilik Pentadbiran',
                rack: 'Rak A',
                slot: null
            },
            {
                id: 'rack_admin_b',
                name: 'Rak B',
                type: 'rack', 
                parentId: 'room_admin',
                description: 'Rak B di bilik pentadbiran',
                is_available: true,
                room: 'Bilik Pentadbiran',
                rack: 'Rak B',
                slot: null
            },
            
            // Slot - Yang boleh dipilih untuk fail
            {
                id: 'slot_admin_a_1',
                name: 'Slot A-1',
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
                name: 'Slot A-2',
                type: 'slot',
                parentId: 'rack_admin_a',
                description: 'Slot 2 di Rak A',
                is_available: true,
                room: 'Bilik Pentadbiran',
                rack: 'Rak A',
                slot: 'Slot 2'
            },
            {
                id: 'slot_admin_a_3',
                name: 'Slot A-3',
                type: 'slot',
                parentId: 'rack_admin_a',
                description: 'Slot 3 di Rak A',
                is_available: true,
                room: 'Bilik Pentadbiran',
                rack: 'Rak A',
                slot: 'Slot 3'
            },
            {
                id: 'slot_admin_b_1',
                name: 'Slot B-1',
                type: 'slot',
                parentId: 'rack_admin_b',
                description: 'Slot 1 di Rak B',
                is_available: true,
                room: 'Bilik Pentadbiran',
                rack: 'Rak B',
                slot: 'Slot 1'
            },
            {
                id: 'slot_admin_b_2',
                name: 'Slot B-2',
                type: 'slot',
                parentId: 'rack_admin_b',
                description: 'Slot 2 di Rak B',
                is_available: true,
                room: 'Bilik Pentadbiran',
                rack: 'Rak B',
                slot: 'Slot 2'
            },
            
            // Legacy format locations (untuk backward compatibility)
            {
                id: 'loc001',
                name: 'Bilik Rekod Utama - A001/001',
                room: 'Bilik Rekod Utama',
                rack: 'A001',
                slot: '001',
                description: 'Fail pentadbiran tahun 2024',
                is_available: true
            },
            {
                id: 'loc002',
                name: 'Bilik Rekod Utama - A001/002',
                room: 'Bilik Rekod Utama',
                rack: 'A001', 
                slot: '002',
                description: 'Fail kewangan tahun 2024',
                is_available: true
            },
            {
                id: 'loc003',
                name: 'Bilik Rekod Utama - A002/001',
                room: 'Bilik Rekod Utama',
                rack: 'A002',
                slot: '001',
                description: 'Fail pembangunan tahun 2024',
                is_available: true
            }
        ];

        // Add to locations map
        this.locations.clear();
        dummyLocations.forEach(loc => {
            this.locations.set(loc.id, loc);
        });

        console.log(`Loaded ${this.locations.size} dummy locations`);
    }

    // Filter locations to get available slots only
    filterAvailableSlots() {
        this.availableSlots = Array.from(this.locations.values()).filter(location => {
            // Include slots (new format) or legacy locations with slot property
            const isSlot = location.type === 'slot' || (!location.type && location.slot);
            const isAvailable = location.is_available !== false;
            
            return isSlot && isAvailable;
        });

        // Sort slots for better UX
        this.availableSlots.sort((a, b) => {
            // Sort by room, then rack, then slot
            if (a.room !== b.room) {
                return a.room.localeCompare(b.room);
            }
            if (a.rack !== b.rack) {
                return a.rack.localeCompare(b.rack);
            }
            if (a.slot && b.slot) {
                return a.slot.localeCompare(b.slot);
            }
            return a.name.localeCompare(b.name);
        });

        console.log(`Filtered ${this.availableSlots.length} available slots`);
    }

    // Populate dropdown with location options
    populateDropdownOptions(selectElement, selectedLocationId = null) {
        // Clear existing options except the first placeholder
        while (selectElement.children.length > 1) {
            selectElement.removeChild(selectElement.lastChild);
        }

        // Add available slot options
        this.availableSlots.forEach(location => {
            const option = document.createElement('option');
            option.value = location.id;
            
            // Create descriptive label
            const locationLabel = this.createLocationLabel(location);
            option.textContent = locationLabel;
            
            // Set selected if this is the current location
            if (selectedLocationId === location.id) {
                option.selected = true;
            }
            
            selectElement.appendChild(option);
        });

        // Add message if no slots available
        if (this.availableSlots.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Tiada slot tersedia';
            option.disabled = true;
            selectElement.appendChild(option);
        }

        console.log(`Added ${this.availableSlots.length} options to dropdown`);
    }

    // Create descriptive label for location option
    createLocationLabel(location) {
        if (location.type === 'slot') {
            // New format: "Slot A-1 (Bilik Pentadbiran > Rak A)"
            const parentRack = this.getParentLocation(location.parentId);
            const parentRoom = parentRack ? this.getParentLocation(parentRack.parentId) : null;
            
            if (parentRoom && parentRack) {
                return `${location.name} (${parentRoom.name} > ${parentRack.name})`;
            } else {
                return location.name;
            }
        } else {
            // Legacy format: "Bilik Rekod Utama - A001/001"
            return `${location.room} - ${location.rack}/${location.slot}`;
        }
    }

    // Get parent location by ID
    getParentLocation(parentId) {
        return parentId ? this.locations.get(parentId) : null;
    }

    // Setup real-time listener for location changes
    setupRealtimeListener(selectElement, selectedLocationId = null) {
        if (!db) {
            console.warn('Database not available for real-time listener');
            return null;
        }

        try {
            const locationsRef = collection(db, 'locations');
            
            const unsubscribe = onSnapshot(locationsRef, (snapshot) => {
                console.log('Locations updated, refreshing dropdown...');
                
                // Update local locations
                this.locations.clear();
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    this.locations.set(doc.id, {
                        id: doc.id,
                        ...data
                    });
                });

                // Refresh dropdown
                this.filterAvailableSlots();
                this.populateDropdownOptions(selectElement, selectedLocationId);
            }, (error) => {
                console.error('Real-time listener error:', error);
            });

            console.log('Real-time listener setup successfully');
            return unsubscribe;

        } catch (error) {
            console.error('Error setting up real-time listener:', error);
            return null;
        }
    }

    // Show loading state in dropdown
    showLoadingState(selectElement) {
        selectElement.innerHTML = `
            <option value="">Memuatkan lokasi...</option>
        `;
        selectElement.disabled = true;
    }

    // Show success state in dropdown
    showSuccessState(selectElement) {
        selectElement.disabled = false;
        
        // Update placeholder if no options
        if (selectElement.children.length === 1) {
            selectElement.children[0].textContent = 'Pilih Lokasi';
        }
    }

    // Show error state in dropdown
    showErrorState(selectElement) {
        selectElement.innerHTML = `
            <option value="">Ralat memuatkan lokasi</option>
            <option value="" disabled>Sila cuba lagi</option>
        `;
        selectElement.disabled = false;
    }

    // Utility: Delay function for retries
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get location info by ID
    getLocationById(locationId) {
        return this.locations.get(locationId);
    }

    // Get location display name
    getLocationDisplayName(locationId) {
        const location = this.getLocationById(locationId);
        if (!location) return 'Lokasi tidak dijumpai';
        
        return this.createLocationLabel(location);
    }

    // Check if location is available
    isLocationAvailable(locationId) {
        const location = this.getLocationById(locationId);
        return location ? location.is_available !== false : false;
    }

    // Get all available locations
    getAllAvailableLocations() {
        return this.availableSlots;
    }

    // Get location statistics
    getLocationStats() {
        const total = this.locations.size;
        const available = this.availableSlots.length;
        const occupied = Array.from(this.locations.values())
            .filter(loc => loc.is_available === false).length;

        return {
            total,
            available,
            occupied,
            rooms: Array.from(this.locations.values())
                .filter(loc => loc.type === 'room' || (!loc.type && !loc.slot)).length,
            racks: Array.from(this.locations.values())
                .filter(loc => loc.type === 'rack').length,
            slots: Array.from(this.locations.values())
                .filter(loc => loc.type === 'slot' || (!loc.type && loc.slot)).length
        };
    }
}

// Create singleton instance
const locationDropdownManager = new LocationDropdownManager();

// Export for use in file management
export default locationDropdownManager;

// Export specific functions for direct use
export {
    locationDropdownManager,
    LocationDropdownManager
};