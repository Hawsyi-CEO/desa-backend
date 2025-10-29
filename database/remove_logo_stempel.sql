-- Script untuk menghapus kolom logo dan stempel dari konfigurasi_surat
-- Karena logo dan stempel harus asli, tidak perlu disimpan di system

USE surat_desa;

-- Hapus kolom terkait logo dan stempel (satu per satu)
ALTER TABLE konfigurasi_surat DROP COLUMN logo_url;
ALTER TABLE konfigurasi_surat DROP COLUMN stempel_url;
ALTER TABLE konfigurasi_surat DROP COLUMN gunakan_stempel;

-- Informasi: Logo sekarang menggunakan file baku di frontend/src/assets/Lambang_Kabupaten_Bogor.png
-- Tanda tangan dan stempel harus ditandatangani secara manual setelah surat dicetak
