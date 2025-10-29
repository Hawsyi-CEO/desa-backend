-- Menambahkan kolom kalimat_pembuka ke tabel jenis_surat
USE surat_desa;

-- Tambah kolom kalimat_pembuka
ALTER TABLE jenis_surat 
ADD COLUMN kalimat_pembuka TEXT DEFAULT 'Yang bertanda tangan di bawah ini, Kepala Desa Cibadak, dengan ini menerangkan bahwa :' 
AFTER format_nomor;

-- Update existing records dengan default value
UPDATE jenis_surat 
SET kalimat_pembuka = 'Yang bertanda tangan di bawah ini, Kepala Desa ..., dengan ini menerangkan bahwa :' 
WHERE kalimat_pembuka IS NULL OR kalimat_pembuka = '';
