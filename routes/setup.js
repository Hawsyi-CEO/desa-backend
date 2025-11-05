const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Endpoint untuk create table formulir_cetak
router.post('/setup-database', async (req, res) => {
  let connection;
  try {
    // Create new connection instead of using pool
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'surat_user',
      password: process.env.DB_PASSWORD || 'Cibadak123',
      database: process.env.DB_NAME || 'surat_desa'
    });
    const sql = `
      CREATE TABLE IF NOT EXISTS formulir_cetak (
        id int(11) NOT NULL AUTO_INCREMENT,
        nama_formulir varchar(255) NOT NULL,
        kategori enum('kependudukan','kesehatan','usaha','umum') NOT NULL DEFAULT 'umum',
        deskripsi text DEFAULT NULL,
        file_name varchar(255) NOT NULL,
        file_path varchar(500) NOT NULL,
        file_type varchar(10) NOT NULL,
        file_size bigint(20) NOT NULL DEFAULT 0,
        is_fillable tinyint(1) NOT NULL DEFAULT 0,
        field_mapping json DEFAULT NULL,
        urutan int(11) NOT NULL DEFAULT 0,
        is_active tinyint(1) NOT NULL DEFAULT 1,
        jumlah_download int(11) NOT NULL DEFAULT 0,
        created_by int(11) DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        KEY idx_kategori (kategori),
        KEY idx_is_active (is_active),
        KEY idx_created_by (created_by),
        KEY idx_kategori_active (kategori, is_active),
        KEY idx_urutan (urutan),
        CONSTRAINT fk_formulir_cetak_user FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(sql);
    
    // Verify table exists
    const [tables] = await connection.query('SHOW TABLES LIKE "formulir_cetak"');
    
    await connection.end();
    
    res.json({
      success: true,
      message: 'Table formulir_cetak created successfully',
      verification: tables
    });
  } catch (error) {
    if (connection) await connection.end();
    console.error('Error creating table:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create table',
      error: error.message,
      code: error.code
    });
  }
});

module.exports = router;
