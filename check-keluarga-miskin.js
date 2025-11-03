const mysql = require('mysql2/promise');
const dbConfig = require('./config/database');

(async () => {
  try {
    const db = await mysql.createConnection(dbConfig);
    
    const [rows] = await db.query(
      `SELECT id, nama_surat, require_verification, require_rt_verification, require_rw_verification 
       FROM jenis_surat 
       WHERE nama_surat LIKE '%Keluarga Miskin%'`
    );
    
    console.log('\n📋 Data Surat Keterangan Keluarga Miskin:');
    console.table(rows);
    
    if (rows.length > 0) {
      console.log('\n🔍 Detail Values:');
      rows.forEach(row => {
        console.log(`  - ID: ${row.id}`);
        console.log(`  - Nama: ${row.nama_surat}`);
        console.log(`  - require_verification: ${row.require_verification} (type: ${typeof row.require_verification})`);
        console.log(`  - require_rt_verification: ${row.require_rt_verification} (type: ${typeof row.require_rt_verification})`);
        console.log(`  - require_rw_verification: ${row.require_rw_verification} (type: ${typeof row.require_rw_verification})`);
        console.log(`  - Boolean(require_verification): ${Boolean(row.require_verification)}`);
        console.log(`  - Boolean(require_rt_verification): ${Boolean(row.require_rt_verification)}`);
        console.log(`  - Boolean(require_rw_verification): ${Boolean(row.require_rw_verification)}`);
      });
    }
    
    await db.end();
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
