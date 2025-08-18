// Script to restore production Firestore security rules after data import
// Run this after completing the data import

const productionRules = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Files collection - role-based access
    match /files/{fileId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'staff_jabatan', 'staff_pembantu'];
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'staff_jabatan'];
    }

    // Locations collection - staff can manage
    match /locations/{locationId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'staff_jabatan', 'staff_pembantu'];
    }

    // Borrowing records - role-based access
    match /borrowing_records/{recordId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'staff_jabatan', 'staff_pembantu'];
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'staff_jabatan'];
    }

    // Activity logs - admin can read, system can write
    match /activity_logs/{logId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if request.auth != null;
    }

    // Reports collection - admin and staff_jabatan can access
    match /reports/{reportId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'staff_jabatan'];
    }
  }
}`;

console.log('📋 Production Firestore Rules:');
console.log(productionRules);
console.log('\n🔒 Copy the above rules to firestore.rules file and deploy with:');
console.log('firebase deploy --only firestore:rules');