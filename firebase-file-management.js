// Firebase File Management Module
// This module handles file operations with QR code generation
// Note: Firebase imports will be handled by the main page

// QR Code generation using a simple library
class QRCodeGenerator {
    static generateCode() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substr(2, 9).toUpperCase();
        return `FILE_${timestamp}_${random}`;
    }
    
    static generateQRCodeURL(code, size = 150) {
        // Using QR Server API for QR code generation
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(code)}`;
    }
    
    static generateLocationQRCode() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substr(2, 9).toUpperCase();
        return `LOC_${timestamp}_${random}`;
    }
}

// File Management Class
class FileManager {
    constructor(db, firestoreFunctions) {
        this.db = db;
        this.firestoreFunctions = firestoreFunctions;
    }

    // Create new file with QR code
    async createFile(fileData, userId) {
        try {
            const qrCode = QRCodeGenerator.generateCode();
            const fileId = this.generateFileId(fileData.department);
            
            const newFile = {
                ...fileData,
                fileId: fileId,
                qrCode: qrCode,
                createdBy: userId,
                createdAt: this.firestoreFunctions.serverTimestamp(),
                updatedAt: this.firestoreFunctions.serverTimestamp(),
                status: 'tersedia'
            };

            const docRef = await this.firestoreFunctions.addDoc(this.firestoreFunctions.collection(this.db, 'files'), newFile);
            
            // Log activity
            await this.logActivity(userId, 'create_file', {
                fileId: fileId,
                action: 'File baharu dicipta'
            });

            return {
                id: docRef.id,
                ...newFile,
                qrCodeUrl: QRCodeGenerator.generateQRCodeURL(qrCode)
            };
        } catch (error) {
            console.error('Error creating file:', error);
            throw error;
        }
    }

    // Update file
    async updateFile(fileId, updateData, userId) {
        try {
            const fileRef = doc(this.db, 'files', fileId);
            const updatePayload = {
                ...updateData,
                updatedAt: serverTimestamp(),
                updatedBy: userId
            };

            await updateDoc(fileRef, updatePayload);
            
            // Log activity
            await this.logActivity(userId, 'update_file', {
                fileId: fileId,
                action: 'File dikemaskini'
            });

            return true;
        } catch (error) {
            console.error('Error updating file:', error);
            throw error;
        }
    }

    // Move file to location
    async moveFileToLocation(fileId, locationId, userId) {
        try {
            const fileRef = doc(this.db, 'files', fileId);
            const locationRef = doc(this.db, 'locations', locationId);
            
            // Verify location exists
            const locationDoc = await getDoc(locationRef);
            if (!locationDoc.exists()) {
                throw new Error('Lokasi tidak dijumpai');
            }

            // Update file location
            await updateDoc(fileRef, {
                locationId: locationId,
                updatedAt: serverTimestamp(),
                updatedBy: userId
            });

            // Log activity
            await this.logActivity(userId, 'move_file', {
                fileId: fileId,
                locationId: locationId,
                action: 'Fail dipindahkan ke lokasi baharu'
            });

            return true;
        } catch (error) {
            console.error('Error moving file:', error);
            throw error;
        }
    }

    // Generate file ID based on department
    generateFileId(department) {
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-6);
        const deptCode = this.getDepartmentCode(department);
        return `${deptCode}${year}${timestamp}`;
    }

    // Get department code
    getDepartmentCode(department) {
        const codes = {
            'Pentadbiran Am': 'PA',
            'Kewangan': 'KW', 
            'Sumber Manusia': 'SM',
            'Teknologi Maklumat': 'TM',
            'Perundangan': 'PU',
            'Audit': 'AD',
            'Pembangunan': 'PB'
        };
        return codes[department] || 'UM'; // UM = Unknown/Misc
    }

    // Get files by location
    async getFilesByLocation(locationId) {
        try {
            const q = query(this.filesCollection, where('locationId', '==', locationId), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            
            const files = [];
            snapshot.forEach((doc) => {
                const fileData = doc.data();
                files.push({
                    id: doc.id,
                    ...fileData,
                    qrCodeUrl: QRCodeGenerator.generateQRCodeURL(fileData.qrCode)
                });
            });

            return files;
        } catch (error) {
            console.error('Error getting files by location:', error);
            throw error;
        }
    }

    // Search files
    async searchFiles(searchTerm, filters = {}) {
        try {
            let q = this.filesCollection;
            
            // Apply filters
            if (filters.department) {
                q = query(q, where('department', '==', filters.department));
            }
            if (filters.status) {
                q = query(q, where('status', '==', filters.status));
            }
            if (filters.locationId) {
                q = query(q, where('locationId', '==', filters.locationId));
            }

            const snapshot = await getDocs(q);
            let files = [];
            
            snapshot.forEach((doc) => {
                const fileData = doc.data();
                files.push({
                    id: doc.id,
                    ...fileData,
                    qrCodeUrl: QRCodeGenerator.generateQRCodeURL(fileData.qrCode)
                });
            });

            // Client-side search if search term provided
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                files = files.filter(file => 
                    (file.title && file.title.toLowerCase().includes(term)) ||
                    (file.fileId && file.fileId.toLowerCase().includes(term)) ||
                    (file.qrCode && file.qrCode.toLowerCase().includes(term)) ||
                    (file.description && file.description.toLowerCase().includes(term))
                );
            }

            return files;
        } catch (error) {
            console.error('Error searching files:', error);
            throw error;
        }
    }

    // Get file by QR code
    async getFileByQRCode(qrCode) {
        try {
            const q = query(this.filesCollection, where('qrCode', '==', qrCode));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            const fileData = doc.data();
            return {
                id: doc.id,
                ...fileData,
                qrCodeUrl: QRCodeGenerator.generateQRCodeURL(fileData.qrCode)
            };
        } catch (error) {
            console.error('Error getting file by QR code:', error);
            throw error;
        }
    }

    // Delete file
    async deleteFile(fileId, userId) {
        try {
            const fileRef = doc(this.db, 'files', fileId);
            const fileDoc = await getDoc(fileRef);
            
            if (!fileDoc.exists()) {
                throw new Error('Fail tidak dijumpai');
            }

            const fileData = fileDoc.data();
            
            // Log activity before deletion
            await this.logActivity(userId, 'delete_file', {
                fileId: fileData.fileId,
                action: 'Fail dipadam'
            });

            await deleteDoc(fileRef);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    // Log activity
    async logActivity(userId, action, metadata) {
        try {
            const activityData = {
                userId: userId,
                action: action,
                metadata: metadata,
                timestamp: serverTimestamp()
            };

            await addDoc(this.activityLogsCollection, activityData);
        } catch (error) {
            console.error('Error logging activity:', error);
            // Don't throw error for logging failures
        }
    }

    // Get activity logs
    async getActivityLogs(limit = 50, filters = {}) {
        try {
            let q = query(this.activityLogsCollection, orderBy('timestamp', 'desc'));
            
            if (filters.userId) {
                q = query(q, where('userId', '==', filters.userId));
            }
            if (filters.action) {
                q = query(q, where('action', '==', filters.action));
            }

            const snapshot = await getDocs(q);
            const activities = [];
            
            let count = 0;
            snapshot.forEach((doc) => {
                if (count < limit) {
                    activities.push({
                        id: doc.id,
                        ...doc.data()
                    });
                    count++;
                }
            });

            return activities;
        } catch (error) {
            console.error('Error getting activity logs:', error);
            throw error;
        }
    }

    // Generate location structure with file counts
    async generateLocationStructure() {
        try {
            // Get all locations
            const locationsSnapshot = await getDocs(query(this.locationsCollection, orderBy('sortOrder', 'asc')));
            const locations = [];
            locationsSnapshot.forEach((doc) => {
                locations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Get all files
            const filesSnapshot = await getDocs(this.filesCollection);
            const filesByLocation = {};
            
            filesSnapshot.forEach((doc) => {
                const fileData = doc.data();
                const locationId = fileData.locationId;
                if (locationId) {
                    if (!filesByLocation[locationId]) {
                        filesByLocation[locationId] = [];
                    }
                    filesByLocation[locationId].push({
                        id: doc.id,
                        ...fileData,
                        qrCodeUrl: QRCodeGenerator.generateQRCodeURL(fileData.qrCode)
                    });
                }
            });

            // Build hierarchical structure
            const structure = this.buildHierarchy(locations, filesByLocation);
            
            return structure;
        } catch (error) {
            console.error('Error generating location structure:', error);
            throw error;
        }
    }

    // Build location hierarchy
    buildHierarchy(locations, filesByLocation, parentId = null) {
        const children = locations.filter(loc => loc.parentId === parentId);
        
        return children.map(location => ({
            ...location,
            files: filesByLocation[location.id] || [],
            fileCount: (filesByLocation[location.id] || []).length,
            children: this.buildHierarchy(locations, filesByLocation, location.id),
            qrCodeUrl: location.qrCode ? QRCodeGenerator.generateQRCodeURL(location.qrCode) : null
        }));
    }
}

// Export for use in other modules
window.FileManager = FileManager;
window.QRCodeGenerator = QRCodeGenerator;