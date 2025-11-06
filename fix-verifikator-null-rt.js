const db = require('./config/database');

async function fixVerifikatorNullRT() {
  try {
    console.log('\n=== FIX VERIFIKATOR DENGAN RT/RW NULL ===\n');
    
    // 1. Cari verifikator dengan RT atau RW null
    const [broken] = await db.query(`
      SELECT id, nik, nama, email, role, rt, rw, status 
      FROM users 
      WHERE role = 'verifikator' 
      AND (rt IS NULL OR rw IS NULL)
    `);
    
    console.log(`Ditemukan ${broken.length} verifikator dengan RT/RW null:\n`);
    console.table(broken);
    
    if (broken.length === 0) {
      console.log('✅ Tidak ada verifikator dengan RT/RW null');
      process.exit(0);
    }
    
    // 2. Opsi perbaikan
    console.log('\n📋 OPSI PERBAIKAN:');
    console.log('1. Hapus user verifikator yang rusak');
    console.log('2. Set RT/RW default (00, 00)');
    console.log('\nMenjalankan opsi 1: HAPUS user yang rusak...\n');
    
    for (const user of broken) {
      await db.query('DELETE FROM users WHERE id = ?', [user.id]);
      console.log(`❌ DELETED: ${user.nama} (ID: ${user.id}) - RT=${user.rt}, RW=${user.rw}`);
    }
    
    console.log('\n✅ Selesai! Verifikator yang rusak sudah dihapus.');
    console.log('Silakan buat ulang user verifikator dengan RT/RW yang benar.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixVerifikatorNullRT();
