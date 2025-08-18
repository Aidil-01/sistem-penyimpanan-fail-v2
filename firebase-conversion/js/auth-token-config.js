// Firebase Authentication Token Configuration
// Supports token-based authentication and skip-login functionality

import { auth, db } from './firebase-config.js';
import { 
    signInWithCustomToken,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    getDoc, 
    setDoc, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class TokenAuthManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.authToken = null;
        this.skipLogin = false;
        this.initializeTokenAuth();
    }

    initializeTokenAuth() {
        // Check for skip-login flag
        const urlParams = new URLSearchParams(window.location.search);
        this.skipLogin = urlParams.get('skip-login') === 'true' || 
                        localStorage.getItem('skipLogin') === 'true';

        // Check for stored auth token
        this.authToken = localStorage.getItem('firebaseAuthToken');

        if (this.skipLogin && this.authToken) {
            this.authenticateWithToken();
        } else {
            this.initializeStandardAuth();
        }
    }

    async authenticateWithToken() {
        try {
            console.log('🔑 Authenticating with stored token...');
            const userCredential = await signInWithCustomToken(auth, this.authToken);
            console.log('✅ Token authentication successful');
            return userCredential.user;
        } catch (error) {
            console.error('❌ Token authentication failed:', error);
            // Fallback to standard authentication
            this.clearStoredToken();
            this.initializeStandardAuth();
        }
    }

    initializeStandardAuth() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserProfile();
                await this.updateLastLogin();
                
                // Store token for future use if skip-login is enabled
                if (this.skipLogin) {
                    await this.storeAuthToken(user);
                }
                
                this.showApp();
            } else {
                this.currentUser = null;
                this.userProfile = null;
                this.clearStoredToken();
                
                if (!this.skipLogin) {
                    this.showAuth();
                } else {
                    console.log('⚠️ Skip login enabled but no valid token found');
                    this.showAuth();
                }
            }
        });
    }

    async storeAuthToken(user) {
        try {
            // Get custom token from your backend or Firebase Admin SDK
            const token = await this.getCustomToken(user);
            if (token) {
                localStorage.setItem('firebaseAuthToken', token);
                localStorage.setItem('skipLogin', 'true');
                console.log('🔐 Auth token stored for future use');
            }
        } catch (error) {
            console.error('Error storing auth token:', error);
        }
    }

    async getCustomToken(user) {
        try {
            // This would typically call your backend to generate a custom token
            // For now, we'll use the ID token as a fallback
            const idToken = await user.getIdToken();
            return idToken;
        } catch (error) {
            console.error('Error getting custom token:', error);
            return null;
        }
    }

    clearStoredToken() {
        localStorage.removeItem('firebaseAuthToken');
        localStorage.removeItem('skipLogin');
        this.authToken = null;
    }

    async loadUserProfile() {
        if (!this.currentUser) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
            if (userDoc.exists()) {
                this.userProfile = userDoc.data();
                this.updateUserDisplay();
                this.updateNavigationByRole();
            } else {
                await this.createUserProfile();
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.showAlert('Ralat memuatkan profil pengguna', 'error');
        }
    }

    async createUserProfile() {
        const defaultProfile = {
            name: this.currentUser.displayName || this.currentUser.email,
            email: this.currentUser.email,
            role: 'user_view',
            department: 'Pentadbiran',
            position: 'Pegawai',
            phone: '',
            is_active: true,
            auth_method: this.skipLogin ? 'token' : 'standard',
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        };

        try {
            await setDoc(doc(db, 'users', this.currentUser.uid), defaultProfile);
            this.userProfile = defaultProfile;
            this.updateUserDisplay();
            this.updateNavigationByRole();
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    }

    async updateLastLogin() {
        if (!this.currentUser) return;

        try {
            const loginData = {
                last_login: serverTimestamp(),
                last_ip: await this.getUserIP(),
                auth_method: this.skipLogin ? 'token' : 'standard',
                skip_login_enabled: this.skipLogin
            };

            await setDoc(doc(db, 'users', this.currentUser.uid), loginData, { merge: true });
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }

    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'unknown';
        }
    }

    async logout() {
        try {
            if (this.currentUser) {
                await this.logActivity('logout', `Pengguna ${this.currentUser.email} log keluar dari sistem`);
            }
            
            // Clear stored token on logout
            this.clearStoredToken();
            
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw 'Ralat semasa log keluar';
        }
    }

    async logActivity(action, description, subject = null, properties = {}) {
        if (!this.currentUser) return;

        try {
            const activityData = {
                user_id: this.currentUser.uid,
                user_email: this.currentUser.email,
                action: action,
                description: description,
                subject_type: subject ? subject.type : null,
                subject_id: subject ? subject.id : null,
                properties: {
                    ...properties,
                    auth_method: this.skipLogin ? 'token' : 'standard',
                    skip_login_enabled: this.skipLogin
                },
                ip_address: await this.getUserIP(),
                user_agent: navigator.userAgent,
                timestamp: serverTimestamp()
            };

            await setDoc(doc(db, 'activity_logs', `${Date.now()}_${this.currentUser.uid}`), activityData);
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    updateUserDisplay() {
        if (!this.userProfile) return;

        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        const authMethodEl = document.getElementById('authMethod');

        if (userNameEl) userNameEl.textContent = this.userProfile.name;
        if (userRoleEl) userRoleEl.textContent = this.getRoleDisplay(this.userProfile.role);
        if (authMethodEl) {
            authMethodEl.textContent = this.skipLogin ? '🔑 Token Auth' : '🔐 Standard Auth';
            authMethodEl.className = this.skipLogin ? 'badge bg-success' : 'badge bg-primary';
        }
    }

    getRoleDisplay(role) {
        const roles = {
            'admin': 'Pentadbir Sistem',
            'staff_jabatan': 'Pegawai Jabatan',
            'staff_pembantu': 'Pembantu Tadbir',
            'user_view': 'Pengguna Lihat Sahaja'
        };
        return roles[role] || role;
    }

    updateNavigationByRole() {
        if (!this.userProfile) return;

        const role = this.userProfile.role;
        const navItems = document.querySelectorAll('#navigationMenu .nav-item');

        navItems.forEach(item => {
            const link = item.querySelector('.nav-link');
            const page = link.getAttribute('data-page');

            switch (page) {
                case 'dashboard':
                    item.style.display = 'block';
                    break;
                case 'files':
                    item.style.display = 'block';
                    break;
                case 'locations':
                    item.style.display = ['admin', 'staff_jabatan', 'staff_pembantu'].includes(role) ? 'block' : 'none';
                    break;
                case 'borrowings':
                    item.style.display = ['admin', 'staff_jabatan', 'staff_pembantu'].includes(role) ? 'block' : 'none';
                    break;
                case 'reports':
                    item.style.display = ['admin', 'staff_jabatan'].includes(role) ? 'block' : 'none';
                    break;
                case 'users':
                    item.style.display = role === 'admin' ? 'block' : 'none';
                    break;
            }
        });
    }

    showApp() {
        document.getElementById('loadingScreen')?.classList.add('d-none');
        document.getElementById('authContainer')?.classList.add('d-none');
        document.getElementById('appContainer')?.classList.remove('d-none');
        
        // Show authentication method indicator
        this.showAuthMethodIndicator();
    }

    showAuth() {
        document.getElementById('loadingScreen')?.classList.add('d-none');
        document.getElementById('appContainer')?.classList.add('d-none');
        document.getElementById('authContainer')?.classList.remove('d-none');
    }

    showAuthMethodIndicator() {
        const indicator = document.getElementById('authMethodIndicator');
        if (indicator) {
            const method = this.skipLogin ? 'Token Authentication' : 'Standard Authentication';
            const status = this.skipLogin ? 'Login Skipped' : 'Manual Login';
            const icon = this.skipLogin ? '🔑' : '🔐';
            
            indicator.innerHTML = `
                <div class="alert alert-info alert-dismissible fade show" role="alert">
                    ${icon} <strong>${method}</strong> - ${status}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
        }
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 
                          type === 'warning' ? 'alert-warning' : 'alert-info';
        
        const icon = type === 'error' ? 'fa-exclamation-circle' :
                    type === 'success' ? 'fa-check-circle' :
                    type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';

        const alertHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="fas ${icon} me-2"></i>${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.innerHTML = alertHtml;
        
        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }

    // Public API methods
    enableSkipLogin() {
        this.skipLogin = true;
        localStorage.setItem('skipLogin', 'true');
        console.log('✅ Skip login enabled');
    }

    disableSkipLogin() {
        this.skipLogin = false;
        this.clearStoredToken();
        console.log('❌ Skip login disabled');
    }

    isTokenAuth() {
        return this.skipLogin && this.authToken;
    }

    getAuthStatus() {
        return {
            isAuthenticated: !!this.currentUser,
            authMethod: this.skipLogin ? 'token' : 'standard',
            skipLoginEnabled: this.skipLogin,
            hasStoredToken: !!this.authToken,
            user: this.currentUser,
            profile: this.userProfile
        };
    }
}

// Initialize token auth manager
const tokenAuthManager = new TokenAuthManager();

// Setup skip-login controls
document.addEventListener('DOMContentLoaded', () => {
    // Add skip-login toggle
    const skipLoginToggle = document.getElementById('skipLoginToggle');
    if (skipLoginToggle) {
        skipLoginToggle.checked = tokenAuthManager.skipLogin;
        skipLoginToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                tokenAuthManager.enableSkipLogin();
            } else {
                tokenAuthManager.disableSkipLogin();
            }
        });
    }

    // Add auth status display
    const authStatusBtn = document.getElementById('authStatusBtn');
    if (authStatusBtn) {
        authStatusBtn.addEventListener('click', () => {
            const status = tokenAuthManager.getAuthStatus();
            console.log('🔍 Auth Status:', status);
            tokenAuthManager.showAlert(
                `Auth Method: ${status.authMethod.toUpperCase()} | Skip Login: ${status.skipLoginEnabled ? 'Enabled' : 'Disabled'}`,
                'info'
            );
        });
    }

    // Setup logout with token clearing
    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await tokenAuthManager.logout();
        } catch (error) {
            tokenAuthManager.showAlert(error, 'error');
        }
    });
});

export default tokenAuthManager;