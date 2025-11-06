const db = require('./config/database');

async function checkVerifikatorLogin() {
  try {
    console.log('\n=== CEK VERIFIKATOR LOGIN ===\n');
    
    // 1. Cek user verifikator terakhir
    console.log('1. VERIFIKATOR TERBARU:');
    const [verifikators] = await db.query(`
      SELECT id, nik, nama, email, role, rt, rw, status 
      FROM users 
      WHERE role = 'verifikator' 
      ORDER BY id DESC 
      LIMIT 3
    `);
    console.table(verifikators);
    
    // 2. Cek warga dengan RT/RW tertentu
    if (verifikators.length > 0) {
      const v = verifikators[0];
      console.log(`\n2. WARGA DI RT=${v.rt} RW=${v.rw}:`);
      const [wargaList] = await db.query(`
        SELECT id, nik, nama_lengkap, rt, rw 
        FROM warga 
        WHERE rt = ? AND rw = ? 
        LIMIT 5
      `, [v.rt, v.rw]);
      console.table(wargaList);
      
      // 3. Cek format RT/RW di warga
      console.log('\n3. SAMPLE FORMAT RT/RW DI WARGA:');
      const [samples] = await db.query(`
        SELECT DISTINCT rt, rw 
        FROM warga 
        ORDER BY rt, rw 
        LIMIT 10
      `);
      console.table(samples);
      
      // 4. Test login
      console.log(`\n4. TEST LOGIN: ${v.email}`);
      const [loginTest] = await db.query(`
        SELECT id, nik, nama, email, role, rt, rw, status 
        FROM users 
        WHERE (email = ? OR nik = ?) AND status = 'aktif'
      `, [v.email, v.email]);
      
      if (loginTest.length > 0) {
        console.log('✅ User ditemukan untuk login:');
        console.table(loginTest);
      } else {
        console.log('❌ User tidak ditemukan atau status tidak aktif');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkVerifikatorLogin();
