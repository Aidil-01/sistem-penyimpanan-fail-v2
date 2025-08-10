// Service Worker for PWA functionality
const CACHE_NAME = 'spf-tongod-v1.0.0';
const STATIC_CACHE = 'spf-static-v1.0.0';
const DYNAMIC_CACHE = 'spf-dynamic-v1.0.0';

// Files to cache immediately (Static Assets)
const STATIC_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/css/style.css',
    '/js/firebase-config.js',
    '/js/auth.js',
    '/js/models.js',
    '/js/app.js',
    '/js/pwa-install.js',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
    '/assets/icons/favicon.ico',
    '/offline.html',
    // External CDN assets (cached for offline use)
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Firebase SDK files (will be cached dynamically)
const FIREBASE_FILES = [
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'
];

// API endpoints to cache (for offline data access)
const API_CACHE_PATTERNS = [
    /^https:\/\/.*\.firebaseio\.com\/.*/,
    /^https:\/\/.*\.googleapis\.com\/.*/,
    /^https:\/\/firestore\.googleapis\.com\/.*/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            }),
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all clients
            self.clients.claim()
        ])
    );
});

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle different types of requests
    if (isStaticAsset(request)) {
        event.respondWith(cacheFirst(request));
    } else if (isFirebaseAPI(request)) {
        event.respondWith(networkFirst(request));
    } else if (isExternalAPI(request)) {
        event.respondWith(staleWhileRevalidate(request));
    } else {
        event.respondWith(networkFirstWithFallback(request));
    }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync-files') {
        event.waitUntil(syncOfflineActions());
    }
});

// Push notifications (future feature)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push message received');
    
    const options = {
        body: event.data ? event.data.text() : 'Notifikasi baru dari SPF Tongod',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-192x192.png',
        vibrate: [200, 100, 200],
        tag: 'spf-notification',
        actions: [
            {
                action: 'view',
                title: 'Lihat',
                icon: '/assets/icons/icon-192x192.png'
            },
            {
                action: 'dismiss',
                title: 'Tutup'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('SPF Tongod', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Helper Functions

function isStaticAsset(request) {
    return STATIC_FILES.includes(request.url) || 
           request.url.includes('.css') || 
           request.url.includes('.js') || 
           request.url.includes('.png') || 
           request.url.includes('.ico') ||
           request.url.includes('fonts.googleapis.com') ||
           request.url.includes('cdnjs.cloudflare.com') ||
           request.url.includes('cdn.jsdelivr.net');
}

function isFirebaseAPI(request) {
    return FIREBASE_FILES.some(pattern => request.url.includes(pattern)) ||
           request.url.includes('firebaseio.com') ||
           request.url.includes('firestore.googleapis.com') ||
           request.url.includes('firebase-storage.googleapis.com');
}

function isExternalAPI(request) {
    return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

// Caching Strategies

// Cache First - for static assets
async function cacheFirst(request) {
    const cached = await caches.match(request);
    return cached || fetch(request).then((response) => {
        if (response.ok) {
            const cache = caches.open(STATIC_CACHE);
            cache.then(c => c.put(request, response.clone()));
        }
        return response;
    }).catch(() => {
        // Return offline page for navigation requests
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }
    });
}

// Network First - for Firebase API calls
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        
        if (cached) {
            return cached;
        }
        
        // Return offline response for document requests
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
}

// Stale While Revalidate - for external APIs
async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);
    const networkResponsePromise = fetch(request).then((response) => {
        if (response.ok) {
            const cache = caches.open(DYNAMIC_CACHE);
            cache.then(c => c.put(request, response.clone()));
        }
        return response;
    });

    return cached || networkResponsePromise;
}

// Network First with Fallback - for app pages
async function networkFirstWithFallback(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok && request.destination === 'document') {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Try cache first
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        
        // Return offline page for navigation requests
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
}

// Offline action synchronization
async function syncOfflineActions() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        
        // Process any offline actions stored in IndexedDB
        // This would include file creation, updates, borrowing records, etc.
        console.log('Service Worker: Syncing offline actions...');
        
        // Implementation would depend on how offline actions are stored
        // For now, just log the action
        
        return Promise.resolve();
    } catch (error) {
        console.error('Service Worker: Failed to sync offline actions:', error);
        return Promise.reject(error);
    }
}

// Cache management - clean up old entries
setInterval(async () => {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        
        // Keep only the last 50 dynamic cache entries
        if (requests.length > 50) {
            const entriesToDelete = requests.slice(0, requests.length - 50);
            await Promise.all(
                entriesToDelete.map(request => cache.delete(request))
            );
            console.log(`Service Worker: Cleaned up ${entriesToDelete.length} cache entries`);
        }
    } catch (error) {
        console.error('Service Worker: Cache cleanup failed:', error);
    }
}, 60000); // Run every minute

// Message handling (for communication with main app)
self.addEventListener('message', (event) => {
    const { action, data } = event.data;
    
    switch (action) {
        case 'skipWaiting':
            self.skipWaiting();
            break;
        case 'clearCache':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
        case 'getCacheSize':
            getCacheSize().then((size) => {
                event.ports[0].postMessage({ size });
            });
            break;
        default:
            console.log('Service Worker: Unknown message action:', action);
    }
});

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }
    
    return totalSize;
}