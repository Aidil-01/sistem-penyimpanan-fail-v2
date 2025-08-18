// Enhanced App.js with Fixed Location Dropdown
// Update untuk memperbaiki isu dropdown lokasi dalam form Pengurusan Fail

import authManager from './auth.js';
import { models } from './models.js';
import locationDropdownManager from './location-dropdown-fix.js';

class AppWithLocationFix {
    constructor() {
        this.currentPage = 'dashboard';
        this.locationUnsubscribe = null; // Real-time listener unsubscriber
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupSidebar();
        this.setupOfflineIndicator();
        this.loadPage('dashboard');
    }

    // Navigation and sidebar methods remain the same...
    setupNavigation() {
        document.querySelectorAll('#navigationMenu .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.loadPage(page);
                
                // Update active state
                document.querySelectorAll('#navigationMenu .nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Close sidebar on mobile after navigation
                this.closeSidebar();
            });
        });
    }

    setupSidebar() {
        const sidebar = document.getElementById('sidebarMenu');
        const overlay = document.getElementById('sidebarOverlay');
        const closeBtn = document.getElementById('sidebarCloseBtn');
        const hamburgerBtn = document.querySelector('.navbar-toggler');

        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openSidebar();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeSidebar();
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebarMenu');
        const overlay = document.getElementById('sidebarOverlay');

        if (sidebar) {
            sidebar.classList.add('show');
            if (overlay) {
                overlay.classList.remove('d-none');
                overlay.classList.add('show');
            }
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebarMenu');
        const overlay = document.getElementById('sidebarOverlay');

        if (sidebar) {
            sidebar.classList.remove('show');
            if (overlay) {
                overlay.classList.remove('show');
                setTimeout(() => {
                    overlay.classList.add('d-none');
                }, 300);
            }
        }
    }

    setupOfflineIndicator() {
        const updateOnlineStatus = () => {
            const indicator = document.getElementById('offlineIndicator');
            if (navigator.onLine) {
                indicator.classList.add('d-none');
            } else {
                indicator.classList.remove('d-none');
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
    }

    // Enhanced file modal with improved location dropdown
    async showFileModal(fileId = null) {
        const isEdit = fileId !== null;
        let fileData = null;
        
        if (isEdit) {
            try {
                fileData = await models.file.getById(fileId);
                if (!fileData) {
                    this.showAlert('Fail tidak dijumpai', 'danger');
                    return;
                }
            } catch (error) {
                console.error('Error loading file data:', error);
                this.showAlert('Ralat memuatkan data fail', 'danger');
                return;
            }
        }

        const modalHtml = `
            <div class="modal fade" id="fileModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${isEdit ? 'Edit Fail' : 'Tambah Fail Baharu'}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="fileForm">
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Tajuk Fail <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" name="title" 
                                               value="${fileData?.title || ''}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Nombor Rujukan</label>
                                        <input type="text" class="form-control" name="reference_number" 
                                               value="${fileData?.reference_number || ''}">
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Jabatan <span class="text-danger">*</span></label>
                                        <select class="form-select" name="department" required>
                                            <option value="">Pilih Jabatan</option>
                                            <option value="Pentadbiran" ${fileData?.department === 'Pentadbiran' ? 'selected' : ''}>Pentadbiran</option>
                                            <option value="Kewangan" ${fileData?.department === 'Kewangan' ? 'selected' : ''}>Kewangan</option>
                                            <option value="Pembangunan" ${fileData?.department === 'Pembangunan' ? 'selected' : ''}>Pembangunan</option>
                                            <option value="Kesihatan" ${fileData?.department === 'Kesihatan' ? 'selected' : ''}>Kesihatan</option>
                                            <option value="ICT" ${fileData?.department === 'ICT' ? 'selected' : ''}>ICT</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Jenis Dokumen</label>
                                        <select class="form-select" name="document_type">
                                            <option value="">Pilih Jenis</option>
                                            <option value="surat_rasmi" ${fileData?.document_type === 'surat_rasmi' ? 'selected' : ''}>Surat Rasmi</option>
                                            <option value="laporan" ${fileData?.document_type === 'laporan' ? 'selected' : ''}>Laporan</option>
                                            <option value="minit_mesyuarat" ${fileData?.document_type === 'minit_mesyuarat' ? 'selected' : ''}>Minit Mesyuarat</option>
                                            <option value="perjanjian" ${fileData?.document_type === 'perjanjian' ? 'selected' : ''}>Perjanjian</option>
                                            <option value="permit" ${fileData?.document_type === 'permit' ? 'selected' : ''}>Permit</option>
                                            <option value="lain_lain" ${fileData?.document_type === 'lain_lain' ? 'selected' : ''}>Lain-lain</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Tahun Dokumen</label>
                                        <input type="number" class="form-control" name="document_year" 
                                               value="${fileData?.document_year || new Date().getFullYear()}" 
                                               min="2000" max="${new Date().getFullYear()}">
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Lokasi Penyimpanan <span class="text-danger">*</span></label>
                                    <select class="form-select" name="location_id" id="locationDropdown" required>
                                        <option value="">Pilih Lokasi</option>
                                    </select>
                                    <div class="form-text">
                                        <i class="fas fa-info-circle me-1"></i>
                                        Pilih slot yang tersedia untuk menyimpan fail ini
                                    </div>
                                    <div id="locationStatus" class="mt-2"></div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Keterangan</label>
                                    <textarea class="form-control" name="description" rows="3">${fileData?.description || ''}</textarea>
                                </div>

                                ${isEdit ? `
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Status</label>
                                        <select class="form-select" name="status">
                                            <option value="tersedia" ${fileData?.status === 'tersedia' ? 'selected' : ''}>Tersedia</option>
                                            <option value="dipinjam" ${fileData?.status === 'dipinjam' ? 'selected' : ''}>Dipinjam</option>
                                            <option value="arkib" ${fileData?.status === 'arkib' ? 'selected' : ''}>Arkib</option>
                                        </select>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                                <button type="submit" class="btn btn-primary" id="saveFileBtn">
                                    <i class="fas fa-save me-1"></i>${isEdit ? 'Kemaskini' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        document.querySelector('#fileModal')?.remove();
        
        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Initialize and show modal
        const modal = new bootstrap.Modal(document.getElementById('fileModal'));
        modal.show();

        // Setup location dropdown after modal is shown
        modal._element.addEventListener('shown.bs.modal', async () => {
            await this.setupLocationDropdown(fileData?.location_id);
        });

        // Handle form submission
        document.getElementById('fileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFileFormSubmit(e.target, isEdit, fileId);
            modal.hide();
        });

        // Cleanup when modal is hidden
        modal._element.addEventListener('hidden.bs.modal', () => {
            this.cleanupLocationDropdown();
        });
    }

    // Setup enhanced location dropdown
    async setupLocationDropdown(selectedLocationId = null) {
        const dropdown = document.getElementById('locationDropdown');
        const statusDiv = document.getElementById('locationStatus');
        
        if (!dropdown) {
            console.error('Location dropdown element not found');
            return;
        }

        try {
            // Show loading status
            this.showLocationStatus('Memuatkan lokasi...', 'info');
            
            // Populate dropdown using location manager
            const success = await locationDropdownManager.populateLocationDropdown(dropdown, selectedLocationId);
            
            if (success) {
                // Setup real-time listener for dropdown updates
                this.locationUnsubscribe = locationDropdownManager.setupRealtimeListener(dropdown, selectedLocationId);
                
                // Show success status with stats
                const stats = locationDropdownManager.getLocationStats();
                this.showLocationStatus(
                    `${stats.available} slot tersedia dari ${stats.total} lokasi`,
                    'success'
                );
                
                // Add change handler for location validation
                dropdown.addEventListener('change', (e) => {
                    this.validateLocationSelection(e.target.value);
                });
                
            } else {
                this.showLocationStatus('Ralat memuatkan lokasi. Menggunakan data fallback.', 'warning');
            }

        } catch (error) {
            console.error('Error setting up location dropdown:', error);
            this.showLocationStatus('Ralat memuatkan lokasi', 'danger');
        }
    }

    // Show location status message
    showLocationStatus(message, type = 'info') {
        const statusDiv = document.getElementById('locationStatus');
        if (!statusDiv) return;

        const iconMap = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            danger: 'fa-exclamation-circle'
        };

        statusDiv.innerHTML = `
            <small class="text-${type}">
                <i class="fas ${iconMap[type]} me-1"></i>
                ${message}
            </small>
        `;
    }

    // Validate location selection
    validateLocationSelection(locationId) {
        if (!locationId) return;

        const isAvailable = locationDropdownManager.isLocationAvailable(locationId);
        const locationName = locationDropdownManager.getLocationDisplayName(locationId);
        
        if (isAvailable) {
            this.showLocationStatus(`Lokasi terpilih: ${locationName}`, 'success');
        } else {
            this.showLocationStatus(`Amaran: Lokasi ${locationName} mungkin tidak tersedia`, 'warning');
        }
    }

    // Cleanup location dropdown resources
    cleanupLocationDropdown() {
        if (this.locationUnsubscribe) {
            this.locationUnsubscribe();
            this.locationUnsubscribe = null;
            console.log('Location real-time listener cleaned up');
        }
    }

    // Enhanced file form submission
    async handleFileFormSubmit(form, isEdit, fileId) {
        const saveBtn = document.getElementById('saveFileBtn');
        const originalBtnText = saveBtn.innerHTML;
        
        try {
            // Show loading state
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Menyimpan...';
            saveBtn.disabled = true;

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Validate location
            if (data.location_id) {
                const isAvailable = locationDropdownManager.isLocationAvailable(data.location_id);
                if (!isAvailable) {
                    throw new Error('Lokasi yang dipilih tidak tersedia');
                }
            }

            if (isEdit) {
                await models.file.update(fileId, {
                    ...data,
                    updated_at: new Date()
                });
                this.showAlert('Fail berjaya dikemaskini', 'success');
            } else {
                await models.file.createFile({
                    ...data,
                    created_at: new Date(),
                    updated_at: new Date()
                });
                this.showAlert('Fail berjaya ditambah', 'success');
            }
            
            // Reload files list
            if (this.currentPage === 'files') {
                await this.loadFilesList();
            }
            
        } catch (error) {
            console.error('Error saving file:', error);
            this.showAlert('Ralat menyimpan fail: ' + error.message, 'danger');
        } finally {
            // Restore button state
            saveBtn.innerHTML = originalBtnText;
            saveBtn.disabled = false;
        }
    }

    // Rest of the App methods remain the same...
    async loadPage(pageName) {
        this.currentPage = pageName;
        const contentContainer = document.getElementById('pageContent');
        
        try {
            switch (pageName) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'files':
                    await this.loadFilesPage();
                    break;
                case 'locations':
                    await this.loadLocationsPage();
                    break;
                case 'borrowings':
                    await this.loadBorrowingsPage();
                    break;
                case 'reports':
                    await this.loadReportsPage();
                    break;
                case 'users':
                    await this.loadUsersPage();
                    break;
                default:
                    contentContainer.innerHTML = '<h3>Halaman tidak dijumpai</h3>';
            }
        } catch (error) {
            console.error('Error loading page:', error);
            contentContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Ralat memuatkan halaman: ${error.message}
                </div>
            `;
        }
    }

    async loadFilesPage() {
        const contentContainer = document.getElementById('pageContent');
        
        contentContainer.innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2"><i class="fas fa-folder me-2"></i>Pengurusan Fail</h1>
                ${authManager.canManageFiles() ? `
                <button class="btn btn-primary" onclick="app.showCreateFileModal()">
                    <i class="fas fa-plus me-2"></i>Tambah Fail
                </button>
                ` : ''}
            </div>

            <!-- Search and Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <input type="text" class="form-control" id="fileSearch" placeholder="Cari fail...">
                        </div>
                        <div class="col-md-2 mb-3">
                            <select class="form-select" id="departmentFilter">
                                <option value="">Semua Jabatan</option>
                            </select>
                        </div>
                        <div class="col-md-2 mb-3">
                            <select class="form-select" id="statusFilter">
                                <option value="">Semua Status</option>
                                <option value="tersedia">Tersedia</option>
                                <option value="dipinjam">Dipinjam</option>
                                <option value="arkib">Arkib</option>
                            </select>
                        </div>
                        <div class="col-md-2 mb-3">
                            <select class="form-select" id="yearFilter">
                                <option value="">Semua Tahun</option>
                            </select>
                        </div>
                        <div class="col-md-2 mb-3">
                            <button class="btn btn-secondary w-100" onclick="app.filterFiles()">
                                <i class="fas fa-filter me-2"></i>Tapis
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Files Table -->
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>ID Fail</th>
                                    <th>Tajuk</th>
                                    <th>Jabatan</th>
                                    <th>Jenis</th>
                                    <th>Status</th>
                                    <th>Lokasi</th>
                                    <th>Tindakan</th>
                                </tr>
                            </thead>
                            <tbody id="filesTableBody">
                                <tr>
                                    <td colspan="7" class="text-center">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                        <p class="mt-2">Memuatkan data...</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        await this.loadFilesList();
        this.setupFileFilters();
    }

    async loadFilesList() {
        const tbody = document.getElementById('filesTableBody');
        if (!tbody) return;

        try {
            const files = await models.file.getAll();
            
            if (files.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted py-4">
                            <i class="fas fa-folder-open fa-3x mb-3"></i>
                            <p>Tiada fail dijumpai</p>
                        </td>
                    </tr>
                `;
                return;
            }

            const filesHtml = files.map(file => `
                <tr>
                    <td><strong>${file.file_id}</strong></td>
                    <td>${file.title}</td>
                    <td>${file.department}</td>
                    <td>
                        <span class="badge bg-info">
                            ${models.file.getDocumentTypeDisplay(file.document_type)}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${this.getStatusBadgeClass(file.status)}">
                            ${models.file.getStatusDisplay(file.status)}
                        </span>
                    </td>
                    <td id="location-${file.id}">
                        <small class="text-muted">Loading...</small>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="app.viewFile('${file.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${authManager.canManageFiles() ? `
                            <button class="btn btn-outline-secondary" onclick="app.editFile('${file.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            ` : ''}
                            ${authManager.canManageBorrowings() && file.status === 'tersedia' ? `
                            <button class="btn btn-outline-success" onclick="app.borrowFile('${file.id}')">
                                <i class="fas fa-handshake"></i>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');

            tbody.innerHTML = filesHtml;
            
            // Load location information for each file using location manager
            await this.loadFileLocationsEnhanced(files);

        } catch (error) {
            console.error('Error loading files:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger py-4">
                        <i class="fas fa-exclamation-circle fa-2x mb-3"></i>
                        <p>Ralat memuatkan data: ${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }

    // Enhanced location loading for files list
    async loadFileLocationsEnhanced(files) {
        try {
            // Ensure location manager has loaded locations
            if (locationDropdownManager.locations.size === 0) {
                await locationDropdownManager.loadLocationsFromFirebase();
                if (locationDropdownManager.locations.size === 0) {
                    locationDropdownManager.loadDummyLocations();
                }
            }
            
            // Update location columns for each file
            files.forEach((file, index) => {
                const locationCell = document.getElementById(`location-${file.id}`);
                
                if (locationCell && file.location_id) {
                    const locationName = locationDropdownManager.getLocationDisplayName(file.location_id);
                    const isAvailable = locationDropdownManager.isLocationAvailable(file.location_id);
                    
                    locationCell.innerHTML = `
                        <div>
                            <strong>${locationName}</strong>
                            ${!isAvailable ? '<br><small class="text-warning">Tidak tersedia</small>' : ''}
                        </div>
                    `;
                } else if (locationCell) {
                    locationCell.innerHTML = '<small class="text-muted">Tiada lokasi ditetapkan</small>';
                }
            });
        } catch (error) {
            console.error('Error loading file locations:', error);
        }
    }

    // Utility methods
    showCreateFileModal() {
        this.showFileModal();
    }

    editFile(fileId) {
        this.showFileModal(fileId);
    }

    viewFile(fileId) {
        this.showFileDetailsModal(fileId);
    }

    getStatusBadgeClass(status) {
        const classes = {
            'tersedia': 'bg-success',
            'dipinjam': 'bg-warning text-dark',
            'arkib': 'bg-secondary',
            'tidak_aktif': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    setupFileFilters() {
        // Setup search
        const searchInput = document.getElementById('fileSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filterFiles();
            }, 500));
        }

        // Load filter options
        this.loadFilterOptions();
    }

    async loadFilterOptions() {
        try {
            const files = await models.file.getAll();
            
            // Department filter
            const departments = [...new Set(files.map(f => f.department))].sort();
            const departmentSelect = document.getElementById('departmentFilter');
            if (departmentSelect) {
                departmentSelect.innerHTML = '<option value="">Semua Jabatan</option>' +
                    departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
            }

            // Year filter
            const years = [...new Set(files.map(f => f.document_year))].sort().reverse();
            const yearSelect = document.getElementById('yearFilter');
            if (yearSelect) {
                yearSelect.innerHTML = '<option value="">Semua Tahun</option>' +
                    years.map(year => `<option value="${year}">${year}</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    }

    async filterFiles() {
        console.log('Filtering files...');
        // Implementation for filtering files
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

        const alertId = 'alert_' + Date.now();
        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${this.getAlertIcon(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        alertContainer.insertAdjacentHTML('beforeend', alertHtml);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }

    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            danger: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Placeholder methods for other features
    async loadDashboard() {
        document.getElementById('pageContent').innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2"><i class="fas fa-tachometer-alt me-2"></i>Dashboard</h1>
            </div>
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Dashboard dengan location dropdown yang diperbaiki.
            </div>
        `;
    }

    async loadLocationsPage() {
        document.getElementById('pageContent').innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2"><i class="fas fa-map-marker-alt me-2"></i>Pengurusan Lokasi</h1>
            </div>
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Halaman lokasi akan dilaksanakan kemudian.
            </div>
        `;
    }

    async loadBorrowingsPage() {
        document.getElementById('pageContent').innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2"><i class="fas fa-handshake me-2"></i>Sistem Peminjaman</h1>
            </div>
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Halaman peminjaman akan dilaksanakan kemudian.
            </div>
        `;
    }

    async loadReportsPage() {
        document.getElementById('pageContent').innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2"><i class="fas fa-chart-bar me-2"></i>Laporan</h1>
            </div>
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Halaman laporan akan dilaksanakan kemudian.
            </div>
        `;
    }

    async loadUsersPage() {
        if (!authManager.canManageUsers()) {
            document.getElementById('pageContent').innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Anda tidak mempunyai kebenaran untuk mengakses halaman ini.
                </div>
            `;
            return;
        }

        document.getElementById('pageContent').innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2"><i class="fas fa-users me-2"></i>Pengurusan Pengguna</h1>
            </div>
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Halaman pengguna akan dilaksanakan kemudian.
            </div>
        `;
    }

    async showFileDetailsModal(fileId) {
        console.log('Show file details:', fileId);
    }
}

// Initialize enhanced app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppWithLocationFix();
});

export default AppWithLocationFix;