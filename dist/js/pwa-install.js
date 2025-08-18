// PWA Installation and Management
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.isInstalled = false;
        this.init();
    }

    init() {
        this.checkInstallation();
        this.setupEventListeners();
        this.createInstallUI();
        this.setupUpdateChecker();
    }

    checkInstallation() {
        // Check if app is running in standalone mode (installed as PWA)
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone ||
                          document.referrer.includes('android-app://');
        
        console.log('PWA Installation status:', this.isInstalled ? 'Installed' : 'Not installed');
    }

    setupEventListeners() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA: beforeinstallprompt event fired');
            
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            
            // Save the event so it can be triggered later
            this.deferredPrompt = e;
            
            // Show install button if not already installed
            if (!this.isInstalled) {
                // Delay showing install button to avoid issues
                setTimeout(() => {
                    this.showInstallButton();
                }, 1000);
            }
        });

        // Listen for appinstalled event
        window.addEventListener('appinstalled', (e) => {
            console.log('PWA: App was successfully installed');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showSuccessMessage();
            this.deferredPrompt = null;
        });

        // Handle install button click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'pwaInstallBtn' || e.target.closest('#pwaInstallBtn')) {
                this.showInstallPrompt();
            }
        });

        // Handle service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('PWA: Service Worker updated, reloading page');
                window.location.reload();
            });
        }
    }

    createInstallUI() {
        // Create install banner (only show if not installed and prompt available)
        if (!this.isInstalled && !document.getElementById('pwaInstallBanner')) {
            const banner = document.createElement('div');
            banner.id = 'pwaInstallBanner';
            banner.className = 'd-none alert alert-info alert-dismissible fade show position-fixed';
            banner.style.cssText = `
                top: 0;
                left: 0;
                right: 0;
                z-index: 9999;
                margin: 0;
                border-radius: 0;
                border: none;
            `;
            
            banner.innerHTML = `
                <div class="container-fluid">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-mobile-alt me-2"></i>
                        <div class="flex-grow-1">
                            <strong>Pasang SPF Tongod</strong>
                            <small class="d-block">Akses pantas dan kerja offline dengan aplikasi mobile</small>
                        </div>
                        <button type="button" class="btn btn-sm btn-light me-2" id="pwaInstallBtn">
                            <i class="fas fa-download me-1"></i>Pasang
                        </button>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                </div>
            `;
            
            document.body.insertBefore(banner, document.body.firstChild);
        }

        // Create install button in navigation (for later use)
        this.addInstallButtonToNav();
    }

    addInstallButtonToNav() {
        const nav = document.querySelector('.navbar .navbar-nav');
        if (nav && !document.getElementById('navPwaInstall') && !this.isInstalled) {
            const installNavItem = document.createElement('div');
            installNavItem.id = 'navPwaInstall';
            installNavItem.className = 'nav-item d-none';
            installNavItem.innerHTML = `
                <a class="nav-link" href="#" id="navInstallBtn">
                    <i class="fas fa-download me-1"></i>
                    <span class="d-none d-lg-inline">Pasang App</span>
                </a>
            `;
            
            nav.insertBefore(installNavItem, nav.firstChild);
            
            // Add click handler
            installNavItem.addEventListener('click', (e) => {
                e.preventDefault();
                this.showInstallPrompt();
            });
        }
    }

    showInstallButton() {
        // Show install banner
        const banner = document.getElementById('pwaInstallBanner');
        if (banner) {
            banner.classList.remove('d-none');
        }

        // Show nav install button
        const navInstall = document.getElementById('navPwaInstall');
        if (navInstall) {
            navInstall.classList.remove('d-none');
        }
    }

    hideInstallButton() {
        // Hide install banner
        const banner = document.getElementById('pwaInstallBanner');
        if (banner) {
            banner.remove();
        }

        // Hide nav install button
        const navInstall = document.getElementById('navPwaInstall');
        if (navInstall) {
            navInstall.classList.add('d-none');
        }
    }

    async showInstallPrompt() {
        if (!this.deferredPrompt) {
            console.log('PWA: Install prompt not available');
            this.showManualInstallInstructions();
            return;
        }

        try {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log(`PWA: User response to install prompt: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('PWA: User accepted the install prompt');
            } else {
                console.log('PWA: User dismissed the install prompt');
                this.showInstallReminder();
            }
            
            // Clear the deferredPrompt
            this.deferredPrompt = null;
            this.hideInstallButton();
            
        } catch (error) {
            console.error('PWA: Error showing install prompt:', error);
            this.showManualInstallInstructions();
        }
    }

    showManualInstallInstructions() {
        const userAgent = navigator.userAgent;
        let instructions = '';
        
        if (/Android/i.test(userAgent)) {
            if (/Chrome/i.test(userAgent)) {
                instructions = `
                    <p><strong>Untuk memasang aplikasi di Android Chrome:</strong></p>
                    <ol>
                        <li>Tap menu (3 titik) di sudut kanan atas</li>
                        <li>Pilih "Add to Home screen" atau "Install app"</li>
                        <li>Tap "Add" untuk memasang</li>
                    </ol>
                `;
            } else {
                instructions = `
                    <p><strong>Untuk pengalaman terbaik:</strong></p>
                    <p>Sila buka laman ini menggunakan Chrome browser untuk memasang aplikasi.</p>
                `;
            }
        } else if (/iPad|iPhone|iPod/.test(userAgent)) {
            instructions = `
                <p><strong>Untuk memasang aplikasi di iOS:</strong></p>
                <ol>
                    <li>Tap butang Share <i class="fas fa-share"></i> di Safari</li>
                    <li>Pilih "Add to Home Screen"</li>
                    <li>Tap "Add" untuk memasang</li>
                </ol>
            `;
        } else {
            instructions = `
                <p><strong>Untuk memasang aplikasi di desktop:</strong></p>
                <ol>
                    <li>Klik ikon install di address bar</li>
                    <li>Atau gunakan Chrome menu > "Install SPF Tongod..."</li>
                </ol>
            `;
        }

        this.showModal('Pasang Aplikasi', instructions);
    }

    showInstallReminder() {
        setTimeout(() => {
            const reminder = document.createElement('div');
            reminder.className = 'toast position-fixed bottom-0 end-0 m-3';
            reminder.setAttribute('role', 'alert');
            reminder.innerHTML = `
                <div class="toast-header">
                    <i class="fas fa-mobile-alt me-2"></i>
                    <strong class="me-auto">SPF Tongod</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    Anda boleh memasang aplikasi ini untuk akses yang lebih pantas!
                </div>
            `;
            
            document.body.appendChild(reminder);
            
            const toast = new bootstrap.Toast(reminder);
            toast.show();
            
            // Remove after hiding
            reminder.addEventListener('hidden.bs.toast', () => {
                reminder.remove();
            });
        }, 5000);
    }

    showSuccessMessage() {
        const success = document.createElement('div');
        success.className = 'toast position-fixed bottom-0 end-0 m-3';
        success.innerHTML = `
            <div class="toast-header bg-success text-white">
                <i class="fas fa-check-circle me-2"></i>
                <strong class="me-auto">Berjaya!</strong>
            </div>
            <div class="toast-body">
                SPF Tongod telah dipasang sebagai aplikasi. Cari ikon aplikasi di skrin utama anda.
            </div>
        `;
        
        document.body.appendChild(success);
        
        const toast = new bootstrap.Toast(success);
        toast.show();
        
        success.addEventListener('hidden.bs.toast', () => {
            success.remove();
        });
    }

    setupUpdateChecker() {
        // Check for updates every 30 minutes
        setInterval(() => {
            this.checkForUpdates();
        }, 30 * 60 * 1000);

        // Check on visibility change (when user returns to app)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });
    }

    async checkForUpdates() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    await registration.update();
                    console.log('PWA: Checked for updates');
                }
            } catch (error) {
                console.error('PWA: Failed to check for updates:', error);
            }
        }
    }

    showModal(title, content) {
        // Remove existing modal if any
        const existingModal = document.getElementById('pwaModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHtml = `
            <div class="modal fade" id="pwaModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('pwaModal'));
        modal.show();

        // Remove modal from DOM when hidden
        document.getElementById('pwaModal').addEventListener('hidden.bs.modal', (e) => {
            e.target.remove();
        });
    }

    // Public methods for external use
    getInstallationStatus() {
        return {
            isInstalled: this.isInstalled,
            canInstall: !!this.deferredPrompt,
            isStandalone: window.matchMedia('(display-mode: standalone)').matches
        };
    }

    async getCacheInfo() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            return new Promise((resolve) => {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data);
                };
                
                navigator.serviceWorker.controller.postMessage(
                    { action: 'getCacheSize' },
                    [messageChannel.port2]
                );
            });
        }
        return null;
    }

    async clearCache() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            return new Promise((resolve) => {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.success);
                };
                
                navigator.serviceWorker.controller.postMessage(
                    { action: 'clearCache' },
                    [messageChannel.port2]
                );
            });
        }
        return false;
    }
}

// Initialize PWA installer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        window.pwaInstaller = new PWAInstaller();
    }
});

// Export for use in other modules
window.PWAInstaller = PWAInstaller;