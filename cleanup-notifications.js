const db = require('./config/database');

async function cleanupInvalidNotifications() {
  console.log('🧹 Cleaning Up Invalid Notifications...\n');

  try {
    // Step 1: Find notifications where pengajuan doesn't exist or doesn't belong to user
    console.log('Step 1: Finding orphaned notifications...');
    const [orphaned] = await db.query(`
      SELECT n.id, n.user_id, n.pengajuan_id, n.title, n.message
      FROM notifications n
      LEFT JOIN pengajuan_surat ps ON n.pengajuan_id = ps.id AND n.user_id = ps.user_id
      WHERE ps.id IS NULL
    `);

    console.log(`Found ${orphaned.length} orphaned notifications\n`);

    if (orphaned.length > 0) {
      console.log('Orphaned notifications:');
      orphaned.forEach(n => {
        console.log(`  - ID: ${n.id} | Title: "${n.title}" | Pengajuan ID: ${n.pengajuan_id}`);
      });

      // Delete orphaned notifications
      console.log('\n🗑️  Deleting orphaned notifications...');
      const [result] = await db.query(`
        DELETE n FROM notifications n
        LEFT JOIN pengajuan_surat ps ON n.pengajuan_id = ps.id AND n.user_id = ps.user_id
        WHERE ps.id IS NULL
      `);
      console.log(`✅ Deleted ${result.affectedRows} orphaned notifications\n`);
    }

    // Step 2: Show all remaining notifications per user
    console.log('\n📊 Remaining Notifications by User:\n');
    const [users] = await db.query(`
      SELECT DISTINCT u.id, u.nama, u.nik
      FROM users u
      JOIN notifications n ON u.id = n.user_id
      ORDER BY u.nama
    `);

    for (const user of users) {
      console.log(`\n👤 User: ${user.nama} (${user.nik})`);
      console.log('─'.repeat(60));

      const [userNotifs] = await db.query(`
        SELECT 
          n.id,
          n.type,
          n.title,
          n.is_read,
          n.created_at,
          ps.id as pengajuan_id,
          js.nama_surat,
          ps.status_surat
        FROM notifications n
        JOIN pengajuan_surat ps ON n.pengajuan_id = ps.id
        JOIN jenis_surat js ON ps.jenis_surat_id = js.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
      `, [user.id]);

      userNotifs.forEach(n => {
        const readStatus = n.is_read ? '✓ Read' : '○ Unread';
        console.log(`  ${readStatus} | ${n.title}`);
        console.log(`    Surat: ${n.nama_surat}`);
        console.log(`    Status: ${n.status_surat}`);
        console.log(`    Created: ${n.created_at}`);
        console.log('');
      });
    }

    console.log('\n✅ Cleanup completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

cleanupInvalidNotifications();
