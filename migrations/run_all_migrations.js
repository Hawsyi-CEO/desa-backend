const mysql = require('mysql2/promise');
require('dotenv').config();

async function runAllMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'surat_desa'
  });

  try {
    console.log('🔄 Running all migrations...\n');

    // 1. Add surat pengantar fields
    console.log('1️⃣  Checking surat_pengantar fields...');
    const [pengajuanCols] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'surat_desa'}' 
        AND TABLE_NAME = 'pengajuan_surat' 
        AND COLUMN_NAME IN ('surat_pengantar_rt', 'tanggal_upload_pengantar_rt', 'surat_pengantar_rw', 'tanggal_upload_pengantar_rw')
    `);
    
    const existingPengajuanCols = pengajuanCols.map(col => col.COLUMN_NAME);
    
    if (!existingPengajuanCols.includes('surat_pengantar_rt')) {
      await connection.query(`
        ALTER TABLE pengajuan_surat
        ADD COLUMN surat_pengantar_rt VARCHAR(255) NULL COMMENT 'Path file surat pengantar dari RT' AFTER lampiran
      `);
      console.log('   ✅ surat_pengantar_rt added');
    } else {
      console.log('   ℹ️  surat_pengantar_rt already exists');
    }

    if (!existingPengajuanCols.includes('tanggal_upload_pengantar_rt')) {
      await connection.query(`
        ALTER TABLE pengajuan_surat
        ADD COLUMN tanggal_upload_pengantar_rt DATETIME NULL COMMENT 'Tanggal upload surat pengantar RT' AFTER surat_pengantar_rt
      `);
      console.log('   ✅ tanggal_upload_pengantar_rt added');
    } else {
      console.log('   ℹ️  tanggal_upload_pengantar_rt already exists');
    }

    if (!existingPengajuanCols.includes('surat_pengantar_rw')) {
      await connection.query(`
        ALTER TABLE pengajuan_surat
        ADD COLUMN surat_pengantar_rw VARCHAR(255) NULL COMMENT 'Path file surat pengantar dari RW' AFTER tanggal_upload_pengantar_rt
      `);
      console.log('   ✅ surat_pengantar_rw added');
    } else {
      console.log('   ℹ️  surat_pengantar_rw already exists');
    }

    if (!existingPengajuanCols.includes('tanggal_upload_pengantar_rw')) {
      await connection.query(`
        ALTER TABLE pengajuan_surat
        ADD COLUMN tanggal_upload_pengantar_rw DATETIME NULL COMMENT 'Tanggal upload surat pengantar RW' AFTER surat_pengantar_rw
      `);
      console.log('   ✅ tanggal_upload_pengantar_rw added');
    } else {
      console.log('   ℹ️  tanggal_upload_pengantar_rw already exists');
    }

    // Add indexes
    const [indexes] = await connection.query(`
      SHOW INDEX FROM pengajuan_surat WHERE Key_name IN ('idx_surat_pengantar_rt', 'idx_surat_pengantar_rw')
    `);
    const existingIndexes = indexes.map(idx => idx.Key_name);

    if (!existingIndexes.includes('idx_surat_pengantar_rt')) {
      await connection.query(`CREATE INDEX idx_surat_pengantar_rt ON pengajuan_surat(surat_pengantar_rt)`);
      console.log('   ✅ idx_surat_pengantar_rt index created');
    } else {
      console.log('   ℹ️  idx_surat_pengantar_rt index already exists');
    }

    if (!existingIndexes.includes('idx_surat_pengantar_rw')) {
      await connection.query(`CREATE INDEX idx_surat_pengantar_rw ON pengajuan_surat(surat_pengantar_rw)`);
      console.log('   ✅ idx_surat_pengantar_rw index created');
    } else {
      console.log('   ℹ️  idx_surat_pengantar_rw index already exists');
    }

    // 2. Create formulir_cetak table
    console.log('\n2️⃣  Checking formulir_cetak table...');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'surat_desa'}' 
        AND TABLE_NAME = 'formulir_cetak'
    `);

    if (tables.length === 0) {
      await connection.query(`
        CREATE TABLE formulir_cetak (
          id int(11) NOT NULL AUTO_INCREMENT,
          nama_formulir varchar(255) NOT NULL,
          kategori enum('kependudukan','kesehatan','usaha','umum') NOT NULL DEFAULT 'umum',
          deskripsi text DEFAULT NULL,
          file_name varchar(255) NOT NULL,
          file_path varchar(500) NOT NULL,
          file_type varchar(10) NOT NULL,
          file_size int(11) NOT NULL DEFAULT 0,
          is_fillable tinyint(1) NOT NULL DEFAULT 0,
          field_mapping json DEFAULT NULL,
          urutan int(11) NOT NULL DEFAULT 0,
          is_active tinyint(1) NOT NULL DEFAULT 1,
          jumlah_download int(11) NOT NULL DEFAULT 0,
          created_by int(11) DEFAULT NULL,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_kategori (kategori),
          KEY idx_is_active (is_active),
          KEY idx_created_by (created_by),
          KEY idx_nama_formulir (nama_formulir),
          KEY idx_urutan_active (urutan, is_active),
          CONSTRAINT fk_formulir_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('   ✅ formulir_cetak table created');
    } else {
      console.log('   ℹ️  formulir_cetak table already exists');
    }

    // 3. Create notifications table
    console.log('\n3️⃣  Checking notifications table...');
    const [notifTables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'surat_desa'}' 
        AND TABLE_NAME = 'notifications'
    `);

    if (notifTables.length === 0) {
      await connection.query(`
        CREATE TABLE notifications (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          pengajuan_id INT NULL,
          type ENUM('approved', 'rejected', 'info', 'revision') NOT NULL DEFAULT 'info',
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          is_read TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          read_at TIMESTAMP NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (pengajuan_id) REFERENCES pengajuan_surat(id) ON DELETE CASCADE,
          INDEX idx_user_read (user_id, is_read),
          INDEX idx_created (created_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('   ✅ notifications table created');
    } else {
      console.log('   ℹ️  notifications table already exists');
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run migration
if (require.main === module) {
  runAllMigrations()
    .then(() => {
      console.log('\n✅ Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = runAllMigrations;
