const mysql = require('mysql2/promise');

async function addVerifikatorRole() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'surat_desa'
  });

  try {
    console.log('Adding "verifikator" to role ENUM...\n');

    // Alter table to add verifikator role
    await db.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('super_admin', 'admin', 'verifikator', 'warga') 
      NOT NULL DEFAULT 'warga'
    `);

    console.log('Role ENUM updated successfully!\n');

    // Verify
    const [cols] = await db.query('SHOW COLUMNS FROM users WHERE Field = ?', ['role']);
    console.log('New role definition:', cols[0].Type);
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await db.end();
  }
}

addVerifikatorRole()
  .then(() => {
    console.log('Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
