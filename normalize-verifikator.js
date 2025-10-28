const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function normalizeAndRecreateVerifikator() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'surat_desa'
  });

  try {
    console.log('Normalizing RT/RW and Recreating Verifikator Accounts\n');
    console.log('='.repeat(60));

    // Step 1: Normalize warga data RT/RW
    console.log('\n1️⃣ Normalizing warga RT/RW to 2-digit format...\n');
    
    await db.query(`
      UPDATE users 
      SET rt = LPAD(CAST(rt AS UNSIGNED), 2, '0')
      WHERE role = 'warga' 
      AND rt IS NOT NULL 
      AND rt != ''
      AND CAST(rt AS UNSIGNED) > 0
    `);
    
    await db.query(`
      UPDATE users 
      SET rw = LPAD(CAST(rw AS UNSIGNED), 2, '0')
      WHERE role = 'warga' 
      AND rw IS NOT NULL 
      AND rw != ''
      AND CAST(rw AS UNSIGNED) > 0
    `);
    
    console.log('   Warga RT/RW normalized to 2-digit format');

    // Step 2: Delete all existing verifikator accounts
    console.log('\n2️⃣ Deleting existing verifikator accounts...\n');
    
    const [deleted] = await db.query(`
      DELETE FROM users WHERE role = 'verifikator'
    `);
    
    console.log(`   Deleted ${deleted.affectedRows} verifikator accounts`);

    // Step 3: Get unique normalized RT/RW combinations
    console.log('\n3️⃣ Getting unique RT/RW combinations...\n');
    
    const [rtRwData] = await db.query(`
      SELECT DISTINCT rt, rw 
      FROM users 
      WHERE role = 'warga' 
      AND rt IS NOT NULL 
      AND rw IS NOT NULL
      AND rt != ''
      AND rw != ''
      AND CAST(rt AS UNSIGNED) > 0
      AND CAST(rw AS UNSIGNED) > 0
      ORDER BY CAST(rw AS UNSIGNED), CAST(rt AS UNSIGNED)
    `);

    console.log(`   Found ${rtRwData.length} unique RT/RW combinations:`);
    rtRwData.forEach(r => console.log(`   - RT ${r.rt} / RW ${r.rw}`));

    // Step 4: Get unique RW values
    const uniqueRW = [...new Set(rtRwData.map(r => r.rw))];
    console.log(`\n   Found ${uniqueRW.length} unique RW: ${uniqueRW.join(', ')}`);

    // Step 5: Create RT Verifikator accounts
    console.log('\n4️⃣ Creating RT Verifikator Accounts...\n');
    
    const defaultPassword = 'verifikator123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    let rtCreated = 0;

    for (const item of rtRwData) {
      const { rt, rw } = item;
      const nikRT = `99${rw}${rt}0000000001`; // 16 digits
      const emailRT = `rt${rt}.rw${rw}@verifikator.desa`;
      const namaRT = `Verifikator RT ${rt} RW ${rw}`;

      await db.query(`
        INSERT INTO users (
          nik, nama, email, password, role, 
          verifikator_level, rt, rw, 
          no_telepon, alamat, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        nikRT,
        namaRT,
        emailRT,
        hashedPassword,
        'verifikator',
        'rt',
        rt,
        rw,
        '081234567890',
        `Alamat RT ${rt} RW ${rw}`,
        'aktif'
      ]);

      console.log(`   RT ${rt}/RW ${rw} - ${emailRT}`);
      rtCreated++;
    }

    // Step 6: Create RW Verifikator accounts
    console.log('\n5️⃣ Creating RW Verifikator Accounts...\n');

    let rwCreated = 0;

    for (const rw of uniqueRW) {
      const nikRW = `99${rw}000000000001`; // 16 digits
      const emailRW = `rw${rw}@verifikator.desa`;
      const namaRW = `Verifikator RW ${rw}`;

      await db.query(`
        INSERT INTO users (
          nik, nama, email, password, role, 
          verifikator_level, rt, rw, 
          no_telepon, alamat, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        nikRW,
        namaRW,
        emailRW,
        hashedPassword,
        'verifikator',
        'rw',
        null, // RW verifikator tidak punya RT spesifik
        rw,
        '081234567890',
        `Alamat RW ${rw}`,
        'aktif'
      ]);

      console.log(`   RW ${rw} - ${emailRW}`);
      rwCreated++;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log('='.repeat(60));
    console.log(`RT Verifikator created: ${rtCreated}`);
    console.log(`RW Verifikator created: ${rwCreated}`);
    console.log(`Total created: ${rtCreated + rwCreated}`);
    
    // Display credentials
    console.log('\n' + '='.repeat(60));
    console.log('Login Credentials (All Normalized):');
    console.log('='.repeat(60));
    console.log('Password: verifikator123\n');
    
    console.log('RT Verifikator (Format: rtXX.rwXX):');
    rtRwData.forEach(({ rt, rw }) => {
      console.log(`   - rt${rt}.rw${rw}@verifikator.desa`);
    });

    console.log('\nRW Verifikator (Format: rwXX):');
    uniqueRW.forEach(rw => {
      console.log(`   - rw${rw}@verifikator.desa`);
    });

    console.log('\nNormalization and recreation complete!\n');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await db.end();
  }
}

normalizeAndRecreateVerifikator()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
