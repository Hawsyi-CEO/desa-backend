const mysql = require('mysql2/promise');
require('dotenv').config();

async function addNipPejabat() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'surat_desa'
  });

  try {
    console.log('🔄 Menambahkan kolom NIP untuk Camat, Kapolsek, dan Danramil...');

    // Check if columns exist first
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'surat_desa'}' 
        AND TABLE_NAME = 'konfigurasi_surat' 
        AND COLUMN_NAME IN ('nip_camat', 'nip_kapolsek', 'nip_danramil')
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    // Add nip_camat
    if (!existingColumns.includes('nip_camat')) {
      await connection.query(`
        ALTER TABLE konfigurasi_surat 
        ADD COLUMN nip_camat VARCHAR(50) AFTER nama_camat
      `);
      console.log('✅ Kolom nip_camat berhasil ditambahkan');
    } else {
      console.log('ℹ️  Kolom nip_camat sudah ada');
    }

    // Add nip_kapolsek
    if (!existingColumns.includes('nip_kapolsek')) {
      await connection.query(`
        ALTER TABLE konfigurasi_surat 
        ADD COLUMN nip_kapolsek VARCHAR(50) AFTER nama_kapolsek
      `);
      console.log('✅ Kolom nip_kapolsek berhasil ditambahkan');
    } else {
      console.log('ℹ️  Kolom nip_kapolsek sudah ada');
    }

    // Add nip_danramil
    if (!existingColumns.includes('nip_danramil')) {
      await connection.query(`
        ALTER TABLE konfigurasi_surat 
        ADD COLUMN nip_danramil VARCHAR(50) AFTER nama_danramil
      `);
      console.log('✅ Kolom nip_danramil berhasil ditambahkan');
    } else {
      console.log('ℹ️  Kolom nip_danramil sudah ada');
    }

    console.log('✅ Migration selesai!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run migration
if (require.main === module) {
  addNipPejabat()
    .then(() => {
      console.log('✅ Migration berhasil dijalankan');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration gagal:', error);
      process.exit(1);
    });
}

module.exports = addNipPejabat;
