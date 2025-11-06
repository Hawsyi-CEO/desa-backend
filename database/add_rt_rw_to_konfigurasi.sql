-- Migration: Add RT/RW selection to konfigurasi_surat table
-- Date: 2025-11-06
-- Description: Menambahkan kolom selected_rt dan selected_rw untuk menyimpan pilihan RT/RW yang akan ditampilkan di tanda tangan

USE surat_desa;

-- Add selected_rt column
ALTER TABLE konfigurasi_surat 
ADD COLUMN selected_rt VARCHAR(10) DEFAULT NULL COMMENT 'RT yang dipilih (001, 002, dst)' AFTER nama_danramil;

-- Add selected_rw column
ALTER TABLE konfigurasi_surat 
ADD COLUMN selected_rw VARCHAR(10) DEFAULT NULL COMMENT 'RW yang dipilih (001, 002, dst)' AFTER selected_rt;

-- Verify changes
DESCRIBE konfigurasi_surat;
