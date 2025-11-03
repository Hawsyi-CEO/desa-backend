const db = require('./config/database');

async function fixVerificationFlags() {
  console.log('🔧 Fixing Database Verification Flags Inconsistency...\n');

  try {
    // Cek data sebelum fix
    console.log('📊 BEFORE FIX:');
    const [beforeRows] = await db.query(`
      SELECT id, nama_surat, kode_surat,
        require_verification,
        require_rt_verification,
        require_rw_verification
      FROM jenis_surat
      ORDER BY id
    `);

    beforeRows.forEach(row => {
      const inconsistent = row.require_verification === 0 && 
                          (row.require_rt_verification === 1 || row.require_rw_verification === 1);
      
      console.log(`\n${row.nama_surat} (${row.kode_surat}):`);
      console.log(`  require_verification: ${row.require_verification}`);
      console.log(`  require_rt_verification: ${row.require_rt_verification}`);
      console.log(`  require_rw_verification: ${row.require_rw_verification}`);
      
      if (inconsistent) {
        console.log(`  ❌ INCONSISTENT - Will be fixed!`);
      } else {
        console.log(`  ✅ Consistent`);
      }
    });

    // Fix data: Set RT/RW to 0 jika require_verification = 0
    console.log('\n\n🔨 Applying Fix...');
    const [result] = await db.query(`
      UPDATE jenis_surat 
      SET require_rt_verification = 0,
          require_rw_verification = 0
      WHERE require_verification = 0
        AND (require_rt_verification = 1 OR require_rw_verification = 1)
    `);

    console.log(`✅ Fixed ${result.affectedRows} jenis surat with inconsistent flags\n`);

    // Cek data setelah fix
    console.log('\n📊 AFTER FIX:');
    const [afterRows] = await db.query(`
      SELECT id, nama_surat, kode_surat,
        require_verification,
        require_rt_verification,
        require_rw_verification
      FROM jenis_surat
      ORDER BY id
    `);

    afterRows.forEach(row => {
      console.log(`\n${row.nama_surat} (${row.kode_surat}):`);
      console.log(`  require_verification: ${row.require_verification}`);
      console.log(`  require_rt_verification: ${row.require_rt_verification}`);
      console.log(`  require_rw_verification: ${row.require_rw_verification}`);
      
      if (row.require_verification === 0) {
        console.log(`  ✅ TANPA VERIFIKASI - Langsung ke Admin`);
      } else {
        console.log(`  ⚠️ PERLU VERIFIKASI - Melalui RT/RW`);
      }
    });

    console.log('\n\n✅ Database verification flags fixed successfully!');
    console.log('💡 All jenis_surat now have consistent verification settings');

  } catch (error) {
    console.error('❌ Error fixing verification flags:', error);
    throw error;
  } finally {
    await db.end();
  }
}

fixVerificationFlags();
