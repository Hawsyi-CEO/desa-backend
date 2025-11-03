const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    // Get super admin user
    const [users] = await db.query('SELECT * FROM users WHERE role = "super_admin" LIMIT 1');
    
    if (users.length === 0) {
      console.log('❌ Super Admin tidak ditemukan!');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('\n=== INFORMASI LOGIN ===');
    console.log('NIK:', user.nik);
    console.log('Email:', user.email);
    console.log('Nama:', user.nama);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    
    // Test common passwords
    const testPasswords = ['password123', 'admin123', '123456', 'admin'];
    
    console.log('\n=== TEST PASSWORD ===');
    for (const testPass of testPasswords) {
      const isMatch = await bcrypt.compare(testPass, user.password);
      console.log(`Password "${testPass}":`, isMatch ? '✅ COCOK' : '❌ TIDAK COCOK');
      if (isMatch) {
        console.log('\n🎉 PASSWORD DITEMUKAN!');
        console.log(`\n📝 GUNAKAN KREDENSIAL INI:`);
        console.log(`Username (NIK): ${user.nik}`);
        console.log(`atau Email: ${user.email}`);
        console.log(`Password: ${testPass}`);
        break;
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();
