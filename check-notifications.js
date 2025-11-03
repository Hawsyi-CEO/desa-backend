const db = require('./config/database');

async function checkNotifications() {
  console.log('🔍 Checking Notifications vs Actual Pengajuan...\n');

  try {
    // Get all notifications
    const [notifications] = await db.query(`
      SELECT 
        n.id as notif_id,
        n.user_id,
        n.pengajuan_id,
        n.type,
        n.title,
        n.message,
        n.created_at as notif_created,
        u.nama as user_name,
        u.nik
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
    `);

    console.log(`📊 Total Notifications: ${notifications.length}\n`);

    // Check each notification
    for (const notif of notifications) {
      console.log(`\n┌─ Notification ID: ${notif.notif_id} ─────────────────`);
      console.log(`│ User: ${notif.user_name} (${notif.nik})`);
      console.log(`│ Type: ${notif.type}`);
      console.log(`│ Title: ${notif.title}`);
      console.log(`│ Message: ${notif.message.substring(0, 80)}...`);
      console.log(`│ Created: ${notif.notif_created}`);
      console.log(`│ Pengajuan ID: ${notif.pengajuan_id}`);

      // Check if pengajuan exists
      const [pengajuan] = await db.query(
        `SELECT ps.id, ps.status_surat, ps.created_at, js.nama_surat, js.kode_surat
         FROM pengajuan_surat ps
         JOIN jenis_surat js ON ps.jenis_surat_id = js.id
         WHERE ps.id = ? AND ps.user_id = ?`,
        [notif.pengajuan_id, notif.user_id]
      );

      if (pengajuan.length === 0) {
        console.log(`│ ❌ INVALID: Pengajuan ${notif.pengajuan_id} NOT FOUND or NOT OWNED by this user!`);
        console.log(`│ 🗑️  Should be DELETED`);
      } else {
        const surat = pengajuan[0];
        console.log(`│ ✅ VALID: Pengajuan exists`);
        console.log(`│    Surat: ${surat.nama_surat} (${surat.kode_surat})`);
        console.log(`│    Status: ${surat.status_surat}`);
        console.log(`│    Created: ${surat.created_at}`);
        
        // Check if notification matches pengajuan status
        const notifType = notif.type;
        const suratStatus = surat.status_surat;
        
        let isMatching = false;
        if (notifType === 'created' && surat.created_at) {
          isMatching = true;
        } else if (notifType === 'approved' && suratStatus === 'disetujui') {
          isMatching = true;
        } else if (notifType === 'rejected' && (suratStatus === 'ditolak' || suratStatus.includes('revisi'))) {
          isMatching = true;
        } else if (notifType === 'verified' && (suratStatus.includes('menunggu') || suratStatus === 'disetujui')) {
          isMatching = true;
        }
        
        if (!isMatching) {
          console.log(`│ ⚠️  MISMATCH: Notification type '${notifType}' doesn't match status '${suratStatus}'`);
        }
      }
      console.log(`└────────────────────────────────────────────`);
    }

    // Summary: Find orphaned notifications
    console.log('\n\n📋 SUMMARY - Orphaned Notifications:\n');
    
    const [orphaned] = await db.query(`
      SELECT n.*
      FROM notifications n
      LEFT JOIN pengajuan_surat ps ON n.pengajuan_id = ps.id AND n.user_id = ps.user_id
      WHERE ps.id IS NULL
    `);

    if (orphaned.length > 0) {
      console.log(`❌ Found ${orphaned.length} orphaned notifications (should be deleted):\n`);
      orphaned.forEach(n => {
        console.log(`  - ID: ${n.id} | User: ${n.user_id} | Pengajuan: ${n.pengajuan_id} | Title: "${n.title}"`);
      });
      
      console.log(`\n💡 Run cleanup script to delete these orphaned notifications.`);
    } else {
      console.log('✅ No orphaned notifications found.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

checkNotifications();
