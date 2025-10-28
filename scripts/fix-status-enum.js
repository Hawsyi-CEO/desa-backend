const pool = require('../config/database');

(async () => {
  try {
    console.log('=== UPDATING STATUS_SURAT ENUM ===\n');
    
    // First, check current ENUM
    const [before] = await pool.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'surat_desa' 
      AND TABLE_NAME = 'pengajuan_surat' 
      AND COLUMN_NAME = 'status_surat'
    `);
    console.log('BEFORE:', before[0].COLUMN_TYPE);
    
    // Update ENUM to include new status values
    console.log('\nUpdating ENUM...');
    await pool.query(`
      ALTER TABLE pengajuan_surat 
      MODIFY COLUMN status_surat ENUM(
        'draft',
        'menunggu_verifikasi',
        'menunggu_verifikasi_rt',
        'menunggu_verifikasi_rw',
        'menunggu_admin',
        'revisi_rt',
        'revisi_rw',
        'diverifikasi',
        'disetujui',
        'ditolak',
        'selesai'
      ) NOT NULL DEFAULT 'draft'
    `);
    console.log('✓ ENUM updated');
    
    // Check after
    const [after] = await pool.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'surat_desa' 
      AND TABLE_NAME = 'pengajuan_surat' 
      AND COLUMN_NAME = 'status_surat'
    `);
    console.log('\nAFTER:', after[0].COLUMN_TYPE);
    
    console.log('\n=== NOW MIGRATING DATA ===\n');
    
    // Now update existing records
    const [updateRT] = await pool.query(`
      UPDATE pengajuan_surat 
      SET status_surat = 'menunggu_verifikasi_rt'
      WHERE current_verification_level = 'rt' 
      AND status_surat = 'menunggu_verifikasi'
    `);
    console.log(`✓ Updated ${updateRT.affectedRows} records to 'menunggu_verifikasi_rt'`);
    
    const [updateRW] = await pool.query(`
      UPDATE pengajuan_surat 
      SET status_surat = 'menunggu_verifikasi_rw'
      WHERE current_verification_level = 'rw' 
      AND status_surat = 'menunggu_verifikasi'
    `);
    console.log(`✓ Updated ${updateRW.affectedRows} records to 'menunggu_verifikasi_rw'`);
    
    const [updateAdmin] = await pool.query(`
      UPDATE pengajuan_surat 
      SET status_surat = 'menunggu_admin'
      WHERE current_verification_level = 'admin' 
      AND status_surat = 'menunggu_verifikasi'
    `);
    console.log(`✓ Updated ${updateAdmin.affectedRows} records to 'menunggu_admin'`);
    
    console.log('\n=== FINAL STATUS ===\n');
    const [final] = await pool.query(`
      SELECT id, no_surat, status_surat, current_verification_level
      FROM pengajuan_surat
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.table(final);
    
    console.log('\n✅ Migration complete!');
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
