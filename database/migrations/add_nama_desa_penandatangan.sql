-- Migration: Add nama_desa_penandatangan column to konfigurasi_surat table
-- Date: 2025-10-30
-- Description: Menambahkan kolom nama_desa_penandatangan untuk format nama desa di tanggal & tanda tangan

ALTER TABLE konfigurasi_surat 
ADD COLUMN nama_desa_penandatangan VARCHAR(100) NULL 
AFTER nama_desa;

-- Update existing data with default value
UPDATE konfigurasi_surat 
SET nama_desa_penandatangan = 'Cibadak' 
WHERE nama_desa_penandatangan IS NULL;

-- Comment
ALTER TABLE konfigurasi_surat 
MODIFY COLUMN nama_desa_penandatangan VARCHAR(100) NULL 
COMMENT 'Nama desa untuk tanggal dan tanda tangan (proper case format)';
