const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function checkVerifikator() {
  try {
    // Get verifikator users
    const [users] = await db.query('SELECT nik, nama, email, role, verifikator_level, rt, rw FROM users WHERE role = "verifikator" LIMIT 10');
    
    if (users.length === 0) {
      console.log('❌ Tidak ada akun verifikator!');
      process.exit(1);
    }
    
    console.log('\n=== AKUN VERIFIKATOR ===\n');
    console.table(users);
    
    console.log('\n📝 INFO LOGIN:');
    console.log('Username: NIK atau Email');
    console.log('Password default: password123 atau verifikator123');
    console.log('\nContoh:');
    users.forEach((user, index) => {
      if (index < 3) {
        console.log(`${index + 1}. NIK: ${user.nik} | Level: ${user.verifikator_level || 'N/A'} | RT: ${user.rt || 'N/A'} | RW: ${user.rw || 'N/A'}`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkVerifikator();
