const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'surat_user',
  password: 'Cibadak123',
  database: 'surat_desa'
};

async function fixNotificationsType() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');

    // Cek struktur kolom type
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM notifications LIKE 'type'
    `);

    console.log('\n📋 Current column structure:');
    console.log(columns[0]);

    // Alter kolom type menjadi VARCHAR yang lebih panjang
    await connection.query(`
      ALTER TABLE notifications 
      MODIFY COLUMN type VARCHAR(50) NOT NULL
    `);

    console.log('\n✅ Column type berhasil diubah menjadi VARCHAR(50)');
    console.log('💡 Sekarang bisa menyimpan: created, approved, rejected, dll');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

fixNotificationsType();
