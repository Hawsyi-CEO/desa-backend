const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function generateAllVerifikator() {
  try {
    console.log('\n=== GENERATE VERIFIKATOR UNTUK SEMUA RT/RW ===\n');
    
    // 1. Get distinct RT/RW dari data warga
    console.log('1. Mengambil daftar RT/RW dari data warga...');
    const [rtRwList] = await db.query(`
      SELECT DISTINCT rt, rw 
      FROM warga 
      WHERE rt IS NOT NULL AND rw IS NOT NULL
      ORDER BY CAST(rw AS UNSIGNED), CAST(rt AS UNSIGNED)
    `);
    
    console.log(`✅ Ditemukan ${rtRwList.length} kombinasi RT/RW:\n`);
    console.table(rtRwList);
    
    // 2. Hash password default
    const password = await bcrypt.hash('verifikator123', 10);
    
    // 3. Generate verifikator untuk setiap RT/RW
    console.log('\n2. Membuat user verifikator...\n');
    
    let created = 0;
    let skipped = 0;
    
    for (const { rt, rw } of rtRwList) {
      // Format RT/RW menjadi 2 digit
      const rtFormatted = rt.padStart(2, '0');
      const rwFormatted = rw.padStart(2, '0');
      
      // Generate NIK unik (99 + RW(2) + RT(2) + 00000001)
      const nik = `99${rwFormatted}${rtFormatted}00000001`;
      const email = `rt${rtFormatted}.rw${rwFormatted}@verifikator.desa`;
      const nama = `Verifikator RT ${rtFormatted} RW ${rwFormatted}`;
      
      // Cek apakah sudah ada
      const [existing] = await db.query(
        'SELECT id FROM users WHERE nik = ? OR email = ?',
        [nik, email]
      );
      
      if (existing.length > 0) {
        console.log(`⚠️  SKIP: ${nama} - sudah ada (ID: ${existing[0].id})`);
        skipped++;
        continue;
      }
      
      // Insert verifikator
      await db.query(`
        INSERT INTO users (
          nik, nama, email, password, role, status, rt, rw
        ) VALUES (?, ?, ?, ?, 'verifikator', 'aktif', ?, ?)
      `, [nik, nama, email, password, rtFormatted, rwFormatted]);
      
      console.log(`✅ CREATED: ${nama} - ${email} (NIK: ${nik})`);
      created++;
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total RT/RW: ${rtRwList.length}`);
    console.log(`✅ Created: ${created}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log('\n📋 Login Info:');
    console.log('Username: Email atau NIK');
    console.log('Password: verifikator123');
    console.log('\nContoh:');
    console.log('- Email: rt01.rw06@verifikator.desa');
    console.log('- Password: verifikator123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateAllVerifikator();
