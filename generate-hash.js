const bcrypt = require('bcryptjs');

// Generate password hashes
const password1 = process.argv[2] || 'admin123';
const password2 = 'warga123';

const hash1 = bcrypt.hashSync(password1, 10);
const hash2 = bcrypt.hashSync(password2, 10);

console.log('\n=== Password Hashes ===\n');
console.log(`${password1}: ${hash1}`);
console.log(`warga123: ${hash2}`);
console.log('\n');
