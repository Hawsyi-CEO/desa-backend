-- Tambahkan kolom tambahan ke tabel users untuk data warga
-- Database: surat_desa

USE surat_desa;

-- Cek struktur tabel users saat ini
DESCRIBE users;

-- Tambahkan kolom satu per satu
ALTER TABLE users 
ADD COLUMN tempat_lahir VARCHAR(50) AFTER alamat;

ALTER TABLE users 
ADD COLUMN tanggal_lahir DATE AFTER tempat_lahir;

ALTER TABLE users 
ADD COLUMN jenis_kelamin ENUM('Laki-laki','Perempuan') AFTER tanggal_lahir;

ALTER TABLE users 
ADD COLUMN pekerjaan VARCHAR(50) AFTER jenis_kelamin;

ALTER TABLE users 
ADD COLUMN agama VARCHAR(20) AFTER pekerjaan;

ALTER TABLE users 
ADD COLUMN status_perkawinan VARCHAR(50) AFTER agama;

ALTER TABLE users 
ADD COLUMN kewarganegaraan VARCHAR(50) DEFAULT 'Indonesia' AFTER status_perkawinan;

ALTER TABLE users 
ADD COLUMN pendidikan VARCHAR(50) AFTER kewarganegaraan;

ALTER TABLE users 
ADD COLUMN golongan_darah VARCHAR(5) AFTER pendidikan;

ALTER TABLE users 
ADD COLUMN dusun VARCHAR(50) AFTER golongan_darah;

ALTER TABLE users 
ADD COLUMN no_kk VARCHAR(20) AFTER dusun;

ALTER TABLE users 
ADD COLUMN nama_kepala_keluarga VARCHAR(100) AFTER no_kk;

ALTER TABLE users 
ADD COLUMN hubungan_keluarga VARCHAR(50) AFTER nama_kepala_keluarga;

-- Tampilkan struktur tabel setelah ditambahkan
SELECT 'Kolom tambahan berhasil ditambahkan!' as Status;
DESCRIBE users;
