-- Tabel untuk menyimpan formulir siap cetak
-- Super admin upload, warga universal download/print

CREATE TABLE IF NOT EXISTS `formulir_cetak` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_formulir` varchar(255) NOT NULL COMMENT 'Nama formulir (ex: Formulir Permohonan KTP)',
  `kategori` enum('kependudukan','kesehatan','usaha','umum') DEFAULT 'umum' COMMENT 'Kategori formulir',
  `deskripsi` text COMMENT 'Deskripsi formulir',
  `file_path` varchar(500) NOT NULL COMMENT 'Path file di server',
  `file_name` varchar(255) NOT NULL COMMENT 'Nama file original',
  `file_type` varchar(50) NOT NULL COMMENT 'Tipe file (pdf, docx, doc)',
  `file_size` int(11) DEFAULT NULL COMMENT 'Ukuran file dalam bytes',
  `urutan` int(11) DEFAULT 0 COMMENT 'Urutan tampilan',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '1=aktif, 0=nonaktif',
  `jumlah_download` int(11) DEFAULT 0 COMMENT 'Counter jumlah download',
  `created_by` int(11) DEFAULT NULL COMMENT 'ID user yang upload',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kategori` (`kategori`),
  KEY `idx_active` (`is_active`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_formulir_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel formulir siap cetak untuk warga universal';
