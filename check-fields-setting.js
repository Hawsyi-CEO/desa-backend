const db = require('./config/database');

/**
 * Script untuk mengecek setting showInDocument pada fields
 */

async function checkFieldsSettings() {
  try {
    console.log('🔍 Checking fields settings...\n');

    // Get all jenis_surat
    const [jenisSuratList] = await db.query('SELECT id, nama_surat, fields FROM jenis_surat');

    for (const jenisSurat of jenisSuratList) {
      console.log(`\n📄 ${jenisSurat.nama_surat}`);
      console.log('─'.repeat(60));

      let fields = [];
      if (jenisSurat.fields) {
        fields = typeof jenisSurat.fields === 'string' 
          ? JSON.parse(jenisSurat.fields) 
          : jenisSurat.fields;
      }

      if (fields.length === 0) {
        console.log('   No fields defined');
        continue;
      }

      fields.forEach((field, index) => {
        const showStatus = field.showInDocument !== false ? '✅ TAMPIL' : '🔹 HANYA DATA';
        console.log(`   ${index + 1}. ${field.label} (${field.name})`);
        console.log(`      Type: ${field.type} | Required: ${field.required ? 'Yes' : 'No'}`);
        console.log(`      Show in Document: ${showStatus} (value: ${field.showInDocument})`);
      });
    }

    console.log('\n✨ Check completed!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run check
checkFieldsSettings();
