-- ============================================
-- MIGRATION SCRIPT AFTER GIT PULL
-- Date: 2025-11-06
-- Description: Jalankan semua migration yang diperlukan setelah git pull
-- ============================================

USE surat_desa;

-- ============================================
-- 1. CREATE NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pengajuan_id INT DEFAULT NULL,
  type VARCHAR(50) NOT NULL COMMENT 'created, approved, rejected, verified, etc',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  read_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_pengajuan_id (pengajuan_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pengajuan_id) REFERENCES pengajuan_surat(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'notifications table created' as status;

-- ============================================
-- 2. ADD SIGNATURE LAYOUT TO JENIS_SURAT (HARUS DULUAN)
-- ============================================
SET @exist_penandatangan := (SELECT COUNT(*) FROM information_schema.columns 
                              WHERE table_schema = 'surat_desa' 
                              AND table_name = 'jenis_surat' 
                              AND column_name = 'penandatangan');

SET @sqlstmt := IF(@exist_penandatangan = 0, 
  'ALTER TABLE jenis_surat ADD COLUMN penandatangan JSON COMMENT ''Konfigurasi penandatangan: [{jabatan, posisi, required}]'' AFTER format_nomor', 
  'SELECT ''penandatangan already exists'' as status');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;

SET @exist_layout := (SELECT COUNT(*) FROM information_schema.columns 
                       WHERE table_schema = 'surat_desa' 
                       AND table_name = 'jenis_surat' 
                       AND column_name = 'layout_ttd');

SET @sqlstmt := IF(@exist_layout = 0, 
  'ALTER TABLE jenis_surat ADD COLUMN layout_ttd ENUM(''1_kanan'', ''2_horizontal'', ''2_vertical'', ''3_horizontal'', ''4_grid'') DEFAULT ''1_kanan'' COMMENT ''Layout tanda tangan'' AFTER penandatangan', 
  'SELECT ''layout_ttd already exists'' as status');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;

SET @exist_materai := (SELECT COUNT(*) FROM information_schema.columns 
                        WHERE table_schema = 'surat_desa' 
                        AND table_name = 'jenis_surat' 
                        AND column_name = 'show_materai');

SET @sqlstmt := IF(@exist_materai = 0, 
  'ALTER TABLE jenis_surat ADD COLUMN show_materai BOOLEAN DEFAULT FALSE COMMENT ''Tampilkan box materai'' AFTER layout_ttd', 
  'SELECT ''show_materai already exists'' as status');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;

-- Update existing records dengan default: Kepala Desa di kanan
UPDATE jenis_surat 
SET penandatangan = JSON_ARRAY(
  JSON_OBJECT(
    'jabatan', 'kepala_desa',
    'label', 'Kepala Desa Cibadak',
    'posisi', 'kanan_bawah',
    'required', true
  )
),
layout_ttd = '1_kanan',
show_materai = false
WHERE penandatangan IS NULL;

SELECT 'signature layout columns added to jenis_surat' as status;

-- ============================================
-- 3. ADD PAPER SIZE TO JENIS_SURAT (SETELAH show_materai ada)
-- ============================================
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = 'surat_desa' 
               AND table_name = 'jenis_surat' 
               AND column_name = 'paper_size');

SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE jenis_surat ADD COLUMN paper_size ENUM(''a4'', ''legal'') DEFAULT ''a4'' COMMENT ''Ukuran kertas untuk surat'' AFTER show_materai', 
  'SELECT ''paper_size already exists'' as status');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;

SELECT 'paper_size column checked/added to jenis_surat' as status;

-- ============================================
-- 4. ADD PENANDATANGAN TO KONFIGURASI_SURAT
-- ============================================
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = 'surat_desa' AND table_name = 'konfigurasi_surat' AND column_name = 'nama_sekretaris');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE konfigurasi_surat ADD COLUMN nama_sekretaris VARCHAR(100) DEFAULT NULL COMMENT ''Nama Sekretaris Desa''', 'SELECT 1');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = 'surat_desa' AND table_name = 'konfigurasi_surat' AND column_name = 'nip_sekretaris');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE konfigurasi_surat ADD COLUMN nip_sekretaris VARCHAR(50) DEFAULT NULL COMMENT ''NIP Sekretaris Desa'' AFTER nama_sekretaris', 'SELECT 1');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = 'surat_desa' AND table_name = 'konfigurasi_surat' AND column_name = 'nama_camat');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE konfigurasi_surat ADD COLUMN nama_camat VARCHAR(100) DEFAULT NULL COMMENT ''Nama Camat'' AFTER nip_sekretaris', 'SELECT 1');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = 'surat_desa' AND table_name = 'konfigurasi_surat' AND column_name = 'nama_kapolsek');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE konfigurasi_surat ADD COLUMN nama_kapolsek VARCHAR(100) DEFAULT NULL COMMENT ''Nama Kapolsek'' AFTER nama_camat', 'SELECT 1');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = 'surat_desa' AND table_name = 'konfigurasi_surat' AND column_name = 'nama_danramil');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE konfigurasi_surat ADD COLUMN nama_danramil VARCHAR(100) DEFAULT NULL COMMENT ''Nama Danramil'' AFTER nama_kapolsek', 'SELECT 1');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt;

SELECT 'penandatangan columns checked/added to konfigurasi_surat' as status;

-- ============================================
-- 5. ADD RT/RW TO KONFIGURASI_SURAT
-- ============================================
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = 'surat_desa' AND table_name = 'konfigurasi_surat' AND column_name = 'selected_rt');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE konfigurasi_surat ADD COLUMN selected_rt VARCHAR(10) DEFAULT NULL COMMENT ''RT yang dipilih (001, 002, dst)''', 'SELECT 1');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = 'surat_desa' AND table_name = 'konfigurasi_surat' AND column_name = 'selected_rw');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE konfigurasi_surat ADD COLUMN selected_rw VARCHAR(10) DEFAULT NULL COMMENT ''RW yang dipilih (001, 002, dst)'' AFTER selected_rt', 'SELECT 1');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt;

SELECT 'RT/RW columns checked/added to konfigurasi_surat' as status;

-- ============================================
-- VERIFICATION: Check all tables exist
-- ============================================
SELECT 
  'MIGRATION COMPLETED!' as message,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'surat_desa' AND table_name = 'notifications') as notifications_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'surat_desa' AND table_name = 'jenis_surat' AND column_name = 'paper_size') as paper_size_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'surat_desa' AND table_name = 'jenis_surat' AND column_name = 'penandatangan') as penandatangan_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'surat_desa' AND table_name = 'konfigurasi_surat' AND column_name = 'nama_sekretaris') as nama_sekretaris_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'surat_desa' AND table_name = 'konfigurasi_surat' AND column_name = 'selected_rt') as selected_rt_exists;

-- ============================================
-- DONE!
-- ============================================
