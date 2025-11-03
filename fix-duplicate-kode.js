const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'surat_user',
  password: 'Cibadak123',
  database: 'surat_desa'
};

async function fixDuplicateKode() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');

    // Cari duplicate kode_surat
    const [duplicates] = await connection.query(`
      SELECT kode_surat, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM jenis_surat 
      GROUP BY kode_surat 
      HAVING COUNT(*) > 1
    `);

    if (duplicates.length === 0) {
      console.log('✅ Tidak ada kode_surat yang duplicate');
      return;
    }

    console.log('\n📋 Kode Surat Duplicate:');
    for (const dup of duplicates) {
      console.log(`\nKode: ${dup.kode_surat} (${dup.count} surat)`);
      console.log(`IDs: ${dup.ids}`);
      
      const ids = dup.ids.split(',');
      
      // Tampilkan detail setiap surat
      for (const id of ids) {
        const [surat] = await connection.query(
          'SELECT id, nama_surat, kode_surat FROM jenis_surat WHERE id = ?',
          [id]
        );
        console.log(`  - ID ${id}: ${surat[0].nama_surat}`);
      }
      
      // Auto-fix: tambahkan suffix angka untuk yang duplicate
      console.log('\n🔧 Fixing duplicates...');
      for (let i = 1; i < ids.length; i++) {
        const newKode = `${dup.kode_surat}-${i}`;
        await connection.query(
          'UPDATE jenis_surat SET kode_surat = ? WHERE id = ?',
          [newKode, ids[i]]
        );
        console.log(`  ✅ Updated ID ${ids[i]}: ${dup.kode_surat} → ${newKode}`);
      }
    }

    console.log('\n✅ Semua duplicate kode_surat berhasil diperbaiki!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

fixDuplicateKode();
