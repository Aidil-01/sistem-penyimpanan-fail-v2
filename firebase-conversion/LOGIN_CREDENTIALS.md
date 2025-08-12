# SPF Tongod - Login Credentials

## 🔐 Firebase Authentication Setup

### 📋 Quick Setup Instructions:
1. Go to [Firebase Console - Authentication](https://console.firebase.google.com/project/sistem-penyimpanan-fail-tongod/authentication/users)
2. Create users with the credentials below
3. **IMPORTANT**: Set User UID to match the ID in the table

### 🧪 Test the System:
**App URL**: https://sistem-penyimpanan-fail-tongod.web.app

---

## 👤 User Accounts

### 🔴 **ADMIN ACCOUNTS** (Full Access)

#### Admin 1 - Pegawai Daerah
- **Email**: `datuk.ahmad@tongod.sabah.gov.my`
- **Password**: `Admin123!@#`
- **Firebase UID**: `admin001`
- **Name**: Datuk Ahmad bin Rahman
- **Role**: Admin
- **Department**: Pentadbiran Utama

#### Admin 2 - Penolong Pegawai Daerah  
- **Email**: `siti.hajar@tongod.sabah.gov.my`
- **Password**: `Admin456!@#`
- **Firebase UID**: `admin002`
- **Name**: Puan Siti Hajar binti Abdullah
- **Role**: Admin
- **Department**: Pentadbiran Utama

---

### 🔵 **STAFF JABATAN** (Department Staff)

#### Staff 1 - Pentadbiran
- **Email**: `faizal@tongod.sabah.gov.my`
- **Password**: `Staff123!@#`
- **Firebase UID**: `staff001`
- **Name**: Encik Muhammad Faizal bin Omar
- **Role**: Staff Jabatan
- **Department**: Pentadbiran

#### Staff 2 - Kewangan
- **Email**: `norliza@tongod.sabah.gov.my`
- **Password**: `Staff456!@#`
- **Firebase UID**: `staff002`
- **Name**: Puan Norliza binti Kassim
- **Role**: Staff Jabatan
- **Department**: Kewangan

#### Staff 3 - Pembangunan
- **Email**: `roslan@tongod.sabah.gov.my`
- **Password**: `Staff789!@#`
- **Firebase UID**: `staff003`
- **Name**: Encik Roslan bin Sulaiman
- **Role**: Staff Jabatan  
- **Department**: Pembangunan

#### Staff 4 - Kesihatan
- **Email**: `azlina@tongod.sabah.gov.my`
- **Password**: `Staff101!@#`
- **Firebase UID**: `staff004`
- **Name**: Puan Azlina binti Mohamad
- **Role**: Staff Jabatan
- **Department**: Kesihatan

---

### 🟡 **STAFF PEMBANTU** (Assistant Staff)

#### Helper 1 - Pentadbiran
- **Email**: `jeffri@tongod.sabah.gov.my`
- **Password**: `Helper123!@#`
- **Firebase UID**: `staff005`
- **Name**: Encik Jeffri anak Jimbai
- **Role**: Staff Pembantu
- **Department**: Pentadbiran

#### Helper 2 - Kewangan
- **Email**: `mariam@tongod.sabah.gov.my`
- **Password**: `Helper456!@#`
- **Firebase UID**: `staff006`
- **Name**: Cik Mariam binti Yusof
- **Role**: Staff Pembantu
- **Department**: Kewangan

---

### ⚪ **VIEW ONLY USERS** (Read Only Access)

#### User 1 - Pentadbiran
- **Email**: `ramli@tongod.sabah.gov.my`
- **Password**: `User123!@#`
- **Firebase UID**: `user001`
- **Name**: Encik Ramli bin Ibrahim
- **Role**: User View
- **Department**: Pentadbiran

#### User 2 - Kewangan
- **Email**: `salmah@tongod.sabah.gov.my`
- **Password**: `User456!@#`
- **Firebase UID**: `user002`
- **Name**: Cik Salmah binti Daud
- **Role**: User View
- **Department**: Kewangan

---

## 🚀 **Quick Test Credentials**

For immediate testing, use these accounts:

### **👑 Admin Test:**
```
Email: datuk.ahmad@tongod.sabah.gov.my
Password: Admin123!@#
```

### **👔 Staff Test:**
```
Email: faizal@tongod.sabah.gov.my  
Password: Staff123!@#
```

### **👤 View Only Test:**
```
Email: ramli@tongod.sabah.gov.my
Password: User123!@#
```

---

## ⚠️ **IMPORTANT SETUP NOTES:**

1. **User UID Matching**: The Firebase Authentication User UID MUST match the Firestore document ID
2. **Security Rules**: Make sure production rules are restored after data import
3. **Password Policy**: All passwords follow format: `[Role][Number]!@#`
4. **Email Format**: All emails use `@tongod.sabah.gov.my` domain

## 🔧 **Setup Helper Page:**
Visit: https://sistem-penyimpanan-fail-tongod.web.app/create-auth-users.html

---

## 📞 **Support:**
If you encounter issues:
1. Check that User UID matches Firestore document ID
2. Verify email/password in Firebase Console
3. Ensure production Firestore rules are deployed
4. Test with browser console for detailed errors

**Happy testing! 🎉**