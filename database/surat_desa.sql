-- Surat Digital Desa Database Schema

-- Database
CREATE DATABASE IF NOT EXISTS surat_desa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE surat_desa;

-- Table: users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nik VARCHAR(16) UNIQUE NOT NULL,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin', 'warga') NOT NULL DEFAULT 'warga',
  no_telepon VARCHAR(15),
  alamat TEXT,
  rt VARCHAR(5),
  rw VARCHAR(5),
  foto_profile VARCHAR(255),
  status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_rt_rw (rt, rw)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: jenis_surat
CREATE TABLE jenis_surat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_surat VARCHAR(100) NOT NULL,
  kode_surat VARCHAR(20) UNIQUE NOT NULL,
  deskripsi TEXT,
  template_konten TEXT NOT NULL,
  fields JSON NOT NULL COMMENT 'Array of field definitions: [{name, label, type, required, options}]',
  require_verification BOOLEAN DEFAULT TRUE COMMENT 'Apakah perlu verifikasi RT/RW',
  status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_kode (kode_surat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: pengajuan_surat
CREATE TABLE pengajuan_surat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no_surat VARCHAR(50) UNIQUE,
  jenis_surat_id INT NOT NULL,
  user_id INT NOT NULL,
  data_surat JSON NOT NULL COMMENT 'Data yang diisi oleh warga sesuai fields',
  keperluan TEXT,
  lampiran VARCHAR(255),
  status_surat ENUM('draft', 'menunggu_verifikasi', 'diverifikasi', 'disetujui', 'ditolak') DEFAULT 'draft',
  verifikator_id INT COMMENT 'Admin RT/RW yang verifikasi',
  verifikasi_at TIMESTAMP NULL,
  catatan_verifikasi TEXT,
  approved_by INT COMMENT 'Super admin yang approve',
  approved_at TIMESTAMP NULL,
  catatan_approval TEXT,
  rejected_by INT,
  rejected_at TIMESTAMP NULL,
  catatan_reject TEXT,
  tanggal_surat DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (jenis_surat_id) REFERENCES jenis_surat(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verifikator_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status_surat),
  INDEX idx_user (user_id),
  INDEX idx_jenis (jenis_surat_id),
  INDEX idx_no_surat (no_surat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: riwayat_surat
CREATE TABLE riwayat_surat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pengajuan_id INT NOT NULL,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pengajuan_id) REFERENCES pengajuan_surat(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_pengajuan (pengajuan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default users
-- NOTE: Password untuk semua user: admin123 (untuk super_admin dan admin) atau warga123 (untuk warga)
-- Untuk keamanan, ubah password setelah login pertama kali
INSERT INTO users (nik, nama, email, password, role, no_telepon, alamat, rt, rw, status) VALUES
-- Password: admin123
('1234567890123456', 'Super Admin', 'superadmin@desa.com', '$2a$10$h.lDrmeGbAOn7FjarZzV7.10Hbg4uSZLXaVTTR/HFAMhciToOE9PS', 'super_admin', '081234567890', 'Kantor Desa', '001', '001', 'aktif'),
-- Password: admin123
('2234567890123456', 'Admin RT 01', 'admin@desa.com', '$2a$10$h.lDrmeGbAOn7FjarZzV7.10Hbg4uSZLXaVTTR/HFAMhciToOE9PS', 'admin', '081234567891', 'RT 01/RW 01', '001', '001', 'aktif'),
-- Password: warga123
('3234567890123456', 'Warga Contoh', 'warga@desa.com', '$2a$10$OLzZNfV0T4cUTlEk4iEdCuAWCT2ZykdGmH2eFVr58qcqB4fSHKLd6', 'warga', '081234567892', 'Jl. Contoh No. 123', '001', '001', 'aktif');

-- Insert sample jenis surat
INSERT INTO jenis_surat (nama_surat, kode_surat, deskripsi, template_konten, fields, require_verification, status, created_by) VALUES
('Surat Keterangan Domisili', 'SKD', 'Surat keterangan tempat tinggal', 
'Yang bertanda tangan di bawah ini, Kepala Desa {{nama_desa}}, menerangkan bahwa:\n\nNama: {{nama}}\nNIK: {{nik}}\nTempat/Tanggal Lahir: {{tempat_lahir}}/{{tanggal_lahir}}\nAlamat: {{alamat}}\nRT/RW: {{rt}}/{{rw}}\n\nBenar adalah warga yang berdomisili di wilayah kami.\n\nDemikian surat keterangan ini dibuat untuk {{keperluan}}.', 
'[{"name":"nama","label":"Nama Lengkap","type":"text","required":true},{"name":"nik","label":"NIK","type":"text","required":true},{"name":"tempat_lahir","label":"Tempat Lahir","type":"text","required":true},{"name":"tanggal_lahir","label":"Tanggal Lahir","type":"date","required":true},{"name":"alamat","label":"Alamat","type":"textarea","required":true},{"name":"rt","label":"RT","type":"text","required":true},{"name":"rw","label":"RW","type":"text","required":true},{"name":"keperluan","label":"Keperluan","type":"text","required":true}]',
TRUE, 'aktif', 1),

('Surat Keterangan Usaha', 'SKU', 'Surat keterangan memiliki usaha',
'Yang bertanda tangan di bawah ini, Kepala Desa {{nama_desa}}, menerangkan bahwa:\n\nNama: {{nama}}\nNIK: {{nik}}\nAlamat: {{alamat}}\n\nBenar memiliki usaha:\nNama Usaha: {{nama_usaha}}\nJenis Usaha: {{jenis_usaha}}\nAlamat Usaha: {{alamat_usaha}}\nBerdiri Sejak: {{tahun_berdiri}}\n\nDemikian surat keterangan ini dibuat untuk {{keperluan}}.',
'[{"name":"nama","label":"Nama Lengkap","type":"text","required":true},{"name":"nik","label":"NIK","type":"text","required":true},{"name":"alamat","label":"Alamat","type":"textarea","required":true},{"name":"nama_usaha","label":"Nama Usaha","type":"text","required":true},{"name":"jenis_usaha","label":"Jenis Usaha","type":"text","required":true},{"name":"alamat_usaha","label":"Alamat Usaha","type":"textarea","required":true},{"name":"tahun_berdiri","label":"Tahun Berdiri","type":"number","required":true},{"name":"keperluan","label":"Keperluan","type":"text","required":true}]',
TRUE, 'aktif', 1),

('Surat Keterangan Tidak Mampu', 'SKTM', 'Surat keterangan tidak mampu',
'Yang bertanda tangan di bawah ini, Kepala Desa {{nama_desa}}, menerangkan bahwa:\n\nNama: {{nama}}\nNIK: {{nik}}\nTempat/Tanggal Lahir: {{tempat_lahir}}/{{tanggal_lahir}}\nPekerjaan: {{pekerjaan}}\nAlamat: {{alamat}}\n\nAdalah benar warga kami yang kurang mampu.\n\nDemikian surat keterangan ini dibuat untuk {{keperluan}}.',
'[{"name":"nama","label":"Nama Lengkap","type":"text","required":true},{"name":"nik","label":"NIK","type":"text","required":true},{"name":"tempat_lahir","label":"Tempat Lahir","type":"text","required":true},{"name":"tanggal_lahir","label":"Tanggal Lahir","type":"date","required":true},{"name":"pekerjaan","label":"Pekerjaan","type":"text","required":true},{"name":"alamat","label":"Alamat","type":"textarea","required":true},{"name":"keperluan","label":"Keperluan","type":"text","required":true}]',
TRUE, 'aktif', 1);
