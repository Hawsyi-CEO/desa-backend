const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'surat_desa',
    multipleStatements: true
  });

  try {
    console.log('Running Multi-Level Verification Migration...\n');

    const sqlFile = fs.readFileSync(
      path.join(__dirname, '../database/migration-multi-level-verification.sql'),
      'utf8'
    );

    // Split by delimiter and execute
    const statements = sqlFile
      .split('--')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('='));

    for (const statement of statements) {
      if (statement.includes('ALTER TABLE') || statement.includes('CREATE TABLE') || 
          statement.includes('CREATE OR REPLACE VIEW') || statement.includes('UPDATE')) {
        try {
          await db.query(statement);
          console.log('✓ Executed statement');
        } catch (err) {
          if (!err.message.includes('Duplicate column name') && 
              !err.message.includes('already exists')) {
            console.error('Error:', err.message);
          } else {
            console.log('⚠ Skipped (already exists)');
          }
        }
      }
    }

    console.log('\nMigration completed successfully!');
    console.log('\nNew features:');
    console.log('  - Multi-level verification (RT → RW → Admin)');
    console.log('  - verification_flow table created');
    console.log('  - verifikator_level field added to users');
    console.log('  - require_rt_verification & require_rw_verification added to jenis_surat');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.end();
  }
}

runMigration();
