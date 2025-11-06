-- Tambah kolom nama penandatangan dinamis ke tabel konfigurasi
-- File: add_penandatangan_to_konfigurasi.sql
-- Date: 2025-11-06

ALTER TABLE konfigurasi
ADD COLUMN nama_sekretaris VARCHAR(100) DEFAULT NULL COMMENT 'Nama Sekretaris Desa' AFTER nama_ttd,
ADD COLUMN nip_sekretaris VARCHAR(50) DEFAULT NULL COMMENT 'NIP Sekretaris Desa' AFTER nama_sekretaris,
ADD COLUMN nama_camat VARCHAR(100) DEFAULT NULL COMMENT 'Nama Camat' AFTER nip_sekretaris,
ADD COLUMN nama_kapolsek VARCHAR(100) DEFAULT NULL COMMENT 'Nama Kapolsek' AFTER nama_camat,
ADD COLUMN nama_danramil VARCHAR(100) DEFAULT NULL COMMENT 'Nama Danramil' AFTER nama_kapolsek;

-- Update existing record dengan contoh data (opsional)
-- UPDATE konfigurasi SET 
-- nama_sekretaris = 'NAMA SEKRETARIS DESA',
-- nip_sekretaris = '197001011990031001',
-- nama_camat = 'NAMA CAMAT CIAMPEA, S.Sos',
-- nama_kapolsek = 'AKP NAMA KAPOLSEK',
-- nama_danramil = 'LETTU NAMA DANRAMIL'
-- WHERE id = 1;
