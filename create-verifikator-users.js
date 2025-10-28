const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createVerifikatorUsers() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'surat_desa'
  });

  try {
    console.log('Creating Verifikator Accounts based on Warga Data\n');
    console.log('='.repeat(60));

    // 1. Get unique RT/RW combinations from warga
    const [rtRwData] = await db.query(`
      SELECT DISTINCT rt, rw 
      FROM users 
      WHERE role = 'warga' 
      AND rt IS NOT NULL 
      AND rw IS NOT NULL 
      ORDER BY rw, rt
    `);

    console.log(`\nFound ${rtRwData.length} unique RT/RW combinations\n`);

    // 2. Get unique RW values
    const uniqueRW = [...new Set(rtRwData.map(r => r.rw))];
    console.log(`RW yang ditemukan: ${uniqueRW.join(', ')}\n`);

    // Default password (akan di-hash)
    const defaultPassword = 'verifikator123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    let rtCreated = 0;
    let rtSkipped = 0;
    let rwCreated = 0;
    let rwSkipped = 0;

    // 3. Create RT Verifikator accounts
    console.log('Creating RT Verifikator Accounts...\n');
    
    for (const item of rtRwData) {
      const { rt, rw } = item;
      // NIK format: 99 + RW (2 digit) + RT (2 digit) + 10 digit sequence
      const rwPad = String(rw).padStart(2, '0').slice(-2);
      const rtPad = String(rt).padStart(2, '0').slice(-2);
      const nikRT = `99${rwPad}${rtPad}0000000001`; // Total 16 digits
      const emailRT = `rt${rt}.rw${rw}@verifikator.desa`;
      const namaRT = `Verifikator RT ${rt} RW ${rw}`;

      // Check if already exists
      const [existing] = await db.query(
        'SELECT id FROM users WHERE nik = ? OR email = ?',
        [nikRT, emailRT]
      );

      if (existing.length > 0) {
        console.log(`   RT ${rt}/RW ${rw} already exists`);
        rtSkipped++;
        continue;
      }

      // Insert RT verifikator
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

    // 4. Create RW Verifikator accounts
    console.log('\nCreating RW Verifikator Accounts...\n');

    for (const rw of uniqueRW) {
      // NIK format: 99 + RW (2 digit) + 12 digit sequence
      const rwPad = String(rw).padStart(2, '0').slice(-2);
      const nikRW = `99${rwPad}000000000001`; // Total 16 digits
      const emailRW = `rw${rw}@verifikator.desa`;
      const namaRW = `Verifikator RW ${rw}`;

      // Check if already exists
      const [existing] = await db.query(
        'SELECT id FROM users WHERE nik = ? OR email = ?',
        [nikRW, emailRW]
      );

      if (existing.length > 0) {
        console.log(`   RW ${rw} already exists`);
        rwSkipped++;
        continue;
      }

      // Insert RW verifikator
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

    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log('='.repeat(60));
    console.log(`RT Verifikator created: ${rtCreated}`);
    console.log(`RT Verifikator skipped: ${rtSkipped}`);
    console.log(`RW Verifikator created: ${rwCreated}`);
    console.log(`RW Verifikator skipped: ${rwSkipped}`);
    console.log(`Total created: ${rtCreated + rwCreated}`);
    
    // 6. Display login credentials
    console.log('\n' + '='.repeat(60));
    console.log('Login Credentials:');
    console.log('='.repeat(60));
    console.log('Password (all accounts): ' + defaultPassword);
    console.log('\nRT Verifikator Emails:');
    
    for (const item of rtRwData) {
      const { rt, rw } = item;
      console.log(`   - rt${rt}.rw${rw}@verifikator.desa (RT ${rt} RW ${rw})`);
    }

    console.log('\nRW Verifikator Emails:');
    for (const rw of uniqueRW) {
      console.log(`   - rw${rw}@verifikator.desa (RW ${rw})`);
    }

    console.log('\nVerifikator accounts created successfully!\n');

  } catch (error) {
    console.error('Error creating verifikator accounts:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run the script
createVerifikatorUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
