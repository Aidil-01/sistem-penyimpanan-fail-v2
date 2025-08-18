# Panduan Command Sinkronisasi untuk Sistem Penyimpanan Fail Tongod

## 🔄 Sistem Sinkronisasi Firebase

Dokumen ini menyediakan panduan lengkap untuk command-command yang dapat digunakan untuk mengelola sinkronisasi antara koleksi `fail` dan `lokasi` dalam sistem Firebase.

## 📋 Senarai File dan Fungsi

### 1. `analyze-sync-issues.js` - Analisis Masalah Sinkronisasi
```bash
node analyze-sync-issues.js
```
**Fungsi:**
- Menganalisis struktur Firebase dan koleksi
- Mengesan isu sinkronisasi antara fail dan lokasi
- Mengenal pasti rekod orphaned dan rujukan yang hilang
- Menjana laporan komprehensif masalah

**Output:**
- Laporan fail dengan rujukan lokasi tidak wujud
- Senarai fail tanpa lokasi ditetapkan
- Lokasi yang tidak digunakan
- Data tidak konsisten

### 2. `fix-sync-issues.js` - Pembetulan Masalah Sinkronisasi
```bash
node fix-sync-issues.js
```
**Fungsi:**
- Membaiki fail dengan rujukan lokasi tidak wujud
- Mencipta lokasi default untuk setiap jabatan
- Menetapkan lokasi untuk fail tanpa lokasi
- Membaiki konsistensi status lokasi
- Menguat kuasa referential integrity

**Features:**
- Batch processing untuk performance
- Auto-create default locations
- Status consistency fixes
- Comprehensive logging

### 3. `validate-sync.js` - Pengesahan Selepas Pembetulan
```bash
node validate-sync.js
```
**Fungsi:**
- Mengesahkan semua rujukan lokasi valid
- Memeriksa konsistensi status
- Validasi rekod peminjaman
- Menjana skor kesihatan sistem

**Output:**
- Laporan validasi lengkap
- Skor kesihatan sistem (%)
- JSON report untuk automasi
- Cadangan tindakan

### 4. `realtime-sync-functions.js` - Sinkronisasi Masa Nyata
```javascript
import syncManager from './realtime-sync-functions.js';

// Mulakan semua listeners
syncManager.startAllListeners();

// Hentikan listeners
syncManager.stopAllListeners();

// Pemeriksaan integriti berkala
syncManager.runPeriodicIntegrityCheck();
```
**Fungsi:**
- Real-time monitoring perubahan fail
- Auto-update status lokasi
- Sinkronisasi rekod peminjaman
- Pemeriksaan integriti berkala

## 🚀 Cara Penggunaan

### Langkah 1: Analisis Masalah
```bash
# Jalankan analisis untuk mengenal pasti masalah
node analyze-sync-issues.js
```

### Langkah 2: Pembetulan Masalah
```bash
# Jalankan pembetulan berdasarkan analisis
node fix-sync-issues.js
```

### Langkah 3: Validasi Pembetulan
```bash
# Sahkan bahawa semua masalah telah diselesaikan
node validate-sync.js
```

### Langkah 4: Aktivasi Real-time Sync
```javascript
// Dalam aplikasi utama, import dan mulakan
import syncManager from './realtime-sync-functions.js';
syncManager.startAllListeners();
```

## 📊 Command Reference

### Analisis Database
```bash
# Analisis struktur Firebase
node -e "
import('./analyze-sync-issues.js').then(module => {
  const analyzer = new module.default();
  analyzer.analyzeDataIntegrity();
});
"
```

### Pembetulan Automatik
```bash
# Jalankan pembetulan lengkap
node -e "
import('./fix-sync-issues.js').then(module => {
  const fixer = new module.default();
  fixer.fixAllSyncIssues();
});
"
```

### Validasi Status
```bash
# Validasi dan buat laporan
node -e "
import('./validate-sync.js').then(module => {
  const validator = new module.default();
  validator.validateAllSyncIssues();
});
"
```

## 🛠️ Troubleshooting Commands

### Periksa Fail Orphaned
```javascript
// Cari fail dengan rujukan lokasi tidak wujud
const filesSnapshot = await getDocs(collection(db, 'files'));
const locationsSnapshot = await getDocs(collection(db, 'locations'));

const locationIds = new Set();
locationsSnapshot.forEach(doc => locationIds.add(doc.id));

const orphanedFiles = [];
filesSnapshot.forEach(doc => {
  const data = doc.data();
  if (data.location_id && !locationIds.has(data.location_id)) {
    orphanedFiles.push(doc.id);
  }
});
```

### Reset Rujukan Lokasi
```javascript
// Reset rujukan lokasi untuk fail tertentu
await updateDoc(doc(db, 'files', 'FILE_ID'), {
  location_id: null,
  status: 'perlu_lokasi',
  updated_at: serverTimestamp()
});
```

### Cipta Lokasi Default
```javascript
// Cipta lokasi default untuk jabatan
const defaultLocation = await addDoc(collection(db, 'locations'), {
  room: 'Stor Default Pentadbiran',
  rack: 'DEF001',
  slot: '001',
  description: 'Lokasi default untuk fail Pentadbiran',
  is_available: true,
  created_at: serverTimestamp()
});
```

## 🔧 Maintenance Commands

### Pemeriksaan Rutin Harian
```bash
# Script untuk dijalankan setiap hari
#!/bin/bash
echo "Menjalankan pemeriksaan rutin..."
node validate-sync.js > daily-check-$(date +%Y%m%d).log
```

### Pembersihan Data Lama
```javascript
// Bersihkan fail arkib lama (contoh: lebih dari 2 tahun)
const oldFiles = await getDocs(
  query(
    collection(db, 'files'), 
    where('document_year', '<', new Date().getFullYear() - 2),
    where('status', '==', 'arkib')
  )
);
```

### Update Statistics
```javascript
// Kemas kini statistik penggunaan lokasi
const locations = await getDocs(collection(db, 'locations'));
for (const locationDoc of locations.docs) {
  const files = await getDocs(
    query(collection(db, 'files'), where('location_id', '==', locationDoc.id))
  );
  
  await updateDoc(locationDoc.ref, {
    usage_count: files.size,
    last_updated: serverTimestamp()
  });
}
```

## 📈 Monitoring dan Metrics

### Health Check Command
```bash
# Semak kesihatan sistem
node -e "
import('./validate-sync.js').then(async module => {
  const validator = new module.default();
  const result = await validator.validateAllSyncIssues();
  console.log('Health Score:', result.healthScore);
  process.exit(result.passed ? 0 : 1);
});
"
```

### Generate Reports
```bash
# Jana laporan untuk admin dashboard
node -e "
import('./analyze-sync-issues.js').then(module => {
  const analyzer = new module.default();
  analyzer.analyzeDataIntegrity().then(() => {
    console.log('Report saved to sync-status.json');
  });
});
" > sync-status.json
```

## 🔒 Best Practices

1. **Backup sebelum pembetulan**
   ```bash
   # Export data sebelum menjalankan fix
   firebase firestore:export backup-$(date +%Y%m%d)
   ```

2. **Jalankan dalam environment test dahulu**
   ```javascript
   // Guna Firebase emulator untuk testing
   if (location.hostname === 'localhost') {
     connectFirestoreEmulator(db, 'localhost', 8080);
   }
   ```

3. **Monitor performance**
   ```javascript
   // Track execution time
   const startTime = Date.now();
   await fixSyncIssues();
   console.log(`Execution time: ${Date.now() - startTime}ms`);
   ```

4. **Setup alerts**
   ```javascript
   // Setup monitoring untuk isu kritikal
   if (invalidReferences > 10) {
     console.error('ALERT: Terlalu banyak rujukan tidak valid!');
   }
   ```

## 📝 Nota Penting

- **WAJIB backup database** sebelum menjalankan fix scripts
- Jalankan scripts dalam urutan: analyze → fix → validate
- Monitor logs untuk sebarang ralat semasa pembetulan
- Setup real-time sync selepas pembetulan untuk pencegahan
- Jalankan validasi secara berkala untuk maintenance

## 🆘 Sokongan

Jika menghadapi masalah:
1. Semak logs untuk error messages
2. Jalankan validate-sync.js untuk diagnosis
3. Backup dan restore jika diperlukan
4. Hubungi admin sistem untuk sokongan lanjut