const mysql = require('mysql2/promise');

async function migrate() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'surat_desa'
  });

  try {
    console.log('Starting Multi-Level Verification Migration...\n');

    // 1. Add verifikator level fields to users table
    console.log('1️⃣ Adding verifikator_level fields to users...');
    try {
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN verifikator_level ENUM('rt', 'rw') NULL COMMENT 'Level verifikator: RT atau RW'
      `);
      console.log('   ✓ verifikator_level added');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('   ⚠ verifikator_level already exists');
      } else throw err;
    }

    // 2. Add RT/RW verification settings to jenis_surat
    console.log('\n2️⃣ Adding RT/RW verification settings to jenis_surat...');
    try {
      await db.query(`
        ALTER TABLE jenis_surat 
        ADD COLUMN require_rt_verification BOOLEAN DEFAULT TRUE COMMENT 'Perlu verifikasi RT',
        ADD COLUMN require_rw_verification BOOLEAN DEFAULT TRUE COMMENT 'Perlu verifikasi RW'
      `);
      console.log('   ✓ require_rt_verification added');
      console.log('   ✓ require_rw_verification added');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('   ⚠ Verification columns already exist');
      } else throw err;
    }

    // 3. Create verification_flow table
    console.log('\n3️⃣ Creating verification_flow table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS verification_flow (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pengajuan_id INT NOT NULL,
        level_type ENUM('rt', 'rw', 'admin') NOT NULL COMMENT 'Tingkat verifikasi',
        sequence_order INT NOT NULL COMMENT 'Urutan verifikasi',
        verifier_id INT NULL COMMENT 'User ID yang melakukan verifikasi',
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        keterangan TEXT COMMENT 'Catatan verifikator',
        verified_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (pengajuan_id) REFERENCES pengajuan_surat(id) ON DELETE CASCADE,
        FOREIGN KEY (verifier_id) REFERENCES users(id) ON DELETE SET NULL,
        
        INDEX idx_pengajuan (pengajuan_id),
        INDEX idx_status (status),
        INDEX idx_level (level_type),
        INDEX idx_sequence (pengajuan_id, sequence_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ verification_flow table created');

    // 4. Update pengajuan_surat status enum
    console.log('\n4️⃣ Updating pengajuan_surat status values...');
    try {
      await db.query(`
        ALTER TABLE pengajuan_surat 
        MODIFY COLUMN status_surat ENUM(
          'draft',
          'menunggu_verifikasi_rt',
          'menunggu_verifikasi_rw', 
          'menunggu_admin',
          'disetujui',
          'ditolak',
          'revisi_rt',
          'revisi_rw',
          'selesai'
        ) DEFAULT 'menunggu_verifikasi_rt'
      `);
      console.log('   ✓ Status enum updated');
    } catch (err) {
      console.log('   ⚠ Status enum update skipped:', err.message.substring(0, 80));
    }

    // 5. Add current verification level tracking
    console.log('\n5️⃣ Adding current_verification_level to pengajuan_surat...');
    try {
      await db.query(`
        ALTER TABLE pengajuan_surat
        ADD COLUMN current_verification_level ENUM('rt', 'rw', 'admin', 'completed') DEFAULT 'rt' COMMENT 'Level verifikasi saat ini'
      `);
      console.log('   ✓ current_verification_level added');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('   ⚠ current_verification_level already exists');
      } else throw err;
    }

    // 6. Set default verification requirements for existing jenis surat
    console.log('\n6️⃣ Setting default verification requirements...');
    const [updated] = await db.query(`
      UPDATE jenis_surat 
      SET 
        require_rt_verification = TRUE,
        require_rw_verification = TRUE
      WHERE status = 'aktif'
    `);
    console.log(`   ✓ ${updated.affectedRows} jenis surat updated`);

    console.log('\n' + '='.repeat(60));
    console.log('Migration Completed Successfully!');
    console.log('='.repeat(60));
    console.log('\nNew Features:');
    console.log('  ✓ Multi-level verification system (RT → RW → Admin)');
    console.log('  ✓ Rejection flow with notes (kembali ke level sebelumnya)');
    console.log('  ✓ Verifikator level assignment (RT/RW)');
    console.log('  ✓ Verification flow tracking table');
    console.log('  ✓ Configurable verification requirements per jenis surat');
    console.log('\nNext Steps:');
    console.log('  1. Create verifikator users with level assignment');
    console.log('  2. Update backend controllers for multi-level flow');
    console.log('  3. Update frontend UI for RT/RW verifikator');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\nMigration Failed:', error.message);
    console.error(error);
  } finally {
    await db.end();
  }
}

migrate();
