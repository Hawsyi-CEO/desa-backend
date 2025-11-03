# 📦 Deployment Guide - Upload File Backend yang Berubah

## File yang Perlu Diupload (Hanya yang baru/berubah):

### ✅ File Baru:
1. `controllers/formulirController.js`
2. `routes/formulir.js`
3. `uploads/formulir/F1.04-1762015377908-374614813.PDF` (optional)
4. `uploads/formulir/f-1762015339726-363505171.docx` (optional)

### ✅ File Modified:
5. `server.js`
6. `generate-hash.js`
7. `.env.production` → upload sebagai `.env`

---

## 🚀 Cara 1: Upload Manual via FileZilla/WinSCP

### A. Download Software:
- **FileZilla**: https://filezilla-project.org/download.php?type=client
- **WinSCP**: https://winscp.net/eng/download.php

### B. Connect ke VPS:
```
Host: sftp://72.61.140.193
Username: root
Password: Vertinova123#
Port: 22
```

### C. Upload Files:
1. Navigate ke: `/var/www/surat-desa-backend/`

2. Upload file-file berikut:
   ```
   controllers/formulirController.js  →  /var/www/surat-desa-backend/controllers/
   routes/formulir.js                 →  /var/www/surat-desa-backend/routes/
   server.js                          →  /var/www/surat-desa-backend/
   generate-hash.js                   →  /var/www/surat-desa-backend/
   .env.production                    →  /var/www/surat-desa-backend/.env (rename!)
   ```

3. (Optional) Upload formulir samples:
   ```
   uploads/formulir/*.PDF    →  /var/www/surat-desa-backend/uploads/formulir/
   uploads/formulir/*.docx   →  /var/www/surat-desa-backend/uploads/formulir/
   ```

### D. Restart Backend:
Buka terminal di FileZilla/WinSCP, jalankan:
```bash
cd /var/www/surat-desa-backend
pm2 restart surat-desa-backend
pm2 logs surat-desa-backend --lines 50
```

---

## 🚀 Cara 2: Upload via SSH Terminal (PowerShell/CMD)

### A. Install OpenSSH Client (jika belum ada):
Windows 10/11:
```
Settings → Apps → Optional Features → Add OpenSSH Client
```

### B. Upload Files via SCP:
```powershell
# 1. Upload controllers/formulirController.js
scp controllers/formulirController.js root@72.61.140.193:/var/www/surat-desa-backend/controllers/

# 2. Upload routes/formulir.js
scp routes/formulir.js root@72.61.140.193:/var/www/surat-desa-backend/routes/

# 3. Upload server.js
scp server.js root@72.61.140.193:/var/www/surat-desa-backend/

# 4. Upload generate-hash.js
scp generate-hash.js root@72.61.140.193:/var/www/surat-desa-backend/

# 5. Upload .env.production sebagai .env
scp .env.production root@72.61.140.193:/var/www/surat-desa-backend/.env

# 6. (Optional) Upload formulir files
scp uploads/formulir/*.PDF root@72.61.140.193:/var/www/surat-desa-backend/uploads/formulir/
scp uploads/formulir/*.docx root@72.61.140.193:/var/www/surat-desa-backend/uploads/formulir/
```

Password: `Vertinova123#`

### C. Connect SSH dan Restart:
```powershell
ssh root@72.61.140.193
# Masukkan password: Vertinova123#

# Setelah connect:
cd /var/www/surat-desa-backend
pm2 restart surat-desa-backend
pm2 logs surat-desa-backend --lines 50
```

---

## 🚀 Cara 3: Jalankan Script Otomatis

### Jalankan PowerShell Script:
```powershell
cd C:\laragon\www\desa\backend
.\deploy-update.ps1
```

ATAU jalankan Bash script (jika ada Git Bash):
```bash
cd /c/laragon/www/desa/backend
chmod +x deploy-update.sh
./deploy-update.sh
```

---

## ✅ Verifikasi Deployment

### 1. Cek Backend Running:
```bash
ssh root@72.61.140.193
pm2 status
```

### 2. Cek Logs:
```bash
pm2 logs surat-desa-backend --lines 100
```

### 3. Test API:
```bash
curl http://72.61.140.193:3000/api
# atau
curl https://api.suratmuliya.id/api
```

### 4. Test Endpoint Formulir Baru:
```bash
curl http://72.61.140.193:3000/api/formulir
```

---

## 🔧 Troubleshooting

### Jika PM2 tidak restart:
```bash
pm2 delete surat-desa-backend
pm2 start server.js --name surat-desa-backend
pm2 save
```

### Jika ada error database:
```bash
# Cek koneksi database
mysql -u u390486773_cibadak -p
# Password: Cibadak123!

# Test connection dari Node.js
cd /var/www/surat-desa-backend
node -e "require('./config/database').query('SELECT 1', console.log)"
```

### Jika ada permission error:
```bash
cd /var/www/surat-desa-backend
chown -R www-data:www-data uploads/
chmod -R 755 uploads/
```

---

## 📊 File Structure Setelah Upload

```
/var/www/surat-desa-backend/
├── controllers/
│   ├── ... (existing files)
│   └── formulirController.js ← NEW
├── routes/
│   ├── ... (existing files)
│   └── formulir.js ← NEW
├── uploads/
│   └── formulir/ ← NEW FOLDER
│       ├── F1.04-1762015377908-374614813.PDF
│       └── f-1762015339726-363505171.docx
├── server.js ← MODIFIED
├── generate-hash.js ← MODIFIED
└── .env ← UPDATED (.env.production)
```

---

## 🎯 Yang TIDAK Diubah (Data Tetap Aman):

✅ Database (u390486773_cibadak) - Tidak tersentuh
✅ User data existing - Tidak tersentuh
✅ Surat existing - Tidak tersentuh
✅ File upload existing - Tidak tersentuh
✅ Konfigurasi Nginx - Tidak tersentuh
✅ SSL Certificate - Tidak tersentuh

Hanya menambahkan **fitur baru** tanpa menghapus yang lama! 🎉
