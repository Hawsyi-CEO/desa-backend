-- =====================================================
-- Migration: Multi-Level Verification System
-- RT Verifikator → RW Verifikator → Super Admin
-- =====================================================

-- 1. Update jenis_surat table - add verification level settings
ALTER TABLE jenis_surat 
  ADD COLUMN require_rt_verification BOOLEAN DEFAULT TRUE COMMENT 'Perlu verifikasi RT',
  ADD COLUMN require_rw_verification BOOLEAN DEFAULT TRUE COMMENT 'Perlu verifikasi RW',
  MODIFY COLUMN require_verification BOOLEAN DEFAULT TRUE COMMENT 'Perlu verifikasi (deprecated - use RT/RW flags)';

-- 2. Create verification_flow table - track approval stages
CREATE TABLE IF NOT EXISTS verification_flow (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pengajuan_id INT NOT NULL,
  level_type ENUM('rt', 'rw', 'admin') NOT NULL COMMENT 'Tingkat verifikasi',
  verifier_id INT NULL COMMENT 'User ID yang melakukan verifikasi',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  keterangan TEXT,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pengajuan_id) REFERENCES pengajuan_surat(id) ON DELETE CASCADE,
  FOREIGN KEY (verifier_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_pengajuan (pengajuan_id),
  INDEX idx_status (status),
  INDEX idx_level (level_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Update pengajuan_surat table - add current verification level
ALTER TABLE pengajuan_surat
  ADD COLUMN current_verification_level ENUM('rt', 'rw', 'admin', 'completed') DEFAULT 'rt' COMMENT 'Tingkat verifikasi saat ini',
  ADD COLUMN rt_verifier_id INT NULL COMMENT 'Verifikator RT yang handle',
  ADD COLUMN rw_verifier_id INT NULL COMMENT 'Verifikator RW yang handle',
  ADD COLUMN admin_verifier_id INT NULL COMMENT 'Admin yang handle',
  ADD FOREIGN KEY (rt_verifier_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD FOREIGN KEY (rw_verifier_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD FOREIGN KEY (admin_verifier_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Update status values for better clarity
-- Status workflow: 
-- 'draft' → 'menunggu_verifikasi_rt' → 'menunggu_verifikasi_rw' → 'menunggu_admin' → 'disetujui' → 'selesai'

-- 5. Add RT/RW assignment to verifikator users
ALTER TABLE users
  ADD COLUMN verifikator_level ENUM('rt', 'rw') NULL COMMENT 'Level verifikator: RT atau RW',
  ADD COLUMN assigned_rt VARCHAR(10) NULL COMMENT 'RT yang ditangani (untuk verifikator RT)',
  ADD COLUMN assigned_rw VARCHAR(10) NULL COMMENT 'RW yang ditangani (untuk verifikator RW)';

-- 6. Sample data - Set existing jenis surat to require both RT and RW verification
UPDATE jenis_surat 
SET 
  require_rt_verification = TRUE,
  require_rw_verification = TRUE
WHERE status = 'aktif';

-- Khusus untuk surat yang tidak perlu verifikasi multi-level (misal: surat pengantar sederhana)
-- UPDATE jenis_surat 
-- SET 
--   require_rt_verification = FALSE,
--   require_rw_verification = FALSE
-- WHERE kode_surat = 'SP'; -- contoh

-- 7. Create view for easy verification queue checking
CREATE OR REPLACE VIEW v_verification_queue AS
SELECT 
  ps.id AS pengajuan_id,
  ps.user_id,
  u.nama AS pemohon_nama,
  u.rt AS pemohon_rt,
  u.rw AS pemohon_rw,
  ps.jenis_surat_id,
  js.nama_surat,
  ps.status_surat,
  ps.current_verification_level,
  vf.id AS verification_flow_id,
  vf.level_type,
  vf.status AS verification_status,
  vf.verifier_id,
  v.nama AS verifier_nama,
  ps.created_at AS pengajuan_created_at,
  vf.verified_at
FROM pengajuan_surat ps
JOIN users u ON ps.user_id = u.id
JOIN jenis_surat js ON ps.jenis_surat_id = js.id
LEFT JOIN verification_flow vf ON ps.id = vf.pengajuan_id 
  AND vf.level_type = ps.current_verification_level
LEFT JOIN users v ON vf.verifier_id = v.id
WHERE ps.status_surat LIKE 'menunggu%';

-- 8. Insert sample verifikator RT and RW (optional - for testing)
-- Verifikator RT 001/RW 001
-- INSERT INTO users (nik, nama, email, password, role, verifikator_level, assigned_rt, assigned_rw, rt, rw, status) 
-- VALUES ('1234567890000001', 'Verifikator RT 001', 'vrt001@desa.com', '$2a$10$...', 'verifikator', 'rt', '001', NULL, '001', '001', 'aktif');

-- Verifikator RW 001
-- INSERT INTO users (nik, nama, email, password, role, verifikator_level, assigned_rw, rt, rw, status) 
-- VALUES ('1234567890000002', 'Verifikator RW 001', 'vrw001@desa.com', '$2a$10$...', 'verifikator', 'rw', '001', NULL, '001', 'aktif');

-- 9. Create function to auto-create verification flow when surat is submitted
DELIMITER //

CREATE TRIGGER after_pengajuan_insert 
AFTER INSERT ON pengajuan_surat
FOR EACH ROW
BEGIN
  DECLARE need_rt BOOLEAN;
  DECLARE need_rw BOOLEAN;
  
  -- Get verification requirements for this jenis surat
  SELECT require_rt_verification, require_rw_verification 
  INTO need_rt, need_rw
  FROM jenis_surat 
  WHERE id = NEW.jenis_surat_id;
  
  -- Create RT verification step if needed
  IF need_rt THEN
    INSERT INTO verification_flow (pengajuan_id, level_type, status)
    VALUES (NEW.id, 'rt', 'pending');
  END IF;
  
  -- Create RW verification step if needed
  IF need_rw THEN
    INSERT INTO verification_flow (pengajuan_id, level_type, status)
    VALUES (NEW.id, 'rw', 'pending');
  END IF;
  
  -- Always create admin verification step
  INSERT INTO verification_flow (pengajuan_id, level_type, status)
  VALUES (NEW.id, 'admin', 'pending');
END//

DELIMITER ;

-- =====================================================
-- Notes:
-- =====================================================
-- Status Workflow:
-- 1. Warga submit → status: 'menunggu_verifikasi_rt', level: 'rt'
-- 2. RT approve → status: 'menunggu_verifikasi_rw', level: 'rw'
-- 3. RW approve → status: 'menunggu_admin', level: 'admin'
-- 4. Admin approve → status: 'disetujui', level: 'completed'
-- 5. Admin generate surat → status: 'selesai'
--
-- Rejection at any level → status: 'ditolak'
-- =====================================================
