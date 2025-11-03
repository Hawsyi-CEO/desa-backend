const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'surat_desa',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read SQL file
    const sqlFile = path.join(__dirname, 'database', 'alter_email_nullable.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📝 Running migration: Make email column nullable...');
    
    // Execute SQL
    await connection.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('📧 Email column is now nullable');
    console.log('💡 Users can now be created without email address');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
runMigration();
