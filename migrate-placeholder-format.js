const mysql = require('mysql2/promise');

async function migrateTemplates() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'surat_desa'
  });

  try {
    console.log('Starting migration: [field] → (field)\n');

    // Get all jenis_surat
    const [jenisSurat] = await db.query('SELECT id, nama_surat, template_konten FROM jenis_surat');
    
    console.log(`Found ${jenisSurat.length} jenis surat to check\n`);

    let updatedCount = 0;

    for (const surat of jenisSurat) {
      const oldTemplate = surat.template_konten;
      
      // Replace [field] with (field) - using regex to capture content inside []
      const newTemplate = oldTemplate.replace(/\[([^\]]+)\]/g, '($1)');
      
      // Check if there were changes
      if (oldTemplate !== newTemplate) {
        console.log(`\nUpdating: ${surat.nama_surat}`);
        console.log(`   ID: ${surat.id}`);
        console.log(`   Old: ${oldTemplate.substring(0, 100)}...`);
        console.log(`   New: ${newTemplate.substring(0, 100)}...`);
        
        // Update database
        await db.query(
          'UPDATE jenis_surat SET template_konten = ? WHERE id = ?',
          [newTemplate, surat.id]
        );
        
        updatedCount++;
        console.log(`   Updated!`);
      } else {
        console.log(`✓ ${surat.nama_surat} - No changes needed`);
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Migration completed!`);
    console.log(`   Total checked: ${jenisSurat.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${jenisSurat.length - updatedCount}`);
    console.log(`${'='.repeat(50)}\n`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.end();
  }
}

migrateTemplates();
