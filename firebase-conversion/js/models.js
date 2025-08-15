// Firestore data models and operations
import { db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    addDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    startAfter,
    serverTimestamp,
    increment,
    writeBatch,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import authManager from './auth.js';

// Base Model Class
class BaseModel {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.collection = collection(db, collectionName);
    }

    async create(data) {
        const docData = {
            ...data,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
            created_by: authManager.currentUser?.uid
        };
        
        const docRef = await addDoc(this.collection, docData);
        return { id: docRef.id, ...docData };
    }

    async getById(id) {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    }

    async update(id, data) {
        const docRef = doc(db, this.collectionName, id);
        const updateData = {
            ...data,
            updated_at: serverTimestamp(),
            updated_by: authManager.currentUser?.uid
        };
        
        await updateDoc(docRef, updateData);
        return { id, ...updateData };
    }

    async delete(id) {
        const docRef = doc(db, this.collectionName, id);
        await deleteDoc(docRef);
        return true;
    }

    async getAll(constraints = []) {
        try {
            if (!db) {
                throw new Error('Database not available');
            }
            
            let q = query(this.collection, ...constraints);
            const querySnapshot = await getDocs(q);
            
            const results = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Return dummy data if Firebase is empty and it's files collection
            if (results.length === 0 && this.collectionName === 'files' && window.dummyFiles) {
                console.log('Using dummy files data as fallback');
                return window.dummyFiles;
            }
            
            return results;
            
        } catch (error) {
            console.error(`Error loading ${this.collectionName}:`, error);
            
            // Return dummy data for files if available
            if (this.collectionName === 'files' && window.dummyFiles) {
                console.log('Firebase error, using dummy files data');
                return window.dummyFiles;
            }
            
            throw error;
        }
    }

    // Real-time listener
    onSnapshot(callback, constraints = []) {
        let q = query(this.collection, ...constraints);
        return onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(docs);
        });
    }
}

// User Model
class UserModel extends BaseModel {
    constructor() {
        super('users');
    }

    async createUser(userData) {
        const defaultData = {
            name: userData.name,
            email: userData.email,
            role: userData.role || 'user_view',
            department: userData.department || 'Pentadbiran',
            position: userData.position || 'Pegawai',
            phone: userData.phone || '',
            is_active: true,
            ...userData
        };
        
        return await this.create(defaultData);
    }

    async getByRole(role) {
        return await this.getAll([where('role', '==', role)]);
    }

    async getActiveUsers() {
        return await this.getAll([where('is_active', '==', true)]);
    }

    async toggleStatus(id) {
        const user = await this.getById(id);
        if (user) {
            return await this.update(id, { is_active: !user.is_active });
        }
        return null;
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
}

// Location Model
class LocationModel extends BaseModel {
    constructor() {
        super('locations');
    }

    async createLocation(locationData) {
        const data = {
            room: locationData.room,
            rack: locationData.rack,
            slot: locationData.slot,
            description: locationData.description || '',
            is_available: true,
            ...locationData
        };
        
        return await this.create(data);
    }

    async getAvailableLocations() {
        return await this.getAll([where('is_available', '==', true)]);
    }

    async getByRoom(room) {
        return await this.getAll([where('room', '==', room)]);
    }

    getFullLocation(location) {
        return `${location.room} - ${location.rack} - ${location.slot}`;
    }

    getLocationCode(location) {
        if (location.qrCode) {
            return location.qrCode;
        }
        return (location.room.substring(0, 1) + location.rack.substring(0, 1) + location.slot).toUpperCase();
    }

    // Enhanced methods for new system
    async create(data) {
        const locationData = {
            name: data.name,
            type: data.type || 'room',
            parentId: data.parentId || null,
            description: data.description || '',
            status: data.status || 'empty',
            sortOrder: data.sortOrder || 0,
            isAvailable: data.isAvailable !== false,
            filesCount: 0,
            qrCode: data.qrCode || this.generateQrCode(),
            // Legacy fields for backward compatibility
            room: data.room || (data.type === 'room' ? data.name : ''),
            rack: data.rack || (data.type === 'rack' ? data.name : ''),
            slot: data.slot || (data.type === 'slot' ? data.name : ''),
            is_available: data.isAvailable !== false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: authManager.currentUser?.uid
        };

        const docRef = await addDoc(this.collection, locationData);
        return { id: docRef.id, ...locationData };
    }

    async getAll() {
        const q = query(this.collection, orderBy('sortOrder', 'asc'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    async getByType(type) {
        const q = query(this.collection, 
            where('type', '==', type),
            orderBy('sortOrder', 'asc'),
            orderBy('name', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    async getByParent(parentId) {
        const q = parentId 
            ? query(this.collection, 
                where('parentId', '==', parentId),
                orderBy('sortOrder', 'asc')
              )
            : query(this.collection, 
                where('parentId', '==', null),
                orderBy('sortOrder', 'asc')
              );
              
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    async search(searchTerm) {
        const allLocations = await this.getAll();
        const term = searchTerm.toLowerCase();
        
        return allLocations.filter(location => 
            (location.name && location.name.toLowerCase().includes(term)) ||
            (location.description && location.description.toLowerCase().includes(term)) ||
            (location.qrCode && location.qrCode.toLowerCase().includes(term)) ||
            (location.room && location.room.toLowerCase().includes(term)) ||
            (location.rack && location.rack.toLowerCase().includes(term)) ||
            (location.slot && location.slot.toLowerCase().includes(term))
        );
    }

    generateQrCode() {
        return 'LOC_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    // Helper methods for UI
    getTypeIcon(type) {
        const icons = {
            room: 'fas fa-door-open',
            rack: 'fas fa-layer-group', 
            slot: 'fas fa-square'
        };
        return icons[type] || 'fas fa-map-marker-alt';
    }

    getStatusClass(status) {
        const classes = {
            empty: 'success',
            occupied: 'danger',
            maintenance: 'warning'
        };
        return classes[status] || 'secondary';
    }

    getStatusLabel(status) {
        const labels = {
            empty: 'Kosong',
            occupied: 'Ada Fail', 
            maintenance: 'Penyelenggaraan'
        };
        return labels[status] || 'Tidak Diketahui';
    }

    getTypeLabel(type) {
        const labels = {
            room: 'Bilik',
            rack: 'Rak',
            slot: 'Slot'
        };
        return labels[type] || 'Tidak Diketahui';
    }
}

// File Model
class FileModel extends BaseModel {
    constructor() {
        super('files');
    }

    async createFile(fileData) {
        const fileId = await this.generateFileId();
        const data = {
            file_id: fileId,
            title: fileData.title,
            reference_number: fileData.reference_number || '',
            document_year: parseInt(fileData.document_year),
            department: fileData.department,
            document_type: fileData.document_type,
            description: fileData.description || '',
            status: 'tersedia',
            location_id: fileData.location_id,
            ...fileData
        };
        
        return await this.create(data);
    }

    async generateFileId() {
        const year = new Date().getFullYear();
        const yearFiles = await this.getAll([where('document_year', '==', year)]);
        const count = yearFiles.length + 1;
        return `FAIL${year}${count.toString().padStart(4, '0')}`;
    }

    async getByStatus(status) {
        return await this.getAll([where('status', '==', status)]);
    }

    async getByDepartment(department) {
        return await this.getAll([where('department', '==', department)]);
    }

    async getByYear(year) {
        return await this.getAll([where('document_year', '==', parseInt(year))]);
    }

    async search(searchTerm) {
        // Firestore doesn't support full-text search, so we'll need to implement this differently
        // For now, we'll search by exact matches or use Algolia/other search service
        const allFiles = await this.getAll();
        
        return allFiles.filter(file => 
            file.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.file_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    async moveFile(fileId, newLocationId, reason = '') {
        const file = await this.getById(fileId);
        if (!file) throw new Error('Fail tidak dijumpai');

        const oldLocationId = file.location_id;
        
        // Update file location
        await this.update(fileId, { location_id: newLocationId });
        
        // Create movement record
        const movementData = {
            file_id: fileId,
            from_location_id: oldLocationId,
            to_location_id: newLocationId,
            reason: reason,
            moved_at: serverTimestamp(),
            moved_by: authManager.currentUser?.uid
        };
        
        await fileMovementModel.create(movementData);
        
        return true;
    }

    getDocumentTypeDisplay(type) {
        const types = {
            'surat_rasmi': 'Surat Rasmi',
            'perjanjian': 'Perjanjian',
            'permit': 'Permit',
            'laporan': 'Laporan',
            'lain_lain': 'Lain-lain'
        };
        return types[type] || type;
    }

    getStatusDisplay(status) {
        const statuses = {
            'tersedia': 'Tersedia',
            'dipinjam': 'Dipinjam',
            'arkib': 'Arkib',
            'tidak_aktif': 'Tidak Aktif'
        };
        return statuses[status] || status;
    }
}

// BorrowingRecord Model
class BorrowingRecordModel extends BaseModel {
    constructor() {
        super('borrowing_records');
    }

    async createBorrowing(borrowingData) {
        const data = {
            file_id: borrowingData.file_id,
            borrower_id: borrowingData.borrower_id,
            approved_by: authManager.currentUser?.uid,
            purpose: borrowingData.purpose,
            borrowed_date: new Date().toISOString().split('T')[0],
            due_date: borrowingData.due_date,
            notes: borrowingData.notes || '',
            status: 'dipinjam',
            ...borrowingData
        };
        
        // Create borrowing record
        const borrowing = await this.create(data);
        
        // Update file status
        await fileModel.update(borrowingData.file_id, { status: 'dipinjam' });
        
        return borrowing;
    }

    async returnFile(borrowingId, notes = '') {
        const borrowing = await this.getById(borrowingId);
        if (!borrowing) throw new Error('Rekod peminjaman tidak dijumpai');
        
        if (borrowing.status !== 'dipinjam') {
            throw new Error('Fail ini sudah dikembalikan');
        }
        
        // Update borrowing record
        await this.update(borrowingId, {
            returned_date: new Date().toISOString().split('T')[0],
            returned_to: authManager.currentUser?.uid,
            status: 'dikembalikan',
            notes: notes
        });
        
        // Update file status
        await fileModel.update(borrowing.file_id, { status: 'tersedia' });
        
        return true;
    }

    async getActiveBorrowings() {
        return await this.getAll([where('status', '==', 'dipinjam')]);
    }

    async getOverdueBorrowings() {
        const today = new Date().toISOString().split('T')[0];
        const activeBorrowings = await this.getActiveBorrowings();
        
        return activeBorrowings.filter(borrowing => borrowing.due_date < today);
    }

    async getDueSoon(days = 3) {
        const today = new Date();
        const targetDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
        const todayStr = today.toISOString().split('T')[0];
        const targetStr = targetDate.toISOString().split('T')[0];
        
        const activeBorrowings = await this.getActiveBorrowings();
        
        return activeBorrowings.filter(borrowing => 
            borrowing.due_date >= todayStr && borrowing.due_date <= targetStr
        );
    }

    async getByBorrower(borrowerId) {
        return await this.getAll([where('borrower_id', '==', borrowerId)]);
    }

    isOverdue(borrowing) {
        const today = new Date().toISOString().split('T')[0];
        return borrowing.status === 'dipinjam' && borrowing.due_date < today;
    }

    getDaysOverdue(borrowing) {
        if (!this.isOverdue(borrowing)) return 0;
        
        const today = new Date();
        const dueDate = new Date(borrowing.due_date);
        const diffTime = today - dueDate;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getDaysRemaining(borrowing) {
        if (borrowing.status !== 'dipinjam') return null;
        
        const today = new Date();
        const dueDate = new Date(borrowing.due_date);
        const diffTime = dueDate - today;
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return days >= 0 ? days : 0;
    }
}

// FileMovement Model
class FileMovementModel extends BaseModel {
    constructor() {
        super('file_movements');
    }

    async getByFile(fileId) {
        return await this.getAll([
            where('file_id', '==', fileId),
            orderBy('moved_at', 'desc')
        ]);
    }

    async getRecent(days = 30) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        
        return await this.getAll([
            where('moved_at', '>=', date),
            orderBy('moved_at', 'desc')
        ]);
    }
}

// ActivityLog Model
class ActivityLogModel extends BaseModel {
    constructor() {
        super('activity_logs');
    }

    async logActivity(action, description, subject = null, properties = {}) {
        const data = {
            user_id: authManager.currentUser?.uid,
            user_email: authManager.currentUser?.email,
            action: action,
            description: description,
            subject_type: subject?.type || null,
            subject_id: subject?.id || null,
            properties: properties,
            ip_address: 'unknown', // Will be set by auth manager
            user_agent: navigator.userAgent,
            timestamp: serverTimestamp()
        };
        
        return await this.create(data);
    }

    async getByUser(userId) {
        return await this.getAll([
            where('user_id', '==', userId),
            orderBy('timestamp', 'desc')
        ]);
    }

    async getRecent(days = 30) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        
        return await this.getAll([
            where('timestamp', '>=', date),
            orderBy('timestamp', 'desc')
        ]);
    }

    getActionDisplay(action) {
        const actions = {
            'file_created': 'Fail Dicipta',
            'file_updated': 'Fail Dikemaskini',
            'file_deleted': 'Fail Dipadam',
            'file_moved': 'Fail Dipindahkan',
            'file_borrowed': 'Fail Dipinjam',
            'file_returned': 'Fail Dikembalikan',
            'user_created': 'Pengguna Dicipta',
            'user_updated': 'Pengguna Dikemaskini',
            'user_deleted': 'Pengguna Dipadam',
            'location_created': 'Lokasi Dicipta',
            'location_updated': 'Lokasi Dikemaskini',
            'location_deleted': 'Lokasi Dipadam',
            'login': 'Log Masuk',
            'logout': 'Log Keluar'
        };
        return actions[action] || action;
    }
}

// Initialize models
export const userModel = new UserModel();
export const locationModel = new LocationModel();
export const fileModel = new FileModel();
export const borrowingRecordModel = new BorrowingRecordModel();
export const fileMovementModel = new FileMovementModel();
export const activityLogModel = new ActivityLogModel();

// Export models object for easier access
export const models = {
    user: userModel,
    location: locationModel,
    file: fileModel,
    borrowing: borrowingRecordModel,
    movement: fileMovementModel,
    activity: activityLogModel
};