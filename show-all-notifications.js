const db = require('./config/database');

async function showAllNotifications() {
  console.log('🔍 Showing ALL Notifications (including read ones)...\n');

  try {
    const [all] = await db.query(`
      SELECT 
        n.id,
        n.user_id,
        n.pengajuan_id,
        n.type,
        n.title,
        n.message,
        n.is_read,
        n.read_at,
        n.created_at,
        u.nama as user_name,
        u.nik
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
    `);

    console.log(`📊 Total Notifications in Database: ${all.length}\n`);
    console.log('═'.repeat(80));

    all.forEach((n, index) => {
      console.log(`\n${index + 1}. Notification ID: ${n.id}`);
      console.log(`   User: ${n.user_name || 'Unknown'} (${n.nik || 'N/A'})`);
      console.log(`   Pengajuan ID: ${n.pengajuan_id}`);
      console.log(`   Type: ${n.type}`);
      console.log(`   Title: "${n.title}"`);
      console.log(`   Message: "${n.message}"`);
      console.log(`   Status: ${n.is_read ? '✓ Read' : '○ Unread'}`);
      if (n.read_at) {
        console.log(`   Read At: ${n.read_at}`);
      }
      console.log(`   Created: ${n.created_at}`);
      console.log('   ' + '─'.repeat(75));
    });

    console.log('\n\n📋 Summary by Type:');
    const byType = {};
    all.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    console.log('\n📋 Summary by Read Status:');
    const unread = all.filter(n => !n.is_read).length;
    const read = all.filter(n => n.is_read).length;
    console.log(`   Unread: ${unread}`);
    console.log(`   Read: ${read}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

showAllNotifications();
