-- Tambah kolom format_nomor ke tabel jenis_surat
-- Format nomor surat akan unik untuk setiap jenis surat

ALTER TABLE jenis_surat 
ADD COLUMN format_nomor VARCHAR(255) DEFAULT '{nomor}/{kode_surat}/{bulan}/{tahun}' AFTER template_konten;

-- Update jenis surat yang sudah ada dengan format default
UPDATE jenis_surat 
SET format_nomor = '{nomor}/{kode_surat}/{bulan}/{tahun}'
WHERE format_nomor IS NULL;

-- Contoh format nomor:
-- {nomor}/{kode_surat}/{bulan}/{tahun} = 001/SKD/10/2025
-- {nomor}/Ket/{kode_surat}/{tahun} = 001/Ket/SKD/2025
-- {kode_surat}-{nomor}/{tahun} = SKD-001/2025
-- Dsb.

