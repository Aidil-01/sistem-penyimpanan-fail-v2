// PWA Install Prompt Handler
let deferredPrompt;
let installPromptShown = false;

// Check if app is already installed
function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Show install banner
function showInstallBanner() {
    if (installPromptShown || isAppInstalled()) {
        return;
    }

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
        <div class="pwa-install-banner">
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">
                    <i class="fas fa-mobile-alt"></i>
                </div>
                <div class="pwa-banner-text">
                    <strong>Pasang SPF Tongod</strong>
                    <p>Pasang aplikasi untuk akses pantas dan offline</p>
                </div>
                <div class="pwa-banner-actions">
                    <button class="btn btn-primary btn-sm me-2" id="pwa-install-btn">
                        <i class="fas fa-download me-1"></i>Pasang
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" id="pwa-dismiss-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add CSS for the banner
    const style = document.createElement('style');
    style.textContent = `
        .pwa-install-banner {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideUp 0.3s ease-out;
            border: 1px solid #e2e8f0;
        }
        
        .pwa-banner-content {
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .pwa-banner-icon {
            color: #2563eb;
            font-size: 24px;
            min-width: 32px;
        }
        
        .pwa-banner-text {
            flex: 1;
            min-width: 0;
        }
        
        .pwa-banner-text strong {
            color: #1e293b;
            font-size: 14px;
            display: block;
            margin-bottom: 2px;
        }
        
        .pwa-banner-text p {
            color: #64748b;
            font-size: 12px;
            margin: 0;
        }
        
        .pwa-banner-actions {
            display: flex;
            align-items: center;
        }
        
        @keyframes slideUp {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @media (max-width: 768px) {
            .pwa-install-banner {
                left: 10px;
                right: 10px;
                bottom: 10px;
            }
            
            .pwa-banner-content {
                padding: 12px;
                gap: 8px;
            }
            
            .pwa-banner-text strong {
                font-size: 13px;
            }
            
            .pwa-banner-text p {
                font-size: 11px;
            }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Handle install button click
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('PWA install prompt:', outcome);
            deferredPrompt = null;
        }
        hideBanner();
    });

    // Handle dismiss button click
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
        hideBanner();
        localStorage.setItem('pwa-install-dismissed', Date.now());
    });

    installPromptShown = true;
}

// Hide install banner
function hideBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
        banner.style.animation = 'slideUp 0.3s ease-out reverse';
        setTimeout(() => banner.remove(), 300);
    }
}

// Show iOS install instructions
function showIOSInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS && isSafari && !isAppInstalled()) {
        const banner = document.createElement('div');
        banner.id = 'ios-install-banner';
        banner.innerHTML = `
            <div class="pwa-install-banner">
                <div class="pwa-banner-content">
                    <div class="pwa-banner-icon">
                        <i class="fab fa-apple"></i>
                    </div>
                    <div class="pwa-banner-text">
                        <strong>Pasang SPF Tongod</strong>
                        <p>Tekan <i class="fas fa-share" style="font-size: 12px;"></i> kemudian "Add to Home Screen"</p>
                    </div>
                    <div class="pwa-banner-actions">
                        <button class="btn btn-outline-secondary btn-sm" id="ios-dismiss-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        document.getElementById('ios-dismiss-btn').addEventListener('click', () => {
            banner.remove();
            localStorage.setItem('ios-install-dismissed', Date.now());
        });
        
        setTimeout(() => {
            if (banner.parentNode) {
                banner.remove();
            }
        }, 10000); // Auto-hide after 10 seconds
    }
}

// Check if we should show install prompts
function checkInstallPrompt() {
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    const iosDismissedTime = localStorage.getItem('ios-install-dismissed');
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    // Don't show if dismissed recently
    if (dismissedTime && parseInt(dismissedTime) > oneDayAgo) {
        return;
    }
    
    if (iosDismissedTime && parseInt(iosDismissedTime) > oneDayAgo) {
        return;
    }
    
    // Show appropriate install prompt
    if (deferredPrompt) {
        setTimeout(showInstallBanner, 3000); // Show after 3 seconds
    } else {
        setTimeout(showIOSInstallInstructions, 3000);
    }
}

// Event listeners
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    checkInstallPrompt();
});

window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
    hideBanner();
    
    // Show thank you message
    if (window.bootstrap && bootstrap.Toast) {
        const toastEl = document.createElement('div');
        toastEl.className = 'toast';
        toastEl.innerHTML = `
            <div class="toast-header bg-success text-white">
                <i class="fas fa-check-circle me-2"></i>
                <strong class="me-auto">Berjaya Dipasang</strong>
            </div>
            <div class="toast-body">
                SPF Tongod berjaya dipasang pada peranti anda!
            </div>
        `;
        document.body.appendChild(toastEl);
        
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
        
        setTimeout(() => toastEl.remove(), 5000);
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkInstallPrompt, 2000);
    });
} else {
    setTimeout(checkInstallPrompt, 2000);
}

// Export for manual trigger
window.PWAInstall = {
    showPrompt: showInstallBanner,
    isInstalled: isAppInstalled
};