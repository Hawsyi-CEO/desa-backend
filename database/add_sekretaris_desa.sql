-- Tambah kolom untuk sekretaris desa
USE surat_desa;

ALTER TABLE konfigurasi_surat 
ADD COLUMN nama_sekretaris VARCHAR(100) DEFAULT NULL AFTER nip_ttd,
ADD COLUMN nip_sekretaris VARCHAR(50) DEFAULT NULL AFTER nama_sekretaris;

-- Update data default jika ada
UPDATE konfigurasi_surat 
SET nama_sekretaris = 'Nama Sekretaris Desa',
    nip_sekretaris = 'NIP Sekretaris'
WHERE id = 1;
