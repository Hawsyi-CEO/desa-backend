const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'surat_desa'
};

(async () => {
  try {
    const db = await mysql.createConnection(dbConfig);
    
    const [rows] = await db.query(`
      SELECT 
        id, 
        nama_surat, 
        kode_surat, 
        require_verification,
        require_rt_verification,
        require_rw_verification
      FROM jenis_surat 
      ORDER BY id
    `);
    
    console.log('\n📋 Data Jenis Surat - Verification Settings:\n');
    console.table(rows);
    
    console.log('\n🔍 Detail per Surat:');
    rows.forEach(row => {
      console.log(`\n  ${row.nama_surat} (${row.kode_surat}):`);
      console.log(`    - require_verification: ${row.require_verification} (${typeof row.require_verification})`);
      console.log(`    - require_rt_verification: ${row.require_rt_verification} (${typeof row.require_rt_verification})`);
      console.log(`    - require_rw_verification: ${row.require_rw_verification} (${typeof row.require_rw_verification})`);
      
      if (!row.require_verification) {
        console.log(`    ✅ Status: TANPA VERIFIKASI - Langsung ke Admin`);
      } else {
        console.log(`    ⚠️  Status: PERLU VERIFIKASI - Melalui RT/RW`);
      }
    });
    
    await db.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
