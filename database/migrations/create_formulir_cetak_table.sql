-- Migration: Create formulir_cetak table
-- Date: 2024-11-02
-- Description: Table untuk menyimpan formulir siap cetak (PDF/DOC)

CREATE TABLE IF NOT EXISTS `formulir_cetak` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_formulir` varchar(255) NOT NULL,
  `kategori` enum('kependudukan','kesehatan','usaha','umum') NOT NULL DEFAULT 'umum',
  `deskripsi` text DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(10) NOT NULL,
  `file_size` int(11) NOT NULL DEFAULT 0,
  `is_fillable` tinyint(1) NOT NULL DEFAULT 0,
  `field_mapping` json DEFAULT NULL,
  `urutan` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `jumlah_download` int(11) NOT NULL DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kategori` (`kategori`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_formulir_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add some indexes for better performance
CREATE INDEX `idx_nama_formulir` ON `formulir_cetak` (`nama_formulir`);
CREATE INDEX `idx_urutan_active` ON `formulir_cetak` (`urutan`, `is_active`);
