-- Tambah kolom untuk konfigurasi layout tanda tangan di jenis_surat
-- File: add_signature_layout_to_jenis_surat.sql
-- Date: 2025-11-06

ALTER TABLE jenis_surat 
ADD COLUMN penandatangan JSON COMMENT 'Konfigurasi penandatangan: [{jabatan, posisi, required}]' AFTER format_nomor,
ADD COLUMN layout_ttd ENUM('1_kanan', '2_horizontal', '2_vertical', '3_horizontal', '4_grid') DEFAULT '1_kanan' COMMENT 'Layout tanda tangan' AFTER penandatangan,
ADD COLUMN show_materai BOOLEAN DEFAULT FALSE COMMENT 'Tampilkan box materai' AFTER layout_ttd;

-- Update existing records dengan default: Kepala Desa di kanan
UPDATE jenis_surat 
SET penandatangan = JSON_ARRAY(
  JSON_OBJECT(
    'jabatan', 'kepala_desa',
    'label', 'Kepala Desa Cibadak',
    'posisi', 'kanan_bawah',
    'required', true
  )
),
layout_ttd = '1_kanan',
show_materai = false
WHERE penandatangan IS NULL;

-- Contoh data untuk berbagai layout:

-- Layout 2 horizontal (Ketua RW + Kepala Desa)
-- UPDATE jenis_surat SET 
-- penandatangan = JSON_ARRAY(
--   JSON_OBJECT('jabatan', 'ketua_rw', 'label', 'Ketua RW 008', 'posisi', 'kiri', 'required', true),
--   JSON_OBJECT('jabatan', 'kepala_desa', 'label', 'Kepala Desa Cibadak', 'posisi', 'kanan', 'required', true)
-- ),
-- layout_ttd = '2_horizontal'
-- WHERE kode = 'CONTOH';

-- Layout 3 horizontal (Camat + Kepala Desa + Materai)
-- UPDATE jenis_surat SET 
-- penandatangan = JSON_ARRAY(
--   JSON_OBJECT('jabatan', 'camat', 'label', 'Camat Ciampea', 'posisi', 'kiri', 'required', true),
--   JSON_OBJECT('jabatan', 'kepala_desa', 'label', 'Kepala Desa Cibadak', 'posisi', 'kanan', 'required', true)
-- ),
-- layout_ttd = '3_horizontal',
-- show_materai = true
-- WHERE kode = 'CONTOH';

-- Layout 4 grid (Mengetahui Camat kiri atas + Kepala Desa kanan bawah + 2 lainnya)
-- UPDATE jenis_surat SET 
-- penandatangan = JSON_ARRAY(
--   JSON_OBJECT('jabatan', 'camat', 'label', 'Mengetahui, Camat Ciampea', 'posisi', 'kiri_atas', 'required', true),
--   JSON_OBJECT('jabatan', 'kapolsek', 'label', 'Kapolsek Ciampea', 'posisi', 'kiri_bawah', 'required', false),
--   JSON_OBJECT('jabatan', 'ketua_rw', 'label', 'Ketua RW', 'posisi', 'kanan_atas', 'required', false),
--   JSON_OBJECT('jabatan', 'kepala_desa', 'label', 'Yang Menyatakan, Kepala Desa Cibadak', 'posisi', 'kanan_bawah', 'required', true)
-- ),
-- layout_ttd = '4_grid'
-- WHERE kode = 'CONTOH';
