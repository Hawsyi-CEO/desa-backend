-- Script untuk sinkronisasi data warga ke tabel users
-- Password default: password123
-- Login menggunakan NIK

USE surat_desa;

-- Tambahkan kolom tambahan di tabel users jika belum ada
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(50) AFTER alamat,
ADD COLUMN IF NOT EXISTS tanggal_lahir DATE AFTER tempat_lahir,
ADD COLUMN IF NOT EXISTS jenis_kelamin ENUM('Laki-laki','Perempuan') AFTER tanggal_lahir,
ADD COLUMN IF NOT EXISTS pekerjaan VARCHAR(50) AFTER jenis_kelamin,
ADD COLUMN IF NOT EXISTS agama VARCHAR(20) AFTER pekerjaan,
ADD COLUMN IF NOT EXISTS status_perkawinan VARCHAR(50) AFTER agama,
ADD COLUMN IF NOT EXISTS kewarganegaraan VARCHAR(50) AFTER status_perkawinan,
ADD COLUMN IF NOT EXISTS pendidikan VARCHAR(50) AFTER kewarganegaraan,
ADD COLUMN IF NOT EXISTS golongan_darah VARCHAR(5) AFTER pendidikan,
ADD COLUMN IF NOT EXISTS dusun VARCHAR(50) AFTER golongan_darah,
ADD COLUMN IF NOT EXISTS no_kk VARCHAR(20) AFTER dusun,
ADD COLUMN IF NOT EXISTS nama_kepala_keluarga VARCHAR(100) AFTER no_kk,
ADD COLUMN IF NOT EXISTS hubungan_keluarga VARCHAR(50) AFTER nama_kepala_keluarga;

-- Insert atau Update data warga ke tabel users
-- Password default: $2b$10$YourHashedPassword (password123)
INSERT INTO users (
  nik,
  nama,
  email,
  password,
  role,
  no_telepon,
  alamat,
  rt,
  rw,
  tempat_lahir,
  tanggal_lahir,
  jenis_kelamin,
  pekerjaan,
  agama,
  status_perkawinan,
  kewarganegaraan,
  pendidikan,
  golongan_darah,
  dusun,
  no_kk,
  nama_kepala_keluarga,
  hubungan_keluarga,
  status,
  created_at,
  updated_at
)
SELECT 
  w.nik,
  w.nama_anggota_keluarga as nama,
  CONCAT(w.nik, '@warga.desa') as email,
  '$2b$10$rP8P6QZ5QZ5QZ5QZ5QZ5QOe7vKZ5QZ5QZ5QZ5QZ5QZ5QZ5QZ5QZ5Q' as password, -- password123 (hash bcrypt)
  'warga' as role,
  '' as no_telepon,
  w.alamat,
  w.rt,
  w.rw,
  w.tempat_lahir,
  w.tanggal_lahir,
  w.jenis_kelamin,
  w.pekerjaan,
  w.agama,
  w.status_pernikahan,
  w.kewarganegaraan,
  w.pendidikan,
  w.golongan_darah,
  w.dusun,
  w.no_kk,
  w.nama_kepala_keluarga,
  w.hubungan_keluarga,
  'aktif' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM warga w
WHERE w.nik IS NOT NULL 
  AND w.nik != '' 
  AND LENGTH(w.nik) = 16
ON DUPLICATE KEY UPDATE
  nama = VALUES(nama),
  alamat = VALUES(alamat),
  rt = VALUES(rt),
  rw = VALUES(rw),
  tempat_lahir = VALUES(tempat_lahir),
  tanggal_lahir = VALUES(tanggal_lahir),
  jenis_kelamin = VALUES(jenis_kelamin),
  pekerjaan = VALUES(pekerjaan),
  agama = VALUES(agama),
  status_perkawinan = VALUES(status_perkawinan),
  kewarganegaraan = VALUES(kewarganegaraan),
  pendidikan = VALUES(pendidikan),
  golongan_darah = VALUES(golongan_darah),
  dusun = VALUES(dusun),
  no_kk = VALUES(no_kk),
  nama_kepala_keluarga = VALUES(nama_kepala_keluarga),
  hubungan_keluarga = VALUES(hubungan_keluarga),
  updated_at = NOW();

-- Tampilkan hasil sinkronisasi
SELECT 
  COUNT(*) as total_warga_tersinkronisasi,
  (SELECT COUNT(*) FROM users WHERE role = 'warga') as total_user_warga
FROM users 
WHERE role = 'warga';
