const mysql = require('mysql2/promise');

async function checkRtRw() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'surat_desa'
  });

  try {
    console.log('RT/RW Data (current format):\n');
    
    const [data] = await db.query(`
      SELECT DISTINCT rt, rw 
      FROM users 
      WHERE role = 'warga' 
      ORDER BY CAST(rw AS UNSIGNED), CAST(rt AS UNSIGNED)
    `);
    
    data.forEach(d => {
      console.log(`RT: "${d.rt}" | RW: "${d.rw}"`);
    });
    
    console.log('\nTotal combinations:', data.length);
    
  } finally {
    await db.end();
  }
}

checkRtRw();
