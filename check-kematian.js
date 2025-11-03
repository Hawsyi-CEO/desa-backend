const db = require('./config/database');

const query = `SELECT id, nama_surat, fields FROM jenis_surat WHERE nama_surat LIKE '%kematian%' OR nama_surat LIKE '%Kematian%'`;

(async () => {
  try {
    const [results] = await db.query(query);
    
    if (results.length === 0) {
      console.log('⚠️  Tidak ada jenis surat dengan kata "kematian"');
      console.log('\nMencari semua jenis surat...');
      
      const [allResults] = await db.query('SELECT id, nama_surat FROM jenis_surat ORDER BY id');
      
      console.log('\n📋 Daftar Jenis Surat:');
      allResults.forEach(row => {
        console.log(`  ${row.id}. ${row.nama_surat}`);
      });
    } else {
      console.log('✅ Ditemukan jenis surat kematian:');
      results.forEach(row => {
        console.log(`\n📄 ID: ${row.id}`);
        console.log(`   Nama: ${row.nama_surat}`);
        console.log(`   Fields:`);
        
        try {
          let fields = row.fields;
          
          // If it's already an object/array, use directly
          if (typeof fields === 'string') {
            fields = JSON.parse(fields);
          }
          
          if (Array.isArray(fields)) {
            fields.forEach((field, index) => {
              console.log(`     ${index + 1}. "${field.label}" (name: "${field.name}", type: ${field.type})`);
            });
          } else {
            console.log(`     Type: ${typeof fields}`);
            console.log(`     Value:`, fields);
          }
        } catch (e) {
          console.log(`     Error: ${e.message}`);
        }
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
