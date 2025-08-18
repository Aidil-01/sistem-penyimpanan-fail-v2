// Authentication module
import { auth, db, googleProvider } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.initializeAuth();
    }

    initializeAuth() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserProfile();
                await this.updateLastLogin();
                this.showApp();
            } else {
                this.currentUser = null;
                this.userProfile = null;
                this.showAuth();
            }
        });
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
                // Create user profile if doesn't exist
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
            role: 'user_view', // Default role
            department: 'Pentadbiran',
            position: 'Pegawai',
            phone: '',
            is_active: true,
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
            await updateDoc(doc(db, 'users', this.currentUser.uid), {
                last_login: serverTimestamp(),
                last_ip: await this.getUserIP()
            });
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

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Log login activity
            await this.logActivity('login', `Pengguna ${email} log masuk ke sistem`);
            
            return userCredential.user;
        } catch (error) {
            console.error('Login error:', error);
            throw this.getAuthErrorMessage(error.code);
        }
    }

    async register(email, password, name, department = 'Pentadbiran', role = 'user_view') {
        try {
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update display name
            await updateProfile(user, {
                displayName: name
            });

            // Send email verification
            await sendEmailVerification(user);

            // Create user profile in Firestore
            const userProfile = {
                name: name,
                email: email,
                role: role,
                department: department,
                position: 'Pegawai',
                phone: '',
                is_active: true,
                email_verified: false,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            };

            await setDoc(doc(db, 'users', user.uid), userProfile);

            // Log registration activity
            await this.logActivity('register', `Pengguna baharu ${email} didaftarkan`);

            return {
                user: user,
                message: 'Akaun berjaya dibuat. Sila semak e-mel untuk pengesahan.'
            };
        } catch (error) {
            console.error('Registration error:', error);
            throw this.getAuthErrorMessage(error.code);
        }
    }

    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            
            // Log login activity
            await this.logActivity('google_login', `Pengguna ${result.user.email} log masuk dengan Google`);
            
            return result.user;
        } catch (error) {
            console.error('Google login error:', error);
            throw this.getAuthErrorMessage(error.code);
        }
    }

    async logout() {
        try {
            if (this.currentUser) {
                await this.logActivity('logout', `Pengguna ${this.currentUser.email} log keluar dari sistem`);
            }
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw 'Ralat semasa log keluar';
        }
    }

    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return 'E-mel tetapan semula kata laluan telah dihantar';
        } catch (error) {
            console.error('Password reset error:', error);
            throw this.getAuthErrorMessage(error.code);
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
                properties: properties,
                ip_address: await this.getUserIP(),
                user_agent: navigator.userAgent,
                timestamp: serverTimestamp()
            };

            await setDoc(doc(db, 'activity_logs', `${Date.now()}_${this.currentUser.uid}`), activityData);
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    getAuthErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'Pengguna tidak dijumpai',
            'auth/wrong-password': 'Kata laluan tidak betul',
            'auth/invalid-email': 'Format e-mel tidak sah',
            'auth/invalid-credential': 'E-mel atau kata laluan tidak betul',
            'auth/user-disabled': 'Akaun pengguna telah dinonaktifkan',
            'auth/too-many-requests': 'Terlalu banyak percubaan. Cuba lagi kemudian',
            'auth/network-request-failed': 'Ralat rangkaian. Periksa sambungan internet',
            'auth/email-already-in-use': 'E-mel ini telah digunakan',
            'auth/weak-password': 'Kata laluan terlalu lemah. Minimum 6 aksara',
            'auth/popup-closed-by-user': 'Log masuk Google dibatalkan',
            'auth/popup-blocked': 'Popup disekat. Sila aktifkan popup untuk log masuk Google',
            'auth/cancelled-popup-request': 'Permintaan log masuk dibatalkan',
            'auth/operation-not-allowed': 'Kaedah log masuk ini tidak dibenarkan'
        };
        return errorMessages[errorCode] || `Ralat tidak diketahui: ${errorCode}`;
    }

    updateUserDisplay() {
        if (!this.userProfile) return;

        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');

        if (userNameEl) userNameEl.textContent = this.userProfile.name;
        if (userRoleEl) userRoleEl.textContent = this.getRoleDisplay(this.userProfile.role);
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

            // Show/hide navigation items based on role
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
        document.getElementById('loadingScreen').classList.add('d-none');
        document.getElementById('authContainer').classList.add('d-none');
        document.getElementById('appContainer').classList.remove('d-none');
    }

    showAuth() {
        document.getElementById('loadingScreen').classList.add('d-none');
        document.getElementById('appContainer').classList.add('d-none');
        document.getElementById('authContainer').classList.remove('d-none');
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
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
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }

    // Permission checks
    canManageFiles() {
        return ['admin', 'staff_jabatan', 'staff_pembantu'].includes(this.userProfile?.role);
    }

    canManageUsers() {
        return this.userProfile?.role === 'admin';
    }

    canManageLocations() {
        return ['admin', 'staff_jabatan', 'staff_pembantu'].includes(this.userProfile?.role);
    }

    canManageBorrowings() {
        return ['admin', 'staff_jabatan', 'staff_pembantu'].includes(this.userProfile?.role);
    }

    canViewReports() {
        return ['admin', 'staff_jabatan'].includes(this.userProfile?.role);
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Setup authentication forms
document.addEventListener('DOMContentLoaded', () => {
    // Form switching
    const loginMode = document.getElementById('loginMode');
    const registerMode = document.getElementById('registerMode');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginMode && registerMode && loginForm && registerForm) {
        loginMode.addEventListener('change', () => {
            if (loginMode.checked) {
                loginForm.classList.remove('d-none');
                registerForm.classList.add('d-none');
            }
        });

        registerMode.addEventListener('change', () => {
            if (registerMode.checked) {
                registerForm.classList.remove('d-none');
                loginForm.classList.add('d-none');
            }
        });
    }

    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Log Masuk...';
            
            try {
                await authManager.login(email, password);
            } catch (error) {
                authManager.showAlert(error, 'error');
            } finally {
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Log Masuk';
            }
        });
    }

    // Registration form
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const department = document.getElementById('regDepartment').value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            // Validate passwords match
            if (password !== confirmPassword) {
                authManager.showAlert('Kata laluan tidak sepadan', 'error');
                return;
            }
            
            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mendaftar...';
            
            try {
                const result = await authManager.register(email, password, name, department);
                authManager.showAlert(result.message, 'success');
                
                // Switch back to login form
                loginMode.checked = true;
                registerForm.classList.add('d-none');
                loginForm.classList.remove('d-none');
                
                // Clear registration form
                registerForm.reset();
            } catch (error) {
                authManager.showAlert(error, 'error');
            } finally {
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Daftar Akaun';
            }
        });
    }

    // Forgot password
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            
            if (!email) {
                authManager.showAlert('Sila masukkan e-mel terlebih dahulu', 'warning');
                return;
            }
            
            try {
                const message = await authManager.resetPassword(email);
                authManager.showAlert(message, 'success');
            } catch (error) {
                authManager.showAlert(error, 'error');
            }
        });
    }

    // Setup logout buttons
    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await authManager.logout();
        } catch (error) {
            authManager.showAlert(error, 'error');
        }
    });

    document.getElementById('logoutDropdown')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await authManager.logout();
        } catch (error) {
            authManager.showAlert(error, 'error');
        }
    });

    // Setup Google login button
    document.getElementById('googleLoginBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const googleBtn = e.target;
        googleBtn.disabled = true;
        googleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Log masuk dengan Google...';
        
        try {
            await authManager.loginWithGoogle();
        } catch (error) {
            authManager.showAlert(error, 'error');
        } finally {
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<i class="fab fa-google me-2"></i>Log masuk dengan Google';
        }
    });

    // Setup Google register button
    document.getElementById('googleRegisterBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const googleBtn = e.target;
        googleBtn.disabled = true;
        googleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Daftar dengan Google...';
        
        try {
            await authManager.loginWithGoogle();
        } catch (error) {
            authManager.showAlert(error, 'error');
        } finally {
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<i class="fab fa-google me-2"></i>Daftar dengan Google';
        }
    });
});

export default authManager;