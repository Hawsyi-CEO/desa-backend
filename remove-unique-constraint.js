const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'surat_user',
  password: 'Cibadak123',
  database: 'surat_desa'
};

async function removeUniqueConstraint() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');

    // Cek apakah ada constraint UNIQUE di kode_surat
    const [constraints] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = 'surat_desa' 
        AND TABLE_NAME = 'jenis_surat' 
        AND CONSTRAINT_TYPE = 'UNIQUE'
        AND CONSTRAINT_NAME LIKE '%kode_surat%'
    `);

    if (constraints.length === 0) {
      console.log('✅ Tidak ada UNIQUE constraint di kode_surat');
      return;
    }

    console.log('\n📋 UNIQUE Constraints found:');
    for (const constraint of constraints) {
      console.log(`  - ${constraint.CONSTRAINT_NAME}`);
      
      // Drop constraint
      await connection.query(`
        ALTER TABLE jenis_surat DROP INDEX ${constraint.CONSTRAINT_NAME}
      `);
      console.log(`  ✅ Dropped constraint: ${constraint.CONSTRAINT_NAME}`);
    }

    console.log('\n✅ Semua UNIQUE constraint berhasil dihapus!');
    console.log('💡 Sekarang kode_surat boleh duplicate (untuk kode bidang yang sama)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

removeUniqueConstraint();
