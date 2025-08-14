// Location Management Module for Firebase
import { 
    db, 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    serverTimestamp 
} from './firebase-config.js';
import { showAlert, showConfirm, showLoading, hideLoading } from './utils.js';

class LocationManager {
    constructor() {
        this.locations = [];
        this.filteredLocations = [];
        this.selectedLocations = new Set();
        this.currentView = 'tree';
        this.editingLocationId = null;
        this.isInitialized = false;
        
        console.log('LocationManager constructor called');
        
        // Initialize with a delay to ensure DOM is ready
        setTimeout(() => {
            this.initialize();
        }, 100);
    }

    async initialize() {
        try {
            console.log('Initializing LocationManager...');
            
            this.initializeEventListeners();
            await this.loadLocations();
            
            this.isInitialized = true;
            console.log('LocationManager initialized successfully');
            
        } catch (error) {
            console.error('Error initializing LocationManager:', error);
            showAlert('Ralat memulakan pengurusan lokasi: ' + error.message, 'danger');
        }
    }

    initializeEventListeners() {
        // View toggle buttons
        document.getElementById('treeViewBtn')?.addEventListener('click', () => this.switchView('tree'));
        document.getElementById('listViewBtn')?.addEventListener('click', () => this.switchView('list'));
        
        // Search functionality
        document.getElementById('searchInput')?.addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('searchBtn')?.addEventListener('click', () => this.handleSearch());
        
        // Add location buttons
        document.getElementById('addLocationBtn')?.addEventListener('click', () => this.showLocationModal());
        document.getElementById('addFirstLocationBtn')?.addEventListener('click', () => this.showLocationModal());
        
        // Tree controls
        document.getElementById('expandAllBtn')?.addEventListener('click', () => this.expandAllNodes());
        document.getElementById('collapseAllBtn')?.addEventListener('click', () => this.collapseAllNodes());
        document.getElementById('refreshTreeBtn')?.addEventListener('click', () => this.refreshTree());
        
        // Modal form
        document.getElementById('locationForm')?.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Filter controls
        document.getElementById('applyFilters')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFilters')?.addEventListener('click', () => this.clearFilters());
        
        // Bulk actions
        document.getElementById('bulkStatusBtn')?.addEventListener('click', () => this.bulkChangeStatus());
        document.getElementById('bulkPrintBtn')?.addEventListener('click', () => this.bulkPrintLabels());
        document.getElementById('bulkExportBtn')?.addEventListener('click', () => this.bulkExport());
        document.getElementById('bulkDeleteBtn')?.addEventListener('click', () => this.bulkDelete());
    }

    async loadLocations() {
        try {
            console.log('Loading locations from Firestore...');
            showLoading('Memuatkan data lokasi...');
            
            // Check if db is available
            if (!db) {
                throw new Error('Database connection not available');
            }
            
            // Set up real-time listener for locations
            const locationsRef = collection(db, 'locations');
            
            // First try to get locations without complex query
            try {
                const q = query(locationsRef, orderBy('sortOrder', 'asc'), orderBy('name', 'asc'));
                
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    console.log(`Received ${snapshot.size} locations from Firestore`);
                    
                    this.locations = [];
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        this.locations.push({ id: doc.id, ...data });
                    });
                    
                    this.filteredLocations = [...this.locations];
                    this.updateStatistics();
                    this.renderCurrentView();
                    this.populateFilters();
                    hideLoading();
                    
                }, (error) => {
                    console.error('Firestore listener error:', error);
                    
                    // If complex query fails, try simpler query
                    this.loadLocationsSimple();
                });
                
                // Store unsubscribe function
                this.unsubscribeLocations = unsubscribe;
                
            } catch (queryError) {
                console.warn('Complex query failed, trying simple query:', queryError);
                await this.loadLocationsSimple();
            }
            
        } catch (error) {
            console.error('Error loading locations:', error);
            showAlert(`Ralat memuatkan data lokasi: ${error.message}`, 'danger');
            hideLoading();
            
            // Show empty state
            this.showEmptyState();
        }
    }

    async loadLocationsSimple() {
        try {
            console.log('Loading locations with simple query...');
            
            const locationsRef = collection(db, 'locations');
            const snapshot = await getDocs(locationsRef);
            
            console.log(`Loaded ${snapshot.size} locations with simple query`);
            
            this.locations = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                this.locations.push({ id: doc.id, ...data });
            });
            
            // Sort locally
            this.locations.sort((a, b) => {
                const sortOrderA = a.sortOrder || 0;
                const sortOrderB = b.sortOrder || 0;
                if (sortOrderA !== sortOrderB) {
                    return sortOrderA - sortOrderB;
                }
                return (a.name || '').localeCompare(b.name || '');
            });
            
            this.filteredLocations = [...this.locations];
            this.updateStatistics();
            this.renderCurrentView();
            this.populateFilters();
            hideLoading();
            
        } catch (error) {
            console.error('Simple query also failed:', error);
            throw error;
        }
    }

    showEmptyState() {
        const container = this.currentView === 'tree' ? 
            document.getElementById('locationTree') : 
            document.getElementById('locationCards');
            
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-database fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Tiada data lokasi</h5>
                    <p class="text-muted">Sila setup data sample atau tambah lokasi baru</p>
                    <a href="/setup-locations.html" class="btn btn-primary">
                        <i class="fas fa-plus me-1"></i>Setup Data Sample
                    </a>
                </div>
            `;
        }
    }

    updateStatistics() {
        const stats = {
            total: this.locations.length,
            files: this.locations.reduce((sum, loc) => sum + (loc.filesCount || 0), 0),
            empty: this.locations.filter(loc => loc.status === 'empty').length,
            occupied: this.locations.filter(loc => loc.status === 'occupied').length
        };

        document.getElementById('totalLocations').textContent = stats.total;
        document.getElementById('totalFiles').textContent = stats.files;
        document.getElementById('totalEmpty').textContent = stats.empty;
        document.getElementById('totalOccupied').textContent = stats.occupied;
    }

    switchView(view) {
        this.currentView = view;
        
        // Update button states
        const treeBtn = document.getElementById('treeViewBtn');
        const listBtn = document.getElementById('listViewBtn');
        
        if (view === 'tree') {
            treeBtn?.classList.add('btn-primary');
            treeBtn?.classList.remove('btn-outline-primary');
            listBtn?.classList.add('btn-outline-primary');
            listBtn?.classList.remove('btn-primary');
            
            document.getElementById('treeViewContainer')?.classList.remove('d-none');
            document.getElementById('listViewContainer')?.classList.add('d-none');
        } else {
            listBtn?.classList.add('btn-primary');
            listBtn?.classList.remove('btn-outline-primary');
            treeBtn?.classList.add('btn-outline-primary');
            treeBtn?.classList.remove('btn-primary');
            
            document.getElementById('listViewContainer')?.classList.remove('d-none');
            document.getElementById('treeViewContainer')?.classList.add('d-none');
        }
        
        this.renderCurrentView();
    }

    renderCurrentView() {
        if (this.currentView === 'tree') {
            this.renderTreeView();
        } else {
            this.renderListView();
        }
    }

    renderTreeView() {
        const container = document.getElementById('locationTree');
        if (!container) return;

        const treeData = this.buildTreeStructure(this.filteredLocations);
        container.innerHTML = this.renderTreeNodes(treeData);
        
        this.attachTreeEventListeners();
    }

    buildTreeStructure(locations) {
        const tree = [];
        const itemMap = new Map();
        
        // Create map of all locations
        locations.forEach(location => {
            itemMap.set(location.id, { ...location, children: [] });
        });
        
        // Build tree structure
        locations.forEach(location => {
            const item = itemMap.get(location.id);
            if (location.parentId && itemMap.has(location.parentId)) {
                itemMap.get(location.parentId).children.push(item);
            } else {
                tree.push(item);
            }
        });
        
        return tree;
    }

    renderTreeNodes(nodes, level = 0) {
        return nodes.map(node => {
            const hasChildren = node.children && node.children.length > 0;
            const statusClass = this.getStatusClass(node.status);
            const typeIcon = this.getTypeIcon(node.type);
            
            return `
                <div class="tree-node" data-id="${node.id}" data-level="${level}">
                    <div class="d-flex align-items-center">
                        ${hasChildren ? 
                            `<i class="fas fa-chevron-right tree-toggle me-2" style="cursor: pointer;"></i>` : 
                            `<span class="me-3"></span>`
                        }
                        <i class="${typeIcon} me-2"></i>
                        <span class="location-name">${node.name}</span>
                        <span class="status-indicator ${node.status || 'empty'}"></span>
                        ${node.filesCount ? `<span class="badge bg-primary ms-2">${node.filesCount}</span>` : ''}
                    </div>
                    <div class="tree-actions">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="locationManager.viewLocation('${node.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary me-1" onclick="locationManager.generateQR('${node.id}')">
                            <i class="fas fa-qrcode"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="locationManager.editLocation('${node.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="locationManager.deleteLocation('${node.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${hasChildren ? 
                    `<div class="tree-children d-none" id="children-${node.id}">
                        ${this.renderTreeNodes(node.children, level + 1)}
                    </div>` : ''
                }
            `;
        }).join('');
    }

    renderListView() {
        const container = document.getElementById('locationCards');
        const emptyState = document.getElementById('emptyState');
        
        if (!container) return;

        if (this.filteredLocations.length === 0) {
            container.innerHTML = '';
            emptyState?.classList.remove('d-none');
            return;
        }

        emptyState?.classList.add('d-none');
        
        container.innerHTML = this.filteredLocations.map(location => {
            const statusClass = this.getStatusClass(location.status);
            const typeIcon = this.getTypeIcon(location.type);
            
            return `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card location-card h-100" data-id="${location.id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="flex-grow-1">
                                    <h6 class="card-title mb-1">
                                        <i class="${typeIcon} me-2"></i>
                                        ${location.name}
                                    </h6>
                                    <small class="text-muted">${location.type || 'Unknown'}</small>
                                </div>
                                <div class="files-count">${location.filesCount || 0}</div>
                            </div>
                            
                            ${location.description ? 
                                `<p class="card-text small text-muted mb-2">${location.description}</p>` : ''
                            }
                            
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="badge bg-${statusClass}">
                                        <i class="${this.getStatusIcon(location.status)} me-1"></i>
                                        ${this.getStatusLabel(location.status)}
                                    </span>
                                </div>
                                <div class="btn-group btn-group-sm" role="group">
                                    <button type="button" class="btn btn-outline-primary" onclick="locationManager.viewLocation('${location.id}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="locationManager.generateQR('${location.id}')">
                                        <i class="fas fa-qrcode"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-warning" onclick="locationManager.editLocation('${location.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-danger" onclick="locationManager.deleteLocation('${location.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <input type="checkbox" class="form-check-input position-absolute top-0 start-0 m-2 location-checkbox" 
                                   value="${location.id}" style="z-index: 10;">
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.attachCardEventListeners();
    }

    attachTreeEventListeners() {
        // Toggle tree nodes
        document.querySelectorAll('.tree-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const node = e.target.closest('.tree-node');
                const nodeId = node.dataset.id;
                const children = document.getElementById(`children-${nodeId}`);
                
                if (children) {
                    children.classList.toggle('d-none');
                    toggle.classList.toggle('fa-chevron-right');
                    toggle.classList.toggle('fa-chevron-down');
                }
            });
        });
    }

    attachCardEventListeners() {
        // Location card selection
        document.querySelectorAll('.location-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const locationId = e.target.value;
                const card = e.target.closest('.location-card');
                
                if (e.target.checked) {
                    this.selectedLocations.add(locationId);
                    card.classList.add('selected');
                } else {
                    this.selectedLocations.delete(locationId);
                    card.classList.remove('selected');
                }
                
                this.updateBulkActionsPanel();
            });
        });
    }

    updateBulkActionsPanel() {
        const panel = document.getElementById('bulkActionsPanel');
        const count = document.getElementById('selectedCount');
        
        if (count) count.textContent = this.selectedLocations.size;
        
        if (this.selectedLocations.size > 0) {
            panel?.classList.remove('d-none');
        } else {
            panel?.classList.add('d-none');
        }
    }

    async showLocationModal(locationId = null) {
        this.editingLocationId = locationId;
        const modal = new bootstrap.Modal(document.getElementById('locationModal'));
        const title = document.getElementById('locationModalTitle');
        
        if (locationId) {
            title.textContent = 'Edit Lokasi';
            await this.loadLocationData(locationId);
        } else {
            title.textContent = 'Tambah Lokasi Baru';
            this.clearLocationForm();
        }
        
        await this.populateParentOptions();
        modal.show();
    }

    async loadLocationData(locationId) {
        const location = this.locations.find(loc => loc.id === locationId);
        if (location) {
            document.getElementById('locationType').value = location.type || '';
            document.getElementById('parentLocation').value = location.parentId || '';
            document.getElementById('locationName').value = location.name || '';
            document.getElementById('locationDescription').value = location.description || '';
            document.getElementById('locationStatus').value = location.status || 'empty';
            document.getElementById('locationOrder').value = location.sortOrder || 0;
            document.getElementById('locationAvailable').checked = location.isAvailable !== false;
        }
    }

    clearLocationForm() {
        document.getElementById('locationForm').reset();
        document.getElementById('locationAvailable').checked = true;
    }

    async populateParentOptions() {
        const select = document.getElementById('parentLocation');
        if (!select) return;
        
        // Clear existing options except the first one
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Add parent options (rooms and racks only)
        this.locations
            .filter(loc => loc.type === 'room' || loc.type === 'rack')
            .forEach(location => {
                const option = document.createElement('option');
                option.value = location.id;
                option.textContent = `${location.name} (${location.type})`;
                select.appendChild(option);
            });
    }

    populateFilters() {
        const roomFilter = document.getElementById('roomFilter');
        if (roomFilter) {
            // Clear existing options except the first one
            while (roomFilter.children.length > 1) {
                roomFilter.removeChild(roomFilter.lastChild);
            }
            
            // Get unique rooms
            const rooms = [...new Set(this.locations
                .filter(loc => loc.type === 'room')
                .map(loc => loc.name)
            )];
            
            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room;
                option.textContent = room;
                roomFilter.appendChild(option);
            });
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            showLoading();
            
            const formData = {
                type: document.getElementById('locationType').value,
                parentId: document.getElementById('parentLocation').value || null,
                name: document.getElementById('locationName').value,
                description: document.getElementById('locationDescription').value,
                status: document.getElementById('locationStatus').value,
                sortOrder: parseInt(document.getElementById('locationOrder').value) || 0,
                isAvailable: document.getElementById('locationAvailable').checked,
                updatedAt: serverTimestamp()
            };
            
            if (this.editingLocationId) {
                // Update existing location
                const docRef = doc(db, 'locations', this.editingLocationId);
                await updateDoc(docRef, formData);
                showAlert('Lokasi berjaya dikemaskini', 'success');
            } else {
                // Add new location
                formData.createdAt = serverTimestamp();
                formData.filesCount = 0;
                formData.qrCode = this.generateQRCode();
                
                await addDoc(collection(db, 'locations'), formData);
                showAlert('Lokasi berjaya ditambah', 'success');
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('locationModal'));
            modal.hide();
            
        } catch (error) {
            console.error('Error saving location:', error);
            showAlert('Ralat menyimpan lokasi', 'danger');
        } finally {
            hideLoading();
        }
    }

    async deleteLocation(locationId) {
        if (await showConfirm('Adakah anda pasti untuk memadam lokasi ini?')) {
            try {
                showLoading();
                
                // Check if location has files or children
                const location = this.locations.find(loc => loc.id === locationId);
                const hasChildren = this.locations.some(loc => loc.parentId === locationId);
                
                if (location?.filesCount > 0) {
                    showAlert('Lokasi tidak boleh dipadam kerana masih mengandungi fail', 'warning');
                    return;
                }
                
                if (hasChildren) {
                    showAlert('Lokasi tidak boleh dipadam kerana masih mengandungi sub-lokasi', 'warning');
                    return;
                }
                
                await deleteDoc(doc(db, 'locations', locationId));
                showAlert('Lokasi berjaya dipadam', 'success');
                
            } catch (error) {
                console.error('Error deleting location:', error);
                showAlert('Ralat memadam lokasi', 'danger');
            } finally {
                hideLoading();
            }
        }
    }

    generateQR(locationId) {
        const location = this.locations.find(loc => loc.id === locationId);
        if (location) {
            const qrText = location.qrCode || `LOC_${locationId}`;
            this.showQRModal(qrText, location.name);
        }
    }

    showQRModal(qrCode, locationName) {
        const modal = new bootstrap.Modal(document.getElementById('qrModal'));
        const container = document.getElementById('qrCodeContainer');
        const text = document.getElementById('qrCodeText');
        
        // Generate QR code using a library or service
        container.innerHTML = `
            <div class="qr-code-placeholder bg-light p-4 rounded">
                <i class="fas fa-qrcode fa-4x text-muted mb-3"></i>
                <p>QR Code: ${qrCode}</p>
                <small class="text-muted">QR code akan dijana di sini</small>
            </div>
        `;
        
        text.textContent = `Lokasi: ${locationName}`;
        modal.show();
    }

    handleSearch(searchTerm) {
        if (!searchTerm) {
            searchTerm = document.getElementById('searchInput')?.value || '';
        }
        
        if (searchTerm.trim() === '') {
            this.filteredLocations = [...this.locations];
        } else {
            this.filteredLocations = this.locations.filter(location => 
                location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (location.description && location.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        this.renderCurrentView();
    }

    applyFilters() {
        const typeFilter = document.getElementById('typeFilter')?.value;
        const statusFilter = document.getElementById('statusFilter')?.value;
        const roomFilter = document.getElementById('roomFilter')?.value;
        
        this.filteredLocations = this.locations.filter(location => {
            let matches = true;
            
            if (typeFilter && location.type !== typeFilter) matches = false;
            if (statusFilter && location.status !== statusFilter) matches = false;
            if (roomFilter && location.type === 'room' && location.name !== roomFilter) matches = false;
            
            return matches;
        });
        
        this.renderCurrentView();
    }

    clearFilters() {
        document.getElementById('typeFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('roomFilter').value = '';
        document.getElementById('searchInput').value = '';
        
        this.filteredLocations = [...this.locations];
        this.renderCurrentView();
    }

    // Bulk operations
    async bulkDelete() {
        if (this.selectedLocations.size === 0) {
            showAlert('Sila pilih sekurang-kurangnya satu lokasi', 'warning');
            return;
        }
        
        if (await showConfirm(`Adakah anda pasti untuk memadam ${this.selectedLocations.size} lokasi?`)) {
            try {
                showLoading();
                
                const promises = Array.from(this.selectedLocations).map(id => 
                    deleteDoc(doc(db, 'locations', id))
                );
                
                await Promise.all(promises);
                showAlert(`${this.selectedLocations.size} lokasi berjaya dipadam`, 'success');
                this.selectedLocations.clear();
                this.updateBulkActionsPanel();
                
            } catch (error) {
                console.error('Error bulk deleting locations:', error);
                showAlert('Ralat memadam lokasi', 'danger');
            } finally {
                hideLoading();
            }
        }
    }

    // Helper methods
    getTypeIcon(type) {
        switch (type) {
            case 'room': return 'fas fa-door-open';
            case 'rack': return 'fas fa-layer-group';
            case 'slot': return 'fas fa-square';
            default: return 'fas fa-map-marker-alt';
        }
    }

    getStatusClass(status) {
        switch (status) {
            case 'occupied': return 'danger';
            case 'maintenance': return 'warning';
            case 'empty':
            default: return 'success';
        }
    }

    getStatusIcon(status) {
        switch (status) {
            case 'occupied': return 'fas fa-box';
            case 'maintenance': return 'fas fa-tools';
            case 'empty':
            default: return 'fas fa-box-open';
        }
    }

    getStatusLabel(status) {
        switch (status) {
            case 'occupied': return 'Ada Fail';
            case 'maintenance': return 'Penyelenggaraan';
            case 'empty':
            default: return 'Kosong';
        }
    }

    generateQRCode() {
        return 'LOC_' + Date.now().toString(36).toUpperCase();
    }

    expandAllNodes() {
        document.querySelectorAll('.tree-children').forEach(children => {
            children.classList.remove('d-none');
        });
        document.querySelectorAll('.tree-toggle').forEach(toggle => {
            toggle.classList.remove('fa-chevron-right');
            toggle.classList.add('fa-chevron-down');
        });
    }

    collapseAllNodes() {
        document.querySelectorAll('.tree-children').forEach(children => {
            children.classList.add('d-none');
        });
        document.querySelectorAll('.tree-toggle').forEach(toggle => {
            toggle.classList.add('fa-chevron-right');
            toggle.classList.remove('fa-chevron-down');
        });
    }

    refreshTree() {
        this.loadLocations();
    }

    // Placeholder methods for other features
    viewLocation(locationId) {
        showAlert('View location feature coming soon', 'info');
    }

    editLocation(locationId) {
        this.showLocationModal(locationId);
    }

    async bulkChangeStatus() {
        showAlert('Bulk status change feature coming soon', 'info');
    }

    async bulkPrintLabels() {
        showAlert('Print labels feature coming soon', 'info');
    }

    async bulkExport() {
        showAlert('Bulk export feature coming soon', 'info');
    }
}

// Export for dynamic import
export default LocationManager;