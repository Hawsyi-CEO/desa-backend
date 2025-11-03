# 🔄 PANDUAN UPDATE CEPAT KE VPS

## 📝 File yang Perlu Diupdate:
1. **controllers/wargaController.js** - Email jadi optional saat tambah warga
2. **Database Migration** - Ubah kolom email jadi nullable

---

## 🚀 LANGKAH-LANGKAH UPDATE

### STEP 1: Connect ke VPS

Buka PowerShell atau CMD, lalu jalankan:

```bash
ssh root@72.61.140.193
```

**Password:** `Vertinova123#`

---

### STEP 2: Update File wargaController.js

Setelah masuk ke VPS, jalankan:

```bash
cd /root/desa-backend/controllers
nano wargaController.js
```

**Cari baris ini (sekitar baris 1061):**
```javascript
// Validasi required fields
if (!nik || !nama || !email) {
  return res.status(400).json({
    success: false,
    message: 'NIK, nama, dan email wajib diisi'
  });
}
```

**Ganti menjadi:**
```javascript
// Validasi required fields
if (!nik || !nama) {
  return res.status(400).json({
    success: false,
    message: 'NIK dan nama wajib diisi'
  });
}
```

**Cari baris ini (sekitar baris 1081):**
```javascript
// Check if email already exists
const [existingEmail] = await db.query(
  'SELECT id FROM users WHERE email = ?',
  [email]
);

if (existingEmail.length > 0) {
  return res.status(400).json({
    success: false,
    message: 'Email sudah terdaftar'
  });
}
```

**Ganti menjadi:**
```javascript
// Check if email already exists (only if email is provided)
if (email) {
  const [existingEmail] = await db.query(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );

  if (existingEmail.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Email sudah terdaftar'
    });
  }
}
```

**Cari baris ini (sekitar baris 1104):**
```javascript
// Convert empty strings to null for optional fields
const cleanData = {
  alamat: alamat || null,
```

**Ganti menjadi:**
```javascript
// Convert empty strings to null for optional fields
const cleanData = {
  email: email || null,
  alamat: alamat || null,
```

**Cari baris INSERT (sekitar baris 1133):**
```javascript
[
  nik, nama, email, hashedPassword, 
  cleanData.alamat, cleanData.rt, cleanData.rw, cleanData.dusun,
```

**Ganti menjadi:**
```javascript
[
  nik, nama, cleanData.email, hashedPassword, 
  cleanData.alamat, cleanData.rt, cleanData.rw, cleanData.dusun,
```

**Simpan file:**
- Tekan `Ctrl + X`
- Tekan `Y`
- Tekan `Enter`

---

### STEP 3: Update Database - Make Email Nullable

Jalankan perintah ini di VPS:

```bash
mysql -u desa_user -p surat_desa
```

**Password database:** `DesaPassword123!`

Setelah masuk ke MySQL console, jalankan:

```sql
ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL;

UPDATE users SET email = NULL WHERE email = '' OR email IS NULL;

EXIT;
```

---

### STEP 4: Restart Backend dengan PM2

```bash
pm2 restart desa-backend
pm2 logs desa-backend
```

Pastikan tidak ada error. Tekan `Ctrl + C` untuk keluar dari logs.

---

### STEP 5: Test Backend

```bash
curl http://localhost:5000/api/admin/warga
```

Atau test dari browser:
```
http://72.61.140.193:5000/api/admin/warga
```

---

## ✅ SELESAI!

Backend sudah terupdate. Sekarang Super Admin bisa menambah warga tanpa perlu memasukkan email.

---

## 🔍 Troubleshooting

**Jika PM2 error:**
```bash
pm2 logs desa-backend --lines 50
```

**Jika database error:**
```bash
mysql -u desa_user -p
# Cek struktur tabel
DESCRIBE users;
```

**Jika port 5000 tidak bisa diakses:**
```bash
netstat -tlnp | grep 5000
ufw allow 5000
```

