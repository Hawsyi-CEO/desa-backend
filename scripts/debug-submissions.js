const pool = require('../config/database');

(async () => {
  try {
    // Check table structure
    console.log('=== PENGAJUAN_SURAT TABLE STRUCTURE ===');
    const [cols] = await pool.query('DESCRIBE pengajuan_surat');
    cols.forEach(c => console.log(`${c.Field} (${c.Type})`));
    
    console.log('\n=== LATEST SUBMISSIONS ===');
    const [latest] = await pool.query(`
      SELECT ps.id, ps.no_surat, ps.status_surat, ps.current_verification_level, 
             u.nama, u.rt, u.rw, ps.created_at
      FROM pengajuan_surat ps
      JOIN users u ON ps.user_id = u.id
      ORDER BY ps.created_at DESC
      LIMIT 5
    `);
    console.table(latest);
    
    console.log('\n=== RT 06 / RW 01 SUBMISSIONS ===');
    const [rt06] = await pool.query(`
      SELECT ps.id, ps.no_surat, ps.status_surat, ps.current_verification_level,
             u.nama, u.rt, u.rw, ps.created_at
      FROM pengajuan_surat ps
      JOIN users u ON ps.user_id = u.id
      WHERE u.rt = '06' AND u.rw = '01'
      ORDER BY ps.created_at DESC
    `);
    console.table(rt06);
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
