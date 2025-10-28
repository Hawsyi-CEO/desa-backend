const pool = require('../config/database');

(async () => {
  try {
    console.log('=== SIMULATING VERIFIKATOR RT 06 / RW 01 LOGIN ===\n');
    
    // Get verifikator info
    const [verif] = await pool.query(`
      SELECT id, nama, email, verifikator_level, rt, rw
      FROM users
      WHERE email = 'rt06.rw01@verifikator.desa'
    `);
    
    if (verif.length === 0) {
      console.log('❌ Verifikator RT 06 / RW 01 not found!');
      console.log('\nChecking what RT/RW combinations exist in warga...');
      const [rtRw] = await pool.query(`
        SELECT DISTINCT rt, rw
        FROM users
        WHERE role = 'warga'
        AND rt IS NOT NULL
        AND rw IS NOT NULL
        ORDER BY rw, rt
      `);
      console.table(rtRw);
      
      console.log('\nChecking existing verifikator accounts...');
      const [verifAccounts] = await pool.query(`
        SELECT email, verifikator_level, rt, rw
        FROM users
        WHERE role = 'verifikator'
        ORDER BY rw, rt
      `);
      console.table(verifAccounts);
      
      await pool.end();
      process.exit(1);
    }
    
    console.log('✓ Verifikator found:');
    console.table(verif);
    
    const { verifikator_level, rt, rw } = verif[0];
    
    console.log('\n=== QUERYING SURAT MASUK ===\n');
    
    let targetStatus = 'menunggu_verifikasi_rt';
    let rtFilter = rt;
    let rwFilter = rw;
    
    let query = `
      SELECT 
        ps.id,
        ps.no_surat,
        ps.status_surat,
        ps.current_verification_level,
        js.nama_surat,
        u.nama as nama_pemohon,
        u.rt as pemohon_rt,
        u.rw as pemohon_rw
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      WHERE ps.status_surat = ?
      AND u.rw = ?
    `;
    
    const params = [targetStatus, rwFilter];
    
    if (verifikator_level === 'rt' && rtFilter) {
      query += ` AND u.rt = ?`;
      params.push(rtFilter);
    }
    
    query += ` ORDER BY ps.created_at ASC`;
    
    console.log('Query params:', params);
    
    const [surat] = await pool.query(query, params);
    
    console.log(`\nFound ${surat.length} surat:\n`);
    console.table(surat);
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
