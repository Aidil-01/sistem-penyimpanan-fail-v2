// Firebase Firestore Security Rules untuk Locations Collection
// Tambahkan ke dalam firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Locations collection rules
    match /locations/{locationId} {
      // Allow read for authenticated users
      allow read: if request.auth != null;
      
      // Allow create for admin and staff
      allow create: if request.auth != null 
        && request.auth.token.role in ['admin', 'staff_jabatan']
        && isValidLocationData();
        
      // Allow update for admin and staff
      allow update: if request.auth != null 
        && request.auth.token.role in ['admin', 'staff_jabatan']
        && isValidLocationData()
        && resource.data.createdBy == request.auth.uid || request.auth.token.role == 'admin';
        
      // Allow delete for admin only or creator if no files/children
      allow delete: if request.auth != null 
        && (request.auth.token.role == 'admin' || 
           (resource.data.createdBy == request.auth.uid && 
            resource.data.filesCount == 0 && 
            !hasChildLocations(locationId)));
    }
    
    // Helper functions
    function isValidLocationData() {
      let data = request.resource.data;
      return data.keys().hasAll(['name', 'type', 'status']) &&
             data.type in ['room', 'rack', 'slot'] &&
             data.status in ['empty', 'occupied', 'maintenance'] &&
             data.name is string &&
             data.name.size() > 0 &&
             data.name.size() <= 100 &&
             (data.description == null || (data.description is string && data.description.size() <= 500)) &&
             (data.parentId == null || data.parentId is string) &&
             data.sortOrder is int &&
             data.sortOrder >= 0 &&
             data.isAvailable is bool &&
             (data.filesCount == null || data.filesCount is int) &&
             (data.qrCode == null || data.qrCode is string);
    }
    
    function hasChildLocations(locationId) {
      return exists(/databases/$(database)/documents/locations/{location=**}) 
        && get(/databases/$(database)/documents/locations/{location}).data.parentId == locationId;
    }
  }
}

// Sample Location Document Structure:
/*
{
  "id": "auto-generated",
  "name": "Bilik Pentadbiran A",
  "type": "room", // room, rack, slot
  "parentId": null, // ID of parent location (null for root)
  "description": "Bilik utama untuk fail pentadbiran",
  "status": "empty", // empty, occupied, maintenance
  "sortOrder": 0,
  "isAvailable": true,
  "filesCount": 0,
  "qrCode": "LOC_ABC123",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "createdBy": "user-uid"
}
*/