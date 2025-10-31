const db = require('../config/database');

/**
 * Migration: Add showInDocument property to existing fields
 * 
 * This script will:
 * 1. Get all jenis_surat records
 * 2. Parse the fields JSON
 * 3. Add showInDocument: true to fields that don't have it
 * 4. Update the record
 */

async function migrateShowInDocument() {
  try {
    console.log('🔄 Starting migration: Add showInDocument to fields...\n');

    // Get all jenis_surat
    const [jenisSuratList] = await db.query('SELECT id, nama_surat, fields FROM jenis_surat');

    console.log(`📋 Found ${jenisSuratList.length} jenis surat records\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const jenisSurat of jenisSuratList) {
      try {
        // Parse fields
        let fields = [];
        if (jenisSurat.fields) {
          fields = typeof jenisSurat.fields === 'string' 
            ? JSON.parse(jenisSurat.fields) 
            : jenisSurat.fields;
        }

        if (!Array.isArray(fields) || fields.length === 0) {
          console.log(`⏭️  Skipping "${jenisSurat.nama_surat}" - No fields`);
          skippedCount++;
          continue;
        }

        // Check if any field needs update
        let needsUpdate = false;
        const updatedFields = fields.map(field => {
          if (field.showInDocument === undefined) {
            needsUpdate = true;
            return {
              ...field,
              showInDocument: true // Default: tampil di surat
            };
          }
          return field;
        });

        if (needsUpdate) {
          // Update the record
          await db.query(
            'UPDATE jenis_surat SET fields = ? WHERE id = ?',
            [JSON.stringify(updatedFields), jenisSurat.id]
          );

          console.log(`✅ Updated "${jenisSurat.nama_surat}" - Added showInDocument to ${updatedFields.length} fields`);
          updatedCount++;
        } else {
          console.log(`✓  "${jenisSurat.nama_surat}" - Already has showInDocument property`);
          skippedCount++;
        }

      } catch (parseError) {
        console.error(`❌ Error processing "${jenisSurat.nama_surat}":`, parseError.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updatedCount} records`);
    console.log(`   ⏭️  Skipped: ${skippedCount} records`);
    console.log('\n✨ Migration completed successfully!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateShowInDocument();
