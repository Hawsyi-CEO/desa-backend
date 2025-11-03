const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function testVerifikatorPassword() {
  try {
    const [users] = await db.query('SELECT * FROM users WHERE role = "verifikator" LIMIT 1');
    
    if (users.length === 0) {
      console.log('❌ Tidak ada verifikator');
      process.exit(1);
    }
    
    const user = users[0];
    const testPasswords = ['password123', 'verifikator123', 'admin123', '123456', 'rt123', 'rw123'];
    
    console.log('\n=== TESTING PASSWORD VERIFIKATOR ===');
    console.log('User:', user.nama);
    console.log('NIK:', user.nik);
    console.log('Email:', user.email);
    console.log('\nTesting passwords...\n');
    
    for (const testPass of testPasswords) {
      const isMatch = await bcrypt.compare(testPass, user.password);
      console.log(`Password "${testPass}":`, isMatch ? '✅ COCOK' : '❌ TIDAK COCOK');
      
      if (isMatch) {
        console.log('\n🎉 PASSWORD DITEMUKAN!\n');
        console.log('=== KREDENSIAL LOGIN VERIFIKATOR ===');
        console.log(`Username (NIK): ${user.nik}`);
        console.log(`atau Email: ${user.email}`);
        console.log(`Password: ${testPass}`);
        console.log('\nLevel:', user.verifikator_level);
        console.log('RT:', user.rt);
        console.log('RW:', user.rw);
        break;
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testVerifikatorPassword();
