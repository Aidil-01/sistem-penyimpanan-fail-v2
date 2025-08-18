// Main application logic
import authManager from './auth.js';
import { models } from './models.js';

class App {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupSidebar();
        this.setupOfflineIndicator();
        this.loadPage('dashboard');
    }

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
        const mainContent = document.querySelector('.main-content');

        // Hamburger button click - open sidebar
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openSidebar();
            });
        }

        // Close button click
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeSidebar();
            });
        }

        // Overlay click - close sidebar
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Click outside sidebar to close (mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const isClickInsideSidebar = sidebar && sidebar.contains(e.target);
                const isClickOnHamburger = hamburgerBtn && hamburgerBtn.contains(e.target);
                
                if (!isClickInsideSidebar && !isClickOnHamburger && sidebar && sidebar.classList.contains('show')) {
                    this.closeSidebar();
                }
            }
        });

        // Handle swipe gestures on mobile
        this.setupSwipeGestures();

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeSidebar();
            }
        });

        // Prevent body scroll when sidebar is open on mobile
        this.preventBodyScroll();
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebarMenu');
        const overlay = document.getElementById('sidebarOverlay');
        const mainContent = document.querySelector('.main-content');

        if (sidebar) {
            sidebar.classList.add('show');
            if (overlay) {
                overlay.classList.remove('d-none');
                overlay.classList.add('show');
            }
            if (mainContent && window.innerWidth <= 768) {
                mainContent.classList.add('sidebar-open');
            }
            
            // Prevent body scrolling on mobile
            if (window.innerWidth <= 768) {
                document.body.style.overflow = 'hidden';
            }
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebarMenu');
        const overlay = document.getElementById('sidebarOverlay');
        const mainContent = document.querySelector('.main-content');

        if (sidebar) {
            sidebar.classList.remove('show');
            if (overlay) {
                overlay.classList.remove('show');
                setTimeout(() => {
                    overlay.classList.add('d-none');
                }, 300);
            }
            if (mainContent) {
                mainContent.classList.remove('sidebar-open');
            }
            
            // Restore body scrolling
            document.body.style.overflow = '';
        }
    }

    setupSwipeGestures() {
        let startX = 0;
        let currentX = 0;
        let isSwping = false;
        
        const mainContent = document.querySelector('.main-content');
        const sidebar = document.getElementById('sidebarMenu');

        if (!mainContent || !sidebar) return;

        // Touch start
        mainContent.addEventListener('touchstart', (e) => {
            if (window.innerWidth <= 768) {
                startX = e.touches[0].clientX;
                isSwping = true;
            }
        }, { passive: true });

        // Touch move
        mainContent.addEventListener('touchmove', (e) => {
            if (!isSwping || window.innerWidth > 768) return;
            
            currentX = e.touches[0].clientX;
            const diffX = currentX - startX;
            
            // Prevent default scrolling when swiping horizontally
            if (Math.abs(diffX) > 10) {
                e.preventDefault();
            }
        }, { passive: false });

        // Touch end
        mainContent.addEventListener('touchend', (e) => {
            if (!isSwping || window.innerWidth > 768) return;
            
            const diffX = currentX - startX;
            const threshold = 50;
            
            // Swipe right to open (from left edge)
            if (diffX > threshold && startX < 50 && !sidebar.classList.contains('show')) {
                this.openSidebar();
            }
            // Swipe left to close
            else if (diffX < -threshold && sidebar.classList.contains('show')) {
                this.closeSidebar();
            }
            
            isSwping = false;
            startX = 0;
            currentX = 0;
        }, { passive: true });

        // Also handle swipe on sidebar itself
        sidebar.addEventListener('touchstart', (e) => {
            if (window.innerWidth <= 768) {
                startX = e.touches[0].clientX;
                isSwping = true;
            }
        }, { passive: true });

        sidebar.addEventListener('touchmove', (e) => {
            if (!isSwping || window.innerWidth > 768) return;
            currentX = e.touches[0].clientX;
        }, { passive: true });

        sidebar.addEventListener('touchend', (e) => {
            if (!isSwping || window.innerWidth > 768) return;
            
            const diffX = currentX - startX;
            const threshold = 50;
            
            // Swipe left to close sidebar
            if (diffX < -threshold) {
                this.closeSidebar();
            }
            
            isSwping = false;
            startX = 0;
            currentX = 0;
        }, { passive: true });
    }

    preventBodyScroll() {
        // Prevent bounce scrolling on iOS when sidebar is open
        document.addEventListener('touchmove', (e) => {
            const sidebar = document.getElementById('sidebarMenu');
            if (sidebar && sidebar.classList.contains('show') && window.innerWidth <= 768) {
                // Allow scrolling within sidebar
                if (!sidebar.contains(e.target)) {
                    e.preventDefault();
                }
            }
        }, { passive: false });
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

    async loadDashboard() {
        const contentContainer = document.getElementById('pageContent');
        
        // Show loading
        contentContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Memuatkan dashboard...</p>
            </div>
        `;

        try {
            // Get statistics
            const [files, activeFiles, borrowedFiles, overdueBorrowings, locations, users] = await Promise.all([
                models.file.getAll(),
                models.file.getByStatus('tersedia'),
                models.file.getByStatus('dipinjam'),
                models.borrowing.getOverdueBorrowings(),
                models.location.getAll(),
                models.user.getActiveUsers()
            ]);

            const dashboardHtml = `
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2"><i class="fas fa-tachometer-alt me-2"></i>Dashboard</h1>
                </div>

                <!-- Statistics Cards -->
                <div class="row mb-4">
                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="flex-grow-1">
                                        <div class="text-xs font-weight-bold text-uppercase mb-1">
                                            Jumlah Fail
                                        </div>
                                        <div class="h5 mb-0 font-weight-bold">
                                            ${files.length}
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-folder fa-2x opacity-75"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card-secondary">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="flex-grow-1">
                                        <div class="text-xs font-weight-bold text-uppercase mb-1">
                                            Fail Tersedia
                                        </div>
                                        <div class="h5 mb-0 font-weight-bold">
                                            ${activeFiles.length}
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-check-circle fa-2x opacity-75"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card-warning">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="flex-grow-1">
                                        <div class="text-xs font-weight-bold text-uppercase mb-1">
                                            Fail Dipinjam
                                        </div>
                                        <div class="h5 mb-0 font-weight-bold">
                                            ${borrowedFiles.length}
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-handshake fa-2x opacity-75"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-3 col-md-6 mb-4">
                        <div class="card stat-card-danger">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="flex-grow-1">
                                        <div class="text-xs font-weight-bold text-uppercase mb-1">
                                            Overdue
                                        </div>
                                        <div class="h5 mb-0 font-weight-bold">
                                            ${overdueBorrowings.length}
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <i class="fas fa-exclamation-triangle fa-2x opacity-75"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts and Recent Activity -->
                <div class="row">
                    <!-- Files by Department Chart -->
                    <div class="col-xl-8 col-lg-7 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <i class="fas fa-chart-pie me-1"></i>
                                Fail Mengikut Jabatan
                            </div>
                            <div class="card-body">
                                <canvas id="departmentChart" style="height: 300px;"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="col-xl-4 col-lg-5 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <i class="fas fa-list me-1"></i>
                                Aktiviti Terkini
                            </div>
                            <div class="card-body">
                                <div id="recentActivity" style="height: 300px; overflow-y: auto;">
                                    <!-- Recent activity will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <i class="fas fa-bolt me-1"></i>
                                Tindakan Pantas
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    ${authManager.canManageFiles() ? `
                                    <div class="col-md-3 mb-3">
                                        <button class="btn btn-primary w-100" onclick="app.loadPage('files')">
                                            <i class="fas fa-plus me-2"></i>
                                            Tambah Fail Baharu
                                        </button>
                                    </div>
                                    ` : ''}
                                    ${authManager.canManageBorrowings() ? `
                                    <div class="col-md-3 mb-3">
                                        <button class="btn btn-success w-100" onclick="app.loadPage('borrowings')">
                                            <i class="fas fa-handshake me-2"></i>
                                            Pinjam Fail
                                        </button>
                                    </div>
                                    ` : ''}
                                    <div class="col-md-3 mb-3">
                                        <button class="btn btn-info w-100" onclick="app.searchFiles()">
                                            <i class="fas fa-search me-2"></i>
                                            Cari Fail
                                        </button>
                                    </div>
                                    ${authManager.canViewReports() ? `
                                    <div class="col-md-3 mb-3">
                                        <button class="btn btn-warning w-100" onclick="app.loadPage('reports')">
                                            <i class="fas fa-chart-bar me-2"></i>
                                            Laporan
                                        </button>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            contentContainer.innerHTML = dashboardHtml;

            // Load charts and recent activity
            await this.loadDepartmentChart(files);
            await this.loadRecentActivity();

        } catch (error) {
            console.error('Error loading dashboard:', error);
            contentContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Ralat memuatkan dashboard: ${error.message}
                </div>
            `;
        }
    }

    async loadDepartmentChart(files) {
        const ctx = document.getElementById('departmentChart');
        if (!ctx) return;

        // Group files by department
        const departmentData = files.reduce((acc, file) => {
            acc[file.department] = (acc[file.department] || 0) + 1;
            return acc;
        }, {});

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(departmentData),
                datasets: [{
                    data: Object.values(departmentData),
                    backgroundColor: [
                        '#2563eb',
                        '#059669',
                        '#d97706',
                        '#dc2626',
                        '#7c3aed',
                        '#0891b2'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async loadRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        try {
            const activities = await models.activity.getRecent(7);
            
            if (activities.length === 0) {
                container.innerHTML = '<p class="text-muted">Tiada aktiviti terkini</p>';
                return;
            }

            const activitiesHtml = activities.slice(0, 10).map(activity => `
                <div class="d-flex align-items-center mb-3">
                    <div class="me-3">
                        <i class="fas fa-circle text-primary" style="font-size: 0.5rem;"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-semibold">${models.activity.getActionDisplay(activity.action)}</div>
                        <div class="small text-muted">${activity.description}</div>
                        <div class="small text-muted">
                            ${activity.timestamp ? this.formatDate(activity.timestamp.toDate()) : 'Tarikh tidak diketahui'}
                        </div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = activitiesHtml;
        } catch (error) {
            console.error('Error loading recent activity:', error);
            container.innerHTML = '<p class="text-danger">Ralat memuatkan aktiviti</p>';
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
                    <td>
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
            
            // Load location information for each file
            await this.loadFileLocations(files);

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

    async loadFileLocations(files) {
        try {
            // Get all locations
            const locations = await models.location.getAll();
            const locationMap = new Map();
            locations.forEach(loc => locationMap.set(loc.id, loc));
            
            // Update location columns for each file
            files.forEach((file, index) => {
                const row = document.querySelectorAll('#filesTableBody tr')[index];
                if (row && file.location_id) {
                    const locationCell = row.cells[5]; // Location column (index 5)
                    const location = locationMap.get(file.location_id);
                    
                    if (location) {
                        const locationInfo = this.getLocationDisplay(location);
                        locationCell.innerHTML = `
                            <div>
                                <strong>${locationInfo.name}</strong>
                                <br>
                                <small class="text-muted">${locationInfo.path}</small>
                            </div>
                        `;
                    } else {
                        locationCell.innerHTML = '<small class="text-danger">Lokasi tidak dijumpai</small>';
                    }
                } else if (row) {
                    const locationCell = row.cells[5];
                    locationCell.innerHTML = '<small class="text-muted">Tiada lokasi ditetapkan</small>';
                }
            });
        } catch (error) {
            console.error('Error loading file locations:', error);
        }
    }

    getLocationDisplay(location) {
        // Handle both old and new location structure
        if (location.type) {
            // New structure
            return {
                name: location.name,
                path: location.type === 'slot' ? 'Slot' : location.type === 'rack' ? 'Rak' : 'Bilik',
                code: location.qrCode || location.name
            };
        } else {
            // Old structure
            return {
                name: `${location.room}-${location.rack}-${location.slot}`,
                path: `${location.room} > ${location.rack} > ${location.slot}`,
                code: location.qrCode || `${location.room}${location.rack}${location.slot}`
            };
        }
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
        // Implementation for filtering files
        console.log('Filtering files...');
        // This would filter the files based on search terms and filters
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

    formatDate(date) {
        return new Intl.DateTimeFormat('ms-MY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
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

    // Placeholder methods for other pages
    async loadLocationsPage() {
        const contentContainer = document.getElementById('pageContent');
        
        try {
            // Show loading state
            contentContainer.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3">Memuatkan halaman lokasi...</p>
                </div>
            `;
            
            // Load the locations page HTML
            const response = await fetch('./locations.html');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            contentContainer.innerHTML = html;
            
            // Wait a bit for DOM to settle
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Load the locations JavaScript module
            try {
                const locationModule = await import('./locations.js');
                
                // Initialize location manager
                if (window.locationManager) {
                    // Clean up existing instance
                    window.locationManager = null;
                }
                
                // Create new instance
                window.locationManager = new locationModule.default();
                console.log('Location Manager initialized successfully');
                
            } catch (moduleError) {
                console.error('Error loading locations module:', moduleError);
                throw new Error(`Module loading failed: ${moduleError.message}`);
            }
            
        } catch (error) {
            console.error('Error loading locations page:', error);
            contentContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    <strong>Ralat memuatkan halaman lokasi:</strong> ${error.message}
                    <hr>
                    <small class="text-muted">
                        Sila pastikan:
                        <ul class="mt-2 mb-0">
                            <li>Sambungan internet stabil</li>
                            <li>Firestore indexes telah dibuat</li>
                            <li>Anda telah login dengan akaun yang sah</li>
                        </ul>
                    </small>
                    <div class="mt-3">
                        <button class="btn btn-primary btn-sm" onclick="app.loadLocationsPage()">
                            <i class="fas fa-redo me-1"></i>Cuba Lagi
                        </button>
                        <a href="/create-indexes.html" class="btn btn-warning btn-sm">
                            <i class="fas fa-tools me-1"></i>Setup Indexes
                        </a>
                    </div>
                </div>
            `;
        }
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

    // File Management Functions
    showCreateFileModal() {
        this.showFileModal();
    }

    editFile(fileId) {
        this.showFileModal(fileId);
    }

    viewFile(fileId) {
        this.showFileDetailsModal(fileId);
    }

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

        // Get available locations for dropdown
        let locations = [];
        try {
            locations = await models.location.getAll();
        } catch (error) {
            console.error('Error loading locations:', error);
            // Use dummy data if Firebase fails
            locations = [
                {id: 'slot_a1_1', name: 'Slot A1-1', type: 'slot'},
                {id: 'slot_a1_2', name: 'Slot A1-2', type: 'slot'},
                {id: 'slot_a1_3', name: 'Slot A1-3', type: 'slot'}
            ];
        }

        const availableLocations = locations.filter(loc => 
            loc.type === 'slot' || (!loc.type && loc.slot) // Either new slot type or old structure
        );

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
                                            <option value="Sumber Manusia" ${fileData?.department === 'Sumber Manusia' ? 'selected' : ''}>Sumber Manusia</option>
                                            <option value="Perancangan" ${fileData?.department === 'Perancangan' ? 'selected' : ''}>Perancangan</option>
                                            <option value="ICT" ${fileData?.department === 'ICT' ? 'selected' : ''}>ICT</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Jenis Dokumen</label>
                                        <select class="form-select" name="document_type">
                                            <option value="">Pilih Jenis</option>
                                            <option value="surat" ${fileData?.document_type === 'surat' ? 'selected' : ''}>Surat</option>
                                            <option value="laporan" ${fileData?.document_type === 'laporan' ? 'selected' : ''}>Laporan</option>
                                            <option value="minit_mesyuarat" ${fileData?.document_type === 'minit_mesyuarat' ? 'selected' : ''}>Minit Mesyuarat</option>
                                            <option value="memo" ${fileData?.document_type === 'memo' ? 'selected' : ''}>Memo</option>
                                            <option value="baucer" ${fileData?.document_type === 'baucer' ? 'selected' : ''}>Baucer</option>
                                            <option value="lain" ${fileData?.document_type === 'lain' ? 'selected' : ''}>Lain-lain</option>
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
                                    <select class="form-select" name="location_id" required>
                                        <option value="">Pilih Lokasi</option>
                                        ${availableLocations.map(location => {
                                            const locationName = this.getLocationDisplay(location).name;
                                            const locationPath = this.getLocationDisplay(location).path;
                                            const selected = fileData?.location_id === location.id ? 'selected' : '';
                                            return `<option value="${location.id}" ${selected}>${locationName} (${locationPath})</option>`;
                                        }).join('')}
                                    </select>
                                    <div class="form-text">Pilih slot yang tersedia untuk menyimpan fail ini</div>
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
                                <button type="submit" class="btn btn-primary">
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

        // Handle form submission
        document.getElementById('fileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFileFormSubmit(e.target, isEdit, fileId);
            modal.hide();
        });
    }

    async handleFileFormSubmit(form, isEdit, fileId) {
        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            if (isEdit) {
                await models.file.update(fileId, data);
                this.showAlert('Fail berjaya dikemaskini', 'success');
            } else {
                await models.file.createFile(data);
                this.showAlert('Fail berjaya ditambah', 'success');
            }
            
            // Reload files list
            await this.loadFilesList();
            
        } catch (error) {
            console.error('Error saving file:', error);
            this.showAlert('Ralat menyimpan fail: ' + error.message, 'danger');
        }
    }

    async showFileDetailsModal(fileId) {
        try {
            const fileData = await models.file.getById(fileId);
            if (!fileData) {
                this.showAlert('Fail tidak dijumpai', 'danger');
                return;
            }

            // Get location information
            let locationInfo = 'Tiada lokasi ditetapkan';
            if (fileData.location_id) {
                try {
                    const location = await models.location.getById(fileData.location_id);
                    if (location) {
                        const locationDisplay = this.getLocationDisplay(location);
                        locationInfo = `${locationDisplay.name} (${locationDisplay.path})`;
                    }
                } catch (error) {
                    console.error('Error loading location:', error);
                    locationInfo = 'Ralat memuatkan lokasi';
                }
            }

            const modalHtml = `
                <div class="modal fade" id="fileDetailsModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-file-alt me-2"></i>Butiran Fail
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Maklumat Asas</h6>
                                        <table class="table table-borderless table-sm">
                                            <tr>
                                                <td><strong>ID Fail:</strong></td>
                                                <td>${fileData.file_id}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Tajuk:</strong></td>
                                                <td>${fileData.title}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Rujukan:</strong></td>
                                                <td>${fileData.reference_number || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Jabatan:</strong></td>
                                                <td>${fileData.department}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Jenis:</strong></td>
                                                <td>${fileData.document_type || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Tahun:</strong></td>
                                                <td>${fileData.document_year || '-'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Status dan Lokasi</h6>
                                        <table class="table table-borderless table-sm">
                                            <tr>
                                                <td><strong>Status:</strong></td>
                                                <td>
                                                    <span class="badge ${this.getStatusBadgeClass(fileData.status)}">
                                                        ${this.getStatusDisplay(fileData.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><strong>Lokasi:</strong></td>
                                                <td>${locationInfo}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Dicipta:</strong></td>
                                                <td>${this.formatDate(fileData.created_at)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Dikemaskini:</strong></td>
                                                <td>${this.formatDate(fileData.updated_at)}</td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                                
                                ${fileData.description ? `
                                <div class="mt-3">
                                    <h6>Keterangan</h6>
                                    <p class="text-muted">${fileData.description}</p>
                                </div>
                                ` : ''}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                                <button type="button" class="btn btn-warning" onclick="app.editFile('${fileData.id}'); bootstrap.Modal.getInstance(document.getElementById('fileDetailsModal')).hide();">
                                    <i class="fas fa-edit me-1"></i>Edit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal
            document.querySelector('#fileDetailsModal')?.remove();
            
            // Add new modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Initialize and show modal
            const modal = new bootstrap.Modal(document.getElementById('fileDetailsModal'));
            modal.show();

        } catch (error) {
            console.error('Error loading file details:', error);
            this.showAlert('Ralat memuatkan butiran fail', 'danger');
        }
    }

    getStatusDisplay(status) {
        const statusMap = {
            'tersedia': 'Tersedia',
            'dipinjam': 'Dipinjam', 
            'arkib': 'Arkib'
        };
        return statusMap[status] || status;
    }

    getStatusBadgeClass(status) {
        const classMap = {
            'tersedia': 'bg-success',
            'dipinjam': 'bg-warning',
            'arkib': 'bg-secondary'
        };
        return classMap[status] || 'bg-primary';
    }

    formatDate(timestamp) {
        if (!timestamp) return '-';
        
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            date = new Date(timestamp);
        }
        
        return date.toLocaleDateString('ms-MY', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

export default App;