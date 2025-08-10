// Firebase configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyDVHVJlKBIqBtly_pPg8E9vg8kOb_Cv6vk",
    authDomain: "sistem-penyimpanan-fail-tongod.firebaseapp.com",
    projectId: "sistem-penyimpanan-fail-tongod",
    storageBucket: "sistem-penyimpanan-fail-tongod.firebasestorage.app",
    messagingSenderId: "639209872138",
    appId: "1:639209872138:web:c408eb225a2a7f9c8f38f3",
    measurementId: "G-RCL11KM20J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
import { enableNetwork, disableNetwork } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Handle online/offline status
window.addEventListener('online', () => {
    enableNetwork(db).catch((error) => {
        console.error('Failed to enable network:', error);
    });
});

window.addEventListener('offline', () => {
    disableNetwork(db).catch((error) => {
        console.error('Failed to disable network:', error);
    });
});

// Development environment setup (uncomment for local testing)
/*
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    try {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectStorageEmulator(storage, 'localhost', 9199);
        console.log('Connected to Firebase emulators');
    } catch (error) {
        console.warn('Firebase emulators already connected or unavailable:', error);
    }
}
*/

export default app;