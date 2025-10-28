const pool = require('../config/database');

(async () => {
  try {
    console.log('=== CHECKING STATUS_SURAT ENUM VALUES ===\n');
    
    const [info] = await pool.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'surat_desa' 
      AND TABLE_NAME = 'pengajuan_surat' 
      AND COLUMN_NAME = 'status_surat'
    `);
    console.log('Current ENUM:', info[0].COLUMN_TYPE);
    
    console.log('\n=== CURRENT STATUS DISTRIBUTION ===\n');
    const [statusDist] = await pool.query(`
      SELECT status_surat, current_verification_level, COUNT(*) as count
      FROM pengajuan_surat
      GROUP BY status_surat, current_verification_level
    `);
    console.table(statusDist);
    
    console.log('\n=== MIGRATING STATUS VALUES ===\n');
    
    // Update status based on current_verification_level
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
    
    console.log('\n=== AFTER MIGRATION ===\n');
    const [afterDist] = await pool.query(`
      SELECT status_surat, current_verification_level, COUNT(*) as count
      FROM pengajuan_surat
      GROUP BY status_surat, current_verification_level
    `);
    console.table(afterDist);
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
