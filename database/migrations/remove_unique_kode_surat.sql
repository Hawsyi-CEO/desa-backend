-- Migration: Remove UNIQUE constraint from kode_surat
-- Date: 2025-11-10
-- Reason: kode_surat adalah kode bidang, bukan kode unik per jenis surat
-- Beberapa jenis surat dapat memiliki kode_surat yang sama

-- Drop UNIQUE constraint, tapi tetap pertahankan INDEX untuk performance
ALTER TABLE jenis_surat DROP INDEX kode_surat;

-- Verifikasi: idx_kode masih ada untuk performance query
-- SHOW INDEX FROM jenis_surat WHERE Key_name = 'idx_kode';
