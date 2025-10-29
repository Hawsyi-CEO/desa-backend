-- Tambah kolom auto_generate_nomor ke tabel jenis_surat
-- Untuk menentukan apakah nomor surat di-generate otomatis atau input manual

ALTER TABLE jenis_surat 
ADD COLUMN auto_generate_nomor BOOLEAN DEFAULT TRUE AFTER format_nomor;

-- Update jenis surat yang sudah ada
UPDATE jenis_surat 
SET auto_generate_nomor = TRUE
WHERE auto_generate_nomor IS NULL;

-- Keterangan:
-- TRUE = Nomor surat di-generate otomatis oleh sistem
-- FALSE = Admin input nomor surat manual saat approve
