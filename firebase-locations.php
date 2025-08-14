<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pengurusan Lokasi - Sistem Penyimpanan Fail Tongod</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #f8f9fa;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .sidebar {
            min-height: 100vh;
            background: #1e293b;
            color: #94a3b8;
        }
        .sidebar .nav-link {
            color: #94a3b8;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            margin: 0.25rem 0.5rem;
        }
        .sidebar .nav-link:hover {
            color: white;
            background-color: rgba(255, 255, 255, 0.1);
        }
        .sidebar .nav-link.active {
            color: white;
            background-color: #2563eb;
        }
        .card {
            border: none;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-radius: 0.75rem;
        }
        .location-card {
            transition: transform 0.2s;
            cursor: pointer;
        }
        .location-card:hover {
            transform: translateY(-2px);
        }
        .loading-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999;
            align-items: center;
            justify-content: center;
        }
        .loading-overlay.show {
            display: flex;
        }
        .location-tree {
            padding-left: 0;
        }
        .location-tree .room-item {
            margin-bottom: 1rem;
            border: 1px solid #dee2e6;
            border-radius: 0.5rem;
        }
        .location-tree .rack-item {
            background-color: #f8f9fa;
            border-left: 3px solid #0d6efd;
            margin: 0.5rem 0;
        }
        .location-tree .slot-item {
            background-color: #ffffff;
            border-left: 3px solid #28a745;
            margin: 0.25rem 0;
            padding: 0.5rem;
        }
        .qr-code-display {
            max-width: 150px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="text-center text-white">
            <div class="spinner-border mb-3" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <h5>Memuat data...</h5>
        </div>
    </div>

    <div class="container-fluid">
        <div class="row">
            <!-- Sidebar -->
            <nav class="col-md-3 col-lg-2 d-md-block sidebar collapse">
                <div class="position-sticky pt-3">
                    <div class="px-3 mb-4">
                        <h5 class="text-white fw-bold">
                            <i class="fas fa-archive me-2"></i>SPF Tongod
                        </h5>
                        <small class="text-muted">Sistem Penyimpanan Fail</small>
                    </div>
                    
                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link" href="dashboard.php">
                                <i class="fas fa-tachometer-alt me-2"></i>Dashboard
                            </a>
                        </li>
                        
                        <li class="nav-item">
                            <a class="nav-link" href="files.php">
                                <i class="fas fa-folder me-2"></i>Pengurusan Fail
                            </a>
                        </li>
                        
                        <li class="nav-item">
                            <a class="nav-link active" href="firebase-locations.php">
                                <i class="fas fa-map-marker-alt me-2"></i>Lokasi
                            </a>
                        </li>
                        
                        <li class="nav-item">
                            <a class="nav-link" href="borrowings.php">
                                <i class="fas fa-handshake me-2"></i>Peminjaman
                            </a>
                        </li>
                        
                        <li class="nav-item">
                            <a class="nav-link" href="users.php">
                                <i class="fas fa-users me-2"></i>Pengguna
                            </a>
                        </li>
                    </ul>
                    
                    <hr class="text-secondary">
                    
                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link text-light" href="logout.php">
                                <i class="fas fa-sign-out-alt me-2"></i>Log Keluar
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>
            
            <!-- Main content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <!-- Top navbar -->
                <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
                    <div class="container-fluid">
                        <div class="navbar-nav ms-auto">
                            <div class="nav-item dropdown">
                                <div class="d-flex align-items-center">
                                    <div class="me-3 text-end">
                                        <div class="fw-semibold" id="userName">Loading...</div>
                                        <small class="text-muted" id="userRole">Loading...</small>
                                    </div>
                                    <i class="fas fa-user-circle fa-2x text-secondary"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
                
                <!-- Page content -->
                <div class="container-fluid">
                    <!-- Success/Error Messages -->
                    <div id="messageContainer"></div>
                    
                    <!-- Main View -->
                    <div id="listView">
                        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                            <h1 class="h2 fw-bold text-primary">
                                <i class="fas fa-map-marker-alt me-2"></i>Pengurusan Lokasi
                            </h1>
                            <div class="btn-toolbar mb-2 mb-md-0">
                                <button class="btn btn-primary me-2" onclick="showCreateForm()">
                                    <i class="fas fa-plus me-1"></i>Tambah Bilik
                                </button>
                                <button class="btn btn-success me-2" onclick="showQRScanner()">
                                    <i class="fas fa-qrcode me-1"></i>Scan QR
                                </button>
                                <button class="btn btn-outline-primary" onclick="refreshData()">
                                    <i class="fas fa-sync-alt me-1"></i>Refresh
                                </button>
                            </div>
                        </div>

                        <!-- Search and Filter -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h6 class="m-0 font-weight-bold">
                                    <i class="fas fa-search me-2"></i>Carian dan Penapis
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <label for="searchInput" class="form-label">Carian</label>
                                        <input type="text" class="form-control" id="searchInput" 
                                               placeholder="Nama bilik, rak, atau slot..." 
                                               onkeyup="filterLocations()">
                                    </div>
                                    <div class="col-md-3">
                                        <label for="typeFilter" class="form-label">Jenis</label>
                                        <select class="form-select" id="typeFilter" onchange="filterLocations()">
                                            <option value="">Semua Jenis</option>
                                            <option value="room">Bilik</option>
                                            <option value="rack">Rak</option>
                                            <option value="slot">Slot</option>
                                        </select>
                                    </div>
                                    <div class="col-md-3">
                                        <label for="statusFilter" class="form-label">Status</label>
                                        <select class="form-select" id="statusFilter" onchange="filterLocations()">
                                            <option value="">Semua Status</option>
                                            <option value="empty">Kosong</option>
                                            <option value="occupied">Ada Fail</option>
                                            <option value="maintenance">Penyelenggaraan</option>
                                        </select>
                                    </div>
                                    <div class="col-md-2 d-flex align-items-end">
                                        <button type="button" class="btn btn-outline-secondary w-100" onclick="clearFilters()">
                                            <i class="fas fa-times me-1"></i>Clear
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Locations Tree -->
                        <div id="locationsContainer">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <p class="mt-3">Memuat data lokasi...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Create/Edit Form Modal -->
                    <div class="modal fade" id="locationModal" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="modalTitle">Tambah Lokasi</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="locationForm">
                                        <input type="hidden" id="editId" value="">
                                        <input type="hidden" id="parentId" value="">
                                        
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <label for="locationType" class="form-label">Jenis Lokasi</label>
                                                <select class="form-select" id="locationType" onchange="updateFormFields()" required>
                                                    <option value="room">Bilik</option>
                                                    <option value="rack">Rak</option>
                                                    <option value="slot">Slot</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label for="locationName" class="form-label">Nama <span class="text-danger">*</span></label>
                                                <input type="text" class="form-control" id="locationName" required>
                                            </div>
                                        </div>
                                        
                                        <div class="mb-3" id="parentSelectDiv" style="display: none;">
                                            <label for="parentSelect" class="form-label">Parent Location</label>
                                            <select class="form-select" id="parentSelect">
                                                <option value="">Pilih parent...</option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="locationDescription" class="form-label">Keterangan</label>
                                            <textarea class="form-control" id="locationDescription" rows="3"></textarea>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="locationStatus" class="form-label">Status</label>
                                            <select class="form-select" id="locationStatus">
                                                <option value="empty">Kosong</option>
                                                <option value="occupied">Ada Fail</option>
                                                <option value="maintenance">Penyelenggaraan</option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="isAvailable" checked>
                                                <label class="form-check-label" for="isAvailable">
                                                    Tersedia untuk digunakan
                                                </label>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                                    <button type="button" class="btn btn-primary" onclick="saveLocation()">
                                        <i class="fas fa-save me-1"></i>Simpan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- View Location Modal -->
                    <div class="modal fade" id="viewLocationModal" tabindex="-1">
                        <div class="modal-dialog modal-xl">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Butiran Lokasi</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="row">
                                        <div class="col-lg-4">
                                            <div class="card">
                                                <div class="card-body text-center">
                                                    <i class="fas fa-map-marker-alt fa-3x text-primary mb-3"></i>
                                                    <h4 id="viewLocationName">Loading...</h4>
                                                    <span id="viewLocationBadge" class="badge fs-6">Loading...</span>
                                                    
                                                    <div class="mt-3" id="viewLocationDetails">
                                                        <!-- Location details will be loaded here -->
                                                    </div>
                                                    
                                                    <div class="mt-3" id="viewLocationQR">
                                                        <!-- QR Code will be displayed here -->
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-lg-8">
                                            <div class="card">
                                                <div class="card-header d-flex justify-content-between align-items-center">
                                                    <h6 class="m-0">
                                                        <i class="fas fa-folder me-2"></i>Fail di Lokasi Ini
                                                        <span id="fileCount" class="badge bg-primary ms-2">0</span>
                                                    </h6>
                                                    <button class="btn btn-sm btn-primary" onclick="showAddFileForm()" id="addFileBtn">
                                                        <i class="fas fa-plus me-1"></i>Tambah Fail
                                                    </button>
                                                </div>
                                                <div class="card-body p-0">
                                                    <div id="filesContainer">
                                                        <div class="text-center py-4">
                                                            <div class="spinner-border text-primary" role="status">
                                                                <span class="visually-hidden">Loading...</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-warning" onclick="editLocation()">
                                        <i class="fas fa-edit me-1"></i>Edit
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Tutup</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- File Management Module -->
    <script src="firebase-file-management.js"></script>

    <!-- Add File Modal -->
    <div class="modal fade" id="addFileModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Tambah Fail Baharu</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="addFileForm">
                        <input type="hidden" id="fileLocationId" value="">
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="fileTitle" class="form-label">Tajuk Fail <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="fileTitle" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="fileDepartment" class="form-label">Jabatan <span class="text-danger">*</span></label>
                                <select class="form-select" id="fileDepartment" required>
                                    <option value="">Pilih Jabatan</option>
                                    <option value="Pentadbiran Am">Pentadbiran Am</option>
                                    <option value="Kewangan">Kewangan</option>
                                    <option value="Sumber Manusia">Sumber Manusia</option>
                                    <option value="Teknologi Maklumat">Teknologi Maklumat</option>
                                    <option value="Perundangan">Perundangan</option>
                                    <option value="Audit">Audit</option>
                                    <option value="Pembangunan">Pembangunan</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="fileCategory" class="form-label">Kategori</label>
                                <select class="form-select" id="fileCategory">
                                    <option value="">Pilih Kategori</option>
                                    <option value="Surat">Surat</option>
                                    <option value="Laporan">Laporan</option>
                                    <option value="Kontrak">Kontrak</option>
                                    <option value="Invoice">Invoice</option>
                                    <option value="Rekod">Rekod</option>
                                    <option value="Lain-lain">Lain-lain</option>
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="fileClassification" class="form-label">Klasifikasi</label>
                                <select class="form-select" id="fileClassification">
                                    <option value="Biasa">Biasa</option>
                                    <option value="Sulit">Sulit</option>
                                    <option value="Rahsia">Rahsia</option>
                                    <option value="Terhad">Terhad</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="fileDescription" class="form-label">Keterangan</label>
                            <textarea class="form-control" id="fileDescription" rows="3"></textarea>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="fileCreatedDate" class="form-label">Tarikh Dicipta</label>
                                <input type="date" class="form-control" id="fileCreatedDate">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="fileExpiryDate" class="form-label">Tarikh Luput</label>
                                <input type="date" class="form-control" id="fileExpiryDate">
                            </div>
                        </div>
                        
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>Nota:</strong> QR code akan dijana secara automatik untuk fail ini.
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="button" class="btn btn-primary" onclick="saveNewFile()">
                        <i class="fas fa-save me-1"></i>Simpan
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- QR Code Scanner Modal -->
    <div class="modal fade" id="qrScannerModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Scan QR Code</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <div id="qrScanner">
                        <div class="border rounded p-4 mb-3">
                            <i class="fas fa-qrcode fa-3x text-muted mb-3"></i>
                            <p>QR Scanner akan diaktifkan di sini</p>
                        </div>
                        <div class="mb-3">
                            <label for="manualQRInput" class="form-label">Atau masukkan kod QR secara manual:</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="manualQRInput" placeholder="Masukkan kod QR...">
                                <button class="btn btn-primary" onclick="searchByQRCode()">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Firebase SDKs -->
    <script type="module">
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
        import { 
            getFirestore, 
            collection, 
            doc, 
            getDocs, 
            getDoc,
            addDoc, 
            updateDoc, 
            deleteDoc, 
            query, 
            where, 
            orderBy,
            serverTimestamp 
        } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyDGpAHia_wEmrhnmYjrPJbMiOiGvR6ualM",
            authDomain: "sistem-fail-tongod.firebaseapp.com",
            projectId: "sistem-fail-tongod",
            storageBucket: "sistem-fail-tongod.appspot.com",
            messagingSenderId: "581632635532",
            appId: "1:581632635532:web:abbf88d1f822dcb6ec5f13"
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // Global variables
        let locations = [];
        let files = [];
        let currentUser = null;
        let currentViewingLocation = null;
        let fileManager = null;

        // Authentication check
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                document.getElementById('userName').textContent = user.displayName || user.email;
                document.getElementById('userRole').textContent = 'Pengguna';
                loadLocations();
            } else {
                window.location.href = 'login.php';
            }
        });

        // Show loading overlay
        function showLoading() {
            document.getElementById('loadingOverlay').classList.add('show');
        }

        // Hide loading overlay
        function hideLoading() {
            document.getElementById('loadingOverlay').classList.remove('show');
        }

        // Show message
        function showMessage(message, type = 'success') {
            const container = document.getElementById('messageContainer');
            const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
            const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
            
            container.innerHTML = `
                <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                    <i class="fas fa-${icon} me-2"></i>${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            
            setTimeout(() => {
                container.innerHTML = '';
            }, 5000);
        }

        // Load locations from Firestore
        async function loadLocations() {
            try {
                showLoading();
                const locationsRef = collection(db, 'locations');
                const q = query(locationsRef, orderBy('sortOrder', 'asc'));
                const snapshot = await getDocs(q);
                
                locations = [];
                snapshot.forEach((doc) => {
                    locations.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                // Also load files count for each location
                await loadFilesCount();
                
                displayLocations();
                hideLoading();
            } catch (error) {
                console.error('Error loading locations:', error);
                showMessage('Ralat memuat lokasi: ' + error.message, 'error');
                hideLoading();
            }
        }

        // Load files count for locations
        async function loadFilesCount() {
            try {
                const filesRef = collection(db, 'files');
                const snapshot = await getDocs(filesRef);
                
                const filesByLocation = {};
                snapshot.forEach((doc) => {
                    const fileData = doc.data();
                    const locationId = fileData.locationId;
                    if (locationId) {
                        if (!filesByLocation[locationId]) {
                            filesByLocation[locationId] = 0;
                        }
                        filesByLocation[locationId]++;
                    }
                });

                // Update locations with file count
                locations.forEach(location => {
                    location.fileCount = filesByLocation[location.id] || 0;
                });
            } catch (error) {
                console.error('Error loading files count:', error);
            }
        }

        // Display locations in tree structure
        function displayLocations() {
            const container = document.getElementById('locationsContainer');
            
            if (locations.length === 0) {
                container.innerHTML = `
                    <div class="card">
                        <div class="card-body text-center py-5">
                            <i class="fas fa-map-marker-alt fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">Tiada lokasi dijumpai</h5>
                            <p class="text-muted">Klik butang "Tambah Bilik" untuk mencipta lokasi baharu.</p>
                            <button class="btn btn-primary" onclick="showCreateForm()">
                                <i class="fas fa-plus me-1"></i>Tambah Bilik
                            </button>
                        </div>
                    </div>
                `;
                return;
            }

            // Group locations by hierarchy
            const rooms = locations.filter(loc => loc.type === 'room' || !loc.parentId);
            const racks = locations.filter(loc => loc.type === 'rack' && loc.parentId);
            const slots = locations.filter(loc => loc.type === 'slot' && loc.parentId);

            let html = '<div class="location-tree">';

            rooms.forEach(room => {
                const roomRacks = racks.filter(rack => rack.parentId === room.id);
                
                html += `
                    <div class="room-item">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-door-open text-primary me-2"></i>
                                    <h6 class="mb-0">${room.name || 'Unnamed Room'}</h6>
                                    <span class="badge bg-${getStatusColor(room.status)} ms-2">${getStatusText(room.status)}</span>
                                </div>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="viewLocation('${room.id}')" title="Lihat">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-outline-success" onclick="showCreateForm('rack', '${room.id}')" title="Tambah Rak">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                    <button class="btn btn-outline-warning" onclick="editLocationForm('${room.id}')" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="deleteLocation('${room.id}')" title="Padam">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                `;
                
                if (roomRacks.length > 0) {
                    html += '<div class="card-body p-2">';
                    roomRacks.forEach(rack => {
                        const rackSlots = slots.filter(slot => slot.parentId === rack.id);
                        
                        html += `
                            <div class="rack-item p-2 mb-2 rounded">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-layer-group text-info me-2"></i>
                                        <strong>${rack.name || 'Unnamed Rack'}</strong>
                                        <span class="badge bg-${getStatusColor(rack.status)} ms-2">${getStatusText(rack.status)}</span>
                                    </div>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary btn-sm" onclick="viewLocation('${rack.id}')" title="Lihat">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success btn-sm" onclick="showCreateForm('slot', '${rack.id}')" title="Tambah Slot">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                        <button class="btn btn-outline-warning btn-sm" onclick="editLocationForm('${rack.id}')" title="Edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm" onclick="deleteLocation('${rack.id}')" title="Padam">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                        `;
                        
                        if (rackSlots.length > 0) {
                            html += '<div class="row g-2">';
                            rackSlots.forEach(slot => {
                                html += `
                                    <div class="col-md-4 col-sm-6">
                                        <div class="slot-item border rounded p-2 d-flex justify-content-between align-items-center">
                                            <div class="d-flex align-items-center">
                                                <i class="fas fa-square text-${getStatusColor(slot.status)} me-2"></i>
                                                <div>
                                                    <div class="fw-semibold">${slot.name || 'Unnamed Slot'}</div>
                                                    <small class="text-muted">${slot.fileCount || 0} fail</small>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary btn-sm" onclick="viewLocation('${slot.id}')" title="Lihat">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-warning btn-sm" onclick="editLocationForm('${slot.id}')" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-outline-danger btn-sm" onclick="deleteLocation('${slot.id}')" title="Padam">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            });
                            html += '</div>';
                        }
                        
                        html += '</div>';
                    });
                    html += '</div>';
                }
                
                html += '</div></div>';
            });

            html += '</div>';
            container.innerHTML = html;
        }

        // Get status color
        function getStatusColor(status) {
            switch (status) {
                case 'empty': return 'success';
                case 'occupied': return 'danger';
                case 'maintenance': return 'warning';
                default: return 'secondary';
            }
        }

        // Get status text
        function getStatusText(status) {
            switch (status) {
                case 'empty': return 'Kosong';
                case 'occupied': return 'Ada Fail';
                case 'maintenance': return 'Penyelenggaraan';
                default: return 'Tidak Diketahui';
            }
        }

        // Show create form
        window.showCreateForm = function(type = 'room', parentId = null) {
            document.getElementById('modalTitle').textContent = 'Tambah Lokasi Baharu';
            document.getElementById('editId').value = '';
            document.getElementById('parentId').value = parentId || '';
            document.getElementById('locationType').value = type;
            document.getElementById('locationName').value = '';
            document.getElementById('locationDescription').value = '';
            document.getElementById('locationStatus').value = 'empty';
            document.getElementById('isAvailable').checked = true;
            
            updateFormFields();
            new bootstrap.Modal(document.getElementById('locationModal')).show();
        };

        // Update form fields based on type
        window.updateFormFields = function() {
            const type = document.getElementById('locationType').value;
            const parentDiv = document.getElementById('parentSelectDiv');
            const parentSelect = document.getElementById('parentSelect');
            
            if (type === 'room') {
                parentDiv.style.display = 'none';
                document.getElementById('parentId').value = '';
            } else {
                parentDiv.style.display = 'block';
                loadParentOptions(type);
            }
        };

        // Load parent options
        async function loadParentOptions(childType) {
            const parentSelect = document.getElementById('parentSelect');
            parentSelect.innerHTML = '<option value="">Pilih parent...</option>';
            
            let parentType;
            if (childType === 'rack') parentType = 'room';
            if (childType === 'slot') parentType = 'rack';
            
            if (parentType) {
                const parents = locations.filter(loc => loc.type === parentType);
                parents.forEach(parent => {
                    const option = document.createElement('option');
                    option.value = parent.id;
                    option.textContent = parent.name;
                    parentSelect.appendChild(option);
                });
            }
        }

        // Save location
        window.saveLocation = async function() {
            const editId = document.getElementById('editId').value;
            const parentId = document.getElementById('parentId').value;
            const type = document.getElementById('locationType').value;
            const name = document.getElementById('locationName').value.trim();
            const description = document.getElementById('locationDescription').value.trim();
            const status = document.getElementById('locationStatus').value;
            const isAvailable = document.getElementById('isAvailable').checked;
            
            if (!name) {
                showMessage('Nama lokasi diperlukan', 'error');
                return;
            }
            
            try {
                showLoading();
                
                const locationData = {
                    name: name,
                    type: type,
                    parentId: parentId || null,
                    description: description,
                    status: status,
                    isAvailable: isAvailable,
                    sortOrder: locations.length + 1,
                    qrCode: generateQRCode()
                };
                
                if (editId) {
                    // Update existing location
                    locationData.updatedAt = serverTimestamp();
                    await updateDoc(doc(db, 'locations', editId), locationData);
                    showMessage('Lokasi berjaya dikemaskini');
                } else {
                    // Create new location
                    locationData.createdAt = serverTimestamp();
                    locationData.updatedAt = serverTimestamp();
                    await addDoc(collection(db, 'locations'), locationData);
                    showMessage('Lokasi baharu berjaya dicipta');
                }
                
                bootstrap.Modal.getInstance(document.getElementById('locationModal')).hide();
                await loadLocations();
                hideLoading();
            } catch (error) {
                console.error('Error saving location:', error);
                showMessage('Ralat menyimpan lokasi: ' + error.message, 'error');
                hideLoading();
            }
        };

        // Generate QR Code
        function generateQRCode() {
            return 'LOC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        }

        // View location details
        window.viewLocation = async function(locationId) {
            try {
                showLoading();
                currentViewingLocation = locationId;
                
                const location = locations.find(loc => loc.id === locationId);
                if (!location) {
                    showMessage('Lokasi tidak dijumpai', 'error');
                    hideLoading();
                    return;
                }
                
                // Update modal content
                document.getElementById('viewLocationName').textContent = location.name || 'Unnamed Location';
                document.getElementById('viewLocationBadge').textContent = getStatusText(location.status);
                document.getElementById('viewLocationBadge').className = `badge bg-${getStatusColor(location.status)} fs-6`;
                
                // Location details
                let detailsHtml = `
                    <table class="table table-borderless table-sm">
                        <tr><td><strong>Jenis:</strong></td><td>${location.type || 'N/A'}</td></tr>
                        <tr><td><strong>Status:</strong></td><td>${getStatusText(location.status)}</td></tr>
                        <tr><td><strong>Tersedia:</strong></td><td>${location.isAvailable ? 'Ya' : 'Tidak'}</td></tr>
                `;
                if (location.description) {
                    detailsHtml += `<tr><td><strong>Keterangan:</strong></td><td>${location.description}</td></tr>`;
                }
                detailsHtml += '</table>';
                document.getElementById('viewLocationDetails').innerHTML = detailsHtml;
                
                // QR Code
                if (location.qrCode) {
                    document.getElementById('viewLocationQR').innerHTML = `
                        <div class="qr-code-display">
                            <div class="border p-2 text-center bg-light">
                                <i class="fas fa-qrcode fa-3x mb-2"></i>
                                <div class="small">${location.qrCode}</div>
                            </div>
                        </div>
                    `;
                }
                
                // Load files for this location
                await loadLocationFiles(locationId);
                
                // Show modal
                new bootstrap.Modal(document.getElementById('viewLocationModal')).show();
                hideLoading();
            } catch (error) {
                console.error('Error viewing location:', error);
                showMessage('Ralat membuka butiran lokasi: ' + error.message, 'error');
                hideLoading();
            }
        };

        // Load files for a location
        async function loadLocationFiles(locationId) {
            try {
                const filesRef = collection(db, 'files');
                const q = query(filesRef, where('locationId', '==', locationId));
                const snapshot = await getDocs(q);
                
                const locationFiles = [];
                snapshot.forEach((doc) => {
                    locationFiles.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                document.getElementById('fileCount').textContent = locationFiles.length;
                
                const filesContainer = document.getElementById('filesContainer');
                if (locationFiles.length === 0) {
                    filesContainer.innerHTML = `
                        <div class="text-center py-4">
                            <i class="fas fa-folder-open fa-2x text-muted mb-3"></i>
                            <p class="text-muted">Tiada fail di lokasi ini</p>
                        </div>
                    `;
                } else {
                    let filesHtml = `
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>ID Fail</th>
                                        <th>Tajuk</th>
                                        <th>Status</th>
                                        <th>QR Code</th>
                                        <th>Tindakan</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;
                    
                    locationFiles.forEach(file => {
                        const qrCodeUrl = file.qrCode ? `https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${encodeURIComponent(file.qrCode)}` : null;
                        
                        filesHtml += `
                            <tr>
                                <td><strong class="text-primary">${file.fileId || 'N/A'}</strong></td>
                                <td>
                                    <div class="fw-semibold">${(file.title || 'Untitled').substring(0, 30)}${file.title && file.title.length > 30 ? '...' : ''}</div>
                                    ${file.department ? `<small class="text-muted">${file.department}</small>` : ''}
                                </td>
                                <td>
                                    <span class="badge bg-${file.status === 'tersedia' ? 'success' : file.status === 'dipinjam' ? 'warning' : 'secondary'}">
                                        ${file.status || 'N/A'}
                                    </span>
                                </td>
                                <td class="text-center">
                                    ${file.qrCode ? `
                                        <img src="${qrCodeUrl}" alt="QR Code" title="${file.qrCode}" style="width: 30px; height: 30px;">
                                        <div><small class="font-monospace text-muted">${file.qrCode}</small></div>
                                    ` : 'N/A'}
                                </td>
                                <td>
                                    <button class="btn btn-outline-primary btn-sm" onclick="viewFile('${file.id}')" title="Lihat">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                    
                    filesHtml += '</tbody></table></div>';
                    filesContainer.innerHTML = filesHtml;
                }
            } catch (error) {
                console.error('Error loading location files:', error);
                document.getElementById('filesContainer').innerHTML = `
                    <div class="text-center py-4 text-danger">
                        <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                        <p>Ralat memuat fail</p>
                    </div>
                `;
            }
        }

        // Edit location form
        window.editLocationForm = function(locationId) {
            const location = locations.find(loc => loc.id === locationId);
            if (!location) return;
            
            document.getElementById('modalTitle').textContent = 'Edit Lokasi';
            document.getElementById('editId').value = locationId;
            document.getElementById('parentId').value = location.parentId || '';
            document.getElementById('locationType').value = location.type || 'room';
            document.getElementById('locationName').value = location.name || '';
            document.getElementById('locationDescription').value = location.description || '';
            document.getElementById('locationStatus').value = location.status || 'empty';
            document.getElementById('isAvailable').checked = location.isAvailable !== false;
            
            updateFormFields();
            new bootstrap.Modal(document.getElementById('locationModal')).show();
        };

        // Delete location
        window.deleteLocation = async function(locationId) {
            const location = locations.find(loc => loc.id === locationId);
            if (!location) return;
            
            if (!confirm(`Adakah anda pasti mahu memadam lokasi "${location.name}"?`)) {
                return;
            }
            
            try {
                showLoading();
                
                // Check if location has children
                const hasChildren = locations.some(loc => loc.parentId === locationId);
                if (hasChildren) {
                    showMessage('Lokasi tidak boleh dipadam kerana masih mempunyai sub-lokasi', 'error');
                    hideLoading();
                    return;
                }
                
                // Check if location has files
                const filesRef = collection(db, 'files');
                const q = query(filesRef, where('locationId', '==', locationId));
                const snapshot = await getDocs(q);
                
                if (!snapshot.empty) {
                    showMessage('Lokasi tidak boleh dipadam kerana masih mengandungi fail', 'error');
                    hideLoading();
                    return;
                }
                
                await deleteDoc(doc(db, 'locations', locationId));
                showMessage('Lokasi berjaya dipadam');
                await loadLocations();
                hideLoading();
            } catch (error) {
                console.error('Error deleting location:', error);
                showMessage('Ralat memadam lokasi: ' + error.message, 'error');
                hideLoading();
            }
        };

        // Refresh data
        window.refreshData = function() {
            loadLocations();
        };

        // Filter locations
        window.filterLocations = function() {
            // This will be implemented for client-side filtering
            displayLocations();
        };

        // Clear filters
        window.clearFilters = function() {
            document.getElementById('searchInput').value = '';
            document.getElementById('typeFilter').value = '';
            document.getElementById('statusFilter').value = '';
            filterLocations();
        };

        // Edit location from view modal
        window.editLocation = function() {
            if (currentViewingLocation) {
                bootstrap.Modal.getInstance(document.getElementById('viewLocationModal')).hide();
                editLocationForm(currentViewingLocation);
            }
        };

        // Show add file form (placeholder)
        window.showAddFileForm = function() {
            if (currentViewingLocation) {
                showMessage('Fungsi tambah fail akan disediakan tidak lama lagi', 'info');
            }
        };

        // Show add file form
        window.showAddFileForm = function() {
            if (currentViewingLocation) {
                document.getElementById('fileLocationId').value = currentViewingLocation;
                
                // Set current date as default
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('fileCreatedDate').value = today;
                
                // Reset form
                document.getElementById('addFileForm').reset();
                document.getElementById('fileLocationId').value = currentViewingLocation;
                document.getElementById('fileCreatedDate').value = today;
                
                new bootstrap.Modal(document.getElementById('addFileModal')).show();
            }
        };

        // Generate QR Code
        function generateQRCode() {
            const timestamp = Date.now().toString();
            const random = Math.random().toString(36).substr(2, 9).toUpperCase();
            return `FILE_${timestamp}_${random}`;
        }

        // Generate File ID
        function generateFileId(department) {
            const year = new Date().getFullYear();
            const timestamp = Date.now().toString().slice(-6);
            const deptCodes = {
                'Pentadbiran Am': 'PA',
                'Kewangan': 'KW', 
                'Sumber Manusia': 'SM',
                'Teknologi Maklumat': 'TM',
                'Perundangan': 'PU',
                'Audit': 'AD',
                'Pembangunan': 'PB'
            };
            const deptCode = deptCodes[department] || 'UM';
            return `${deptCode}${year}${timestamp}`;
        }

        // Save new file
        window.saveNewFile = async function() {
            const title = document.getElementById('fileTitle').value.trim();
            const department = document.getElementById('fileDepartment').value;
            const category = document.getElementById('fileCategory').value;
            const classification = document.getElementById('fileClassification').value;
            const description = document.getElementById('fileDescription').value.trim();
            const createdDate = document.getElementById('fileCreatedDate').value;
            const expiryDate = document.getElementById('fileExpiryDate').value;
            const locationId = document.getElementById('fileLocationId').value;
            
            if (!title || !department || !locationId) {
                showMessage('Sila lengkapkan field yang diperlukan', 'error');
                return;
            }
            
            try {
                showLoading();
                
                const qrCode = generateQRCode();
                const fileId = generateFileId(department);
                
                const fileData = {
                    fileId: fileId,
                    title: title,
                    department: department,
                    category: category || 'Lain-lain',
                    classification: classification || 'Biasa',
                    description: description,
                    documentDate: createdDate,
                    expiryDate: expiryDate,
                    locationId: locationId,
                    status: 'tersedia',
                    qrCode: qrCode,
                    createdBy: currentUser.uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                
                await addDoc(collection(db, 'files'), fileData);
                
                showMessage(`Fail baharu berjaya dicipta dengan ID: ${fileId} dan QR Code: ${qrCode}`);
                
                bootstrap.Modal.getInstance(document.getElementById('addFileModal')).hide();
                
                // Refresh location files if viewing location
                if (currentViewingLocation === locationId) {
                    await loadLocationFiles(locationId);
                }
                
                // Refresh locations to update file counts
                await loadLocations();
                hideLoading();
            } catch (error) {
                console.error('Error saving file:', error);
                showMessage('Ralat menyimpan fail: ' + error.message, 'error');
                hideLoading();
            }
        };

        // Show QR scanner
        window.showQRScanner = function() {
            new bootstrap.Modal(document.getElementById('qrScannerModal')).show();
        };

        // Search by QR code
        window.searchByQRCode = async function() {
            const qrCode = document.getElementById('manualQRInput').value.trim();
            if (!qrCode) {
                showMessage('Sila masukkan kod QR', 'error');
                return;
            }
            
            try {
                showLoading();
                
                // First try to find file
                const filesRef = collection(db, 'files');
                const fileQuery = query(filesRef, where('qrCode', '==', qrCode));
                const fileSnapshot = await getDocs(fileQuery);
                
                if (!fileSnapshot.empty) {
                    const fileDoc = fileSnapshot.docs[0];
                    const fileData = fileDoc.data();
                    
                    showMessage(`Fail dijumpai: ${fileData.title} (ID: ${fileData.fileId})`);
                    
                    // Show file details and highlight location
                    if (fileData.locationId) {
                        viewLocation(fileData.locationId);
                    }
                    
                    bootstrap.Modal.getInstance(document.getElementById('qrScannerModal')).hide();
                    hideLoading();
                    return;
                }
                
                // Then try to find location
                const location = locations.find(loc => loc.qrCode === qrCode);
                if (location) {
                    showMessage(`Lokasi dijumpai: ${location.name}`);
                    viewLocation(location.id);
                    bootstrap.Modal.getInstance(document.getElementById('qrScannerModal')).hide();
                    hideLoading();
                    return;
                }
                
                showMessage('QR code tidak dijumpai dalam sistem', 'error');
                hideLoading();
            } catch (error) {
                console.error('Error searching QR code:', error);
                showMessage('Ralat mencari QR code: ' + error.message, 'error');
                hideLoading();
            }
        };

        // View file details
        window.viewFile = function(fileId) {
            // Find file from location files
            const filesContainer = document.getElementById('filesContainer');
            const tableRows = filesContainer.querySelectorAll('tr');
            let file = null;
            
            // Get file from current location files
            if (currentViewingLocation) {
                const filesRef = collection(db, 'files');
                const fileQuery = query(filesRef, where('locationId', '==', currentViewingLocation));
                getDocs(fileQuery).then(snapshot => {
                    snapshot.forEach(doc => {
                        if (doc.id === fileId) {
                            file = { id: doc.id, ...doc.data() };
                            showFileModal(file);
                        }
                    });
                });
            }
        };

        function showFileModal(file) {
            const qrCodeUrl = file.qrCode ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(file.qrCode)}` : null;
            
            let fileDetails = `
                <div class="modal fade" id="fileDetailsModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Butiran Fail: ${file.title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <table class="table table-borderless">
                                            <tr><td><strong>ID Fail:</strong></td><td>${file.fileId || 'N/A'}</td></tr>
                                            <tr><td><strong>Tajuk:</strong></td><td>${file.title}</td></tr>
                                            <tr><td><strong>Jabatan:</strong></td><td>${file.department}</td></tr>
                                            <tr><td><strong>Kategori:</strong></td><td>${file.category || 'N/A'}</td></tr>
                                            <tr><td><strong>Klasifikasi:</strong></td><td>${file.classification || 'Biasa'}</td></tr>
                                            <tr><td><strong>Status:</strong></td><td><span class="badge bg-${file.status === 'tersedia' ? 'success' : file.status === 'dipinjam' ? 'warning' : 'secondary'}">${file.status || 'N/A'}</span></td></tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6 text-center">
                                        <h6>QR Code</h6>
                                        ${qrCodeUrl ? `
                                            <img src="${qrCodeUrl}" alt="QR Code" class="img-fluid mb-2" style="max-width: 150px;">
                                            <div class="small font-monospace">${file.qrCode}</div>
                                            <div class="mt-2">
                                                <button class="btn btn-outline-primary btn-sm" onclick="downloadQRCode('${qrCodeUrl}', '${file.fileId}')">
                                                    <i class="fas fa-download me-1"></i>Download QR
                                                </button>
                                            </div>
                                        ` : '<p class="text-muted">QR Code tidak tersedia</p>'}
                                    </div>
                                </div>
                                ${file.description ? `<div class="mt-3"><strong>Keterangan:</strong><br>${file.description}</div>` : ''}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Tutup</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            const existingModal = document.getElementById('fileDetailsModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', fileDetails);
            
            // Show modal
            new bootstrap.Modal(document.getElementById('fileDetailsModal')).show();
        }

        // Download QR Code
        window.downloadQRCode = function(qrCodeUrl, fileId) {
            const link = document.createElement('a');
            link.href = qrCodeUrl;
            link.download = `QR_${fileId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

    </script>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>