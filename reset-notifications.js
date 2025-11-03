const db = require('./config/database');

async function resetNotifications() {
  console.log('🧹 Resetting All Notifications for Clean Testing...\n');

  try {
    // Show current notifications
    const [before] = await db.query('SELECT COUNT(*) as count FROM notifications');
    console.log(`Current notifications: ${before[0].count}`);

    // Delete all notifications
    await db.query('DELETE FROM notifications');
    console.log('✅ All notifications deleted\n');

    const [after] = await db.query('SELECT COUNT(*) as count FROM notifications');
    console.log(`Remaining notifications: ${after[0].count}`);

    console.log('\n💡 Now you can test the notification system with fresh data:');
    console.log('   1. Submit a new surat');
    console.log('   2. Check if notification appears immediately');
    console.log('   3. Verify notification message is correct');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

resetNotifications();
