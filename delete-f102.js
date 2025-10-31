const db = require('./config/database');

async function deleteF102() {
  try {
    // Cek data F-1.02
    const [check] = await db.query('SELECT id, nama_surat, kode_surat FROM jenis_surat WHERE kode_surat = ?', ['F-1.02']);
    
    if (check.length === 0) {
      console.log('❌ Data F-1.02 tidak ditemukan di database');
      process.exit(0);
    }
    
    console.log('📋 Data F-1.02 yang akan dihapus:');
    console.log(check);
    
    // Hapus pengajuan surat yang menggunakan F-1.02
    const [deletedPengajuan] = await db.query('DELETE FROM pengajuan_surat WHERE jenis_surat_id = ?', [check[0].id]);
    console.log(`✅ Dihapus ${deletedPengajuan.affectedRows} pengajuan surat F-1.02`);
    
    // Hapus jenis surat F-1.02
    const [deletedJenis] = await db.query('DELETE FROM jenis_surat WHERE kode_surat = ?', ['F-1.02']);
    console.log(`✅ Dihapus ${deletedJenis.affectedRows} jenis surat F-1.02`);
    
    console.log('✅ Semua data F-1.02 berhasil dihapus dari database');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

deleteF102();
