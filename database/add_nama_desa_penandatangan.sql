-- Tambahkan kolom nama_desa_penandatangan untuk format proper case di tanggal surat
USE surat_desa;

-- Cek apakah kolom sudah ada
SET @col_exists = (SELECT COUNT(*) 
                   FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'surat_desa' 
                   AND TABLE_NAME = 'konfigurasi_surat' 
                   AND COLUMN_NAME = 'nama_desa_penandatangan');

-- Tambah kolom jika belum ada
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE konfigurasi_surat ADD COLUMN nama_desa_penandatangan VARCHAR(100) DEFAULT ''Cibadak'' AFTER nama_desa',
  'SELECT "Kolom nama_desa_penandatangan sudah ada"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update data yang sudah ada
UPDATE konfigurasi_surat 
SET nama_desa_penandatangan = 'Cibadak' 
WHERE nama_desa_penandatangan IS NULL OR nama_desa_penandatangan = '';

SELECT 'Migration completed successfully!' AS status;
SELECT * FROM konfigurasi_surat;
