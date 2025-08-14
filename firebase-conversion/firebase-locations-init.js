// Firebase Initialization Script for Locations
// Jalankan ini dalam Firebase Console untuk setup data lokasi

// Sample data untuk populate locations collection
const sampleLocations = [
  // Bilik-bilik
  {
    name: "Bilik Pentadbiran A",
    type: "room",
    parentId: null,
    description: "Bilik utama untuk fail pentadbiran",
    status: "empty",
    sortOrder: 1,
    isAvailable: true,
    filesCount: 0,
    qrCode: "LOC_ADMIN_A",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Bilik Kewangan",
    type: "room", 
    parentId: null,
    description: "Bilik penyimpanan dokumen kewangan",
    status: "empty",
    sortOrder: 2,
    isAvailable: true,
    filesCount: 0,
    qrCode: "LOC_FINANCE",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Bilik Arkib",
    type: "room",
    parentId: null, 
    description: "Bilik arkib untuk fail lama",
    status: "empty",
    sortOrder: 3,
    isAvailable: true,
    filesCount: 0,
    qrCode: "LOC_ARCHIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Sample rak untuk Bilik Pentadbiran A
const sampleRacks = [
  {
    name: "Rak A1",
    type: "rack",
    parentId: "ADMIN_A_ID", // Akan diisi dengan ID sebenar
    description: "Rak pertama di bilik pentadbiran",
    status: "empty",
    sortOrder: 1,
    isAvailable: true,
    filesCount: 0,
    qrCode: "LOC_ADMIN_A_R1",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Rak A2", 
    type: "rack",
    parentId: "ADMIN_A_ID",
    description: "Rak kedua di bilik pentadbiran",
    status: "empty",
    sortOrder: 2,
    isAvailable: true,
    filesCount: 0,
    qrCode: "LOC_ADMIN_A_R2",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Sample slot untuk Rak A1
const sampleSlots = [
  {
    name: "Slot A1-1",
    type: "slot",
    parentId: "RAK_A1_ID", // Akan diisi dengan ID sebenar
    description: "Slot pertama di rak A1",
    status: "empty",
    sortOrder: 1,
    isAvailable: true,
    filesCount: 0,
    qrCode: "LOC_ADMIN_A1_S1", 
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Slot A1-2",
    type: "slot", 
    parentId: "RAK_A1_ID",
    description: "Slot kedua di rak A1",
    status: "empty",
    sortOrder: 2,
    isAvailable: true,
    filesCount: 0,
    qrCode: "LOC_ADMIN_A1_S2",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Slot A1-3",
    type: "slot",
    parentId: "RAK_A1_ID", 
    description: "Slot ketiga di rak A1",
    status: "empty",
    sortOrder: 3,
    isAvailable: true,
    filesCount: 0,
    qrCode: "LOC_ADMIN_A1_S3",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Function to create sample data
async function createSampleLocations() {
  const db = firebase.firestore();
  
  try {
    console.log('Creating sample locations...');
    
    // Create rooms first
    const roomIds = {};
    for (const room of sampleLocations) {
      const docRef = await db.collection('locations').add(room);
      roomIds[room.qrCode] = docRef.id;
      console.log(`Created room: ${room.name} with ID: ${docRef.id}`);
    }
    
    // Create racks for Admin room
    const adminRoomId = roomIds['LOC_ADMIN_A'];
    const rackIds = {};
    
    for (const rack of sampleRacks) {
      rack.parentId = adminRoomId;
      const docRef = await db.collection('locations').add(rack);
      rackIds[rack.qrCode] = docRef.id;
      console.log(`Created rack: ${rack.name} with ID: ${docRef.id}`);
    }
    
    // Create slots for Rack A1
    const rackA1Id = rackIds['LOC_ADMIN_A_R1'];
    
    for (const slot of sampleSlots) {
      slot.parentId = rackA1Id;
      const docRef = await db.collection('locations').add(slot);
      console.log(`Created slot: ${slot.name} with ID: ${docRef.id}`);
    }
    
    console.log('Sample locations created successfully!');
    return {
      rooms: roomIds,
      racks: rackIds,
      message: 'Sample data created successfully'
    };
    
  } catch (error) {
    console.error('Error creating sample locations:', error);
    throw error;
  }
}

// Function to clean up test data (use carefully!)
async function deleteAllLocations() {
  const db = firebase.firestore();
  
  try {
    console.log('WARNING: This will delete ALL locations!');
    
    const snapshot = await db.collection('locations').get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('All locations deleted successfully!');
    
  } catch (error) {
    console.error('Error deleting locations:', error);
    throw error;
  }
}

// Export functions for use in Firebase Console
window.createSampleLocations = createSampleLocations;
window.deleteAllLocations = deleteAllLocations;

// Instructions for use:
console.log(`
Firebase Locations Setup Instructions:

1. Copy and paste this script into Firebase Console
2. Run: await createSampleLocations()
3. Check Firestore console to verify data creation
4. Update firestore.rules with the rules from firestore-locations-rules.js

To delete all test data:
- Run: await deleteAllLocations()

Sample locations will include:
- 3 Rooms (Pentadbiran A, Kewangan, Arkiv) 
- 2 Racks in Pentadbiran A
- 3 Slots in Rack A1
`);

// Firestore Indexes needed (add to firestore.indexes.json):
const requiredIndexes = [
  {
    "collectionGroup": "locations",
    "queryScope": "COLLECTION", 
    "fields": [
      { "fieldPath": "type", "order": "ASCENDING" },
      { "fieldPath": "sortOrder", "order": "ASCENDING" }
    ]
  },
  {
    "collectionGroup": "locations",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "parentId", "order": "ASCENDING" },
      { "fieldPath": "sortOrder", "order": "ASCENDING" }
    ]
  },
  {
    "collectionGroup": "locations", 
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "status", "order": "ASCENDING" },
      { "fieldPath": "name", "order": "ASCENDING" }
    ]
  }
];

console.log('Required Firestore Indexes:', JSON.stringify(requiredIndexes, null, 2));