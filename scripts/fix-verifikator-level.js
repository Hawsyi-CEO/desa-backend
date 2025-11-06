const mysql = require('mysql2/promise');

async function fixVerifikatorLevel() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'surat_user',
    password: 'Cibadak123',
    database: 'surat_desa'
  });

  try {
    console.log('🔍 Checking verifikator records without level...\n');

    // Get all verifikator without verifikator_level
    const [verifikators] = await connection.query(`
      SELECT id, nik, nama, rt, rw, verifikator_level
      FROM users 
      WHERE role = 'verifikator'
      ORDER BY id
    `);

    console.log(`Found ${verifikators.length} verifikator records\n`);

    let updated = 0;
    let skipped = 0;

    for (const verifikator of verifikators) {
      console.log(`\n👤 ${verifikator.nama} (NIK: ${verifikator.nik})`);
      console.log(`   Current: RT=${verifikator.rt}, RW=${verifikator.rw}, Level=${verifikator.verifikator_level}`);

      // Skip if already has level
      if (verifikator.verifikator_level) {
        console.log(`   ⏭️  Already has level: ${verifikator.verifikator_level}`);
        skipped++;
        continue;
      }

      // Determine level based on RT/RW
      let level = null;
      if (verifikator.rt && verifikator.rw) {
        // Jika ada RT dan RW, set sebagai RT (lebih spesifik)
        level = 'rt';
      } else if (verifikator.rt) {
        // Hanya RT
        level = 'rt';
      } else if (verifikator.rw) {
        // Hanya RW
        level = 'rw';
      } else {
        console.log(`   ⚠️  No RT/RW found, skipping...`);
        skipped++;
        continue;
      }

      // Update record
      await connection.query(
        'UPDATE users SET verifikator_level = ? WHERE id = ?',
        [level, verifikator.id]
      );

      console.log(`   ✅ Updated to level: ${level}`);
      updated++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Total updated: ${updated}`);
    console.log(`⏭️  Total skipped: ${skipped}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixVerifikatorLevel();
