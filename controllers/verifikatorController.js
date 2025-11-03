const db = require('../config/database');

// ==============================================
// MULTI-LEVEL VERIFICATION CONTROLLER
// RT → RW → Admin
// ==============================================

// Get Surat Masuk untuk Verifikator (RT atau RW)
exports.getSuratMasuk = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get verifikator info
    const [user] = await db.query(
      'SELECT verifikator_level, rt, rw FROM users WHERE id = ?',
      [userId]
    );
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    const { verifikator_level, rt, rw } = user[0];

    // Determine status yang harus dicek berdasarkan level
    let targetStatus;
    let rtFilter = rt;
    let rwFilter = rw;

    if (verifikator_level === 'rt') {
      targetStatus = 'menunggu_verifikasi_rt';
      // RT hanya lihat surat dari RT-nya saja
    } else if (verifikator_level === 'rw') {
      targetStatus = 'menunggu_verifikasi_rw';
      rtFilter = null; // RW lihat semua RT di RW-nya
    } else {
      return res.status(403).json({
        success: false,
        message: 'Anda bukan verifikator RT/RW'
      });
    }

    // Query surat yang menunggu verifikasi
    let query = `
      SELECT 
        ps.*,
        js.nama_surat,
        js.kode_surat,
        js.fields,
        js.template_konten,
        js.kalimat_pembuka,
        u.nama as nama_pemohon,
        u.nik as nik_pemohon,
        u.rt as pemohon_rt,
        u.rw as pemohon_rw,
        u.alamat as alamat_pemohon,
        vf.id as verification_flow_id,
        vf.sequence_order
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      LEFT JOIN verification_flow vf ON ps.id = vf.pengajuan_id 
        AND vf.level_type = ?
        AND vf.status = 'pending'
      WHERE ps.status_surat = ?
      AND u.rw = ?
    `;

    const params = [verifikator_level, targetStatus, rwFilter];

    // RT: filter by RT
    if (verifikator_level === 'rt' && rtFilter) {
      query += ` AND u.rt = ?`;
      params.push(rtFilter);
    }

    query += ` ORDER BY ps.created_at ASC`;

    const [surat] = await db.query(query, params);

    res.json({
      success: true,
      data: surat,
      meta: {
        verifikator_level,
        rt: rtFilter,
        rw: rwFilter,
        total: surat.length
      }
    });
  } catch (error) {
    console.error('Get surat masuk error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Approve Surat
exports.approveSurat = async (req, res) => {
  try {
    const { id } = req.params;
    const { keterangan } = req.body;
    const userId = req.user.id;
    const suratPengantarFile = req.file; // Dari multer upload

    // Get verifikator info
    const [user] = await db.query(
      'SELECT verifikator_level, rt, rw, nama FROM users WHERE id = ?',
      [userId]
    );

    if (user.length === 0 || !user[0].verifikator_level) {
      return res.status(403).json({
        success: false,
        message: 'Anda bukan verifikator'
      });
    }

    const { verifikator_level, rt, rw } = user[0];

    // Get pengajuan surat
    const [pengajuan] = await db.query(
      `SELECT ps.*, u.rt as pemohon_rt, u.rw as pemohon_rw, 
              js.require_rt_verification, js.require_rw_verification, js.kode_surat
       FROM pengajuan_surat ps
       JOIN users u ON ps.user_id = u.id
       JOIN jenis_surat js ON ps.jenis_surat_id = js.id
       WHERE ps.id = ?`,
      [id]
    );

    if (pengajuan.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Surat tidak ditemukan'
      });
    }

    const surat = pengajuan[0];

    // Validasi: Surat pengantar WAJIB diupload
    if (!suratPengantarFile) {
      return res.status(400).json({
        success: false,
        message: 'Surat pengantar harus diupload sebelum menyetujui'
      });
    }

    // Validasi: verifikator RT hanya bisa approve surat dari RT-nya
    if (verifikator_level === 'rt' && surat.pemohon_rt !== rt) {
      return res.status(403).json({
        success: false,
        message: `Anda hanya bisa memverifikasi surat dari RT ${rt}`
      });
    }

    // Validasi: verifikator RW hanya bisa approve surat dari RW-nya
    if (verifikator_level === 'rw' && surat.pemohon_rw !== rw) {
      return res.status(403).json({
        success: false,
        message: `Anda hanya bisa memverifikasi surat dari RW ${rw}`
      });
    }

    // Validasi: status harus sesuai dengan level verifikator
    const expectedStatus = `menunggu_verifikasi_${verifikator_level}`;
    if (surat.status_surat !== expectedStatus) {
      return res.status(400).json({
        success: false,
        message: `Surat tidak dalam status ${expectedStatus}`
      });
    }

    // Determine next status dan level
    let nextStatus;
    let nextLevel;

    if (verifikator_level === 'rt') {
      // RT approve: cek apakah perlu RW
      if (surat.require_rw_verification) {
        nextStatus = 'menunggu_verifikasi_rw';
        nextLevel = 'rw';
      } else {
        nextStatus = 'menunggu_admin';
        nextLevel = 'admin';
      }
    } else if (verifikator_level === 'rw') {
      // RW approve: langsung ke admin
      nextStatus = 'menunggu_admin';
      nextLevel = 'admin';
    }

    // Update verification_flow: mark current level as approved
    await db.query(
      `UPDATE verification_flow 
       SET status = 'approved', 
           verifier_id = ?,
           keterangan = ?,
           verified_at = NOW()
       WHERE pengajuan_id = ? 
       AND level_type = ?
       AND status = 'pending'`,
      [userId, keterangan || 'Disetujui', id, verifikator_level]
    );

    // Update pengajuan_surat dengan surat pengantar
    const suratPengantarPath = suratPengantarFile.filename;
    const suratPengantarField = `surat_pengantar_${verifikator_level}`;
    const tanggalUploadField = `tanggal_upload_pengantar_${verifikator_level}`;
    
    await db.query(
      `UPDATE pengajuan_surat 
       SET status_surat = ?,
           current_verification_level = ?,
           ${suratPengantarField} = ?,
           ${tanggalUploadField} = NOW()
       WHERE id = ?`,
      [nextStatus, nextLevel, suratPengantarPath, id]
    );

    // Add to riwayat_surat
    await db.query(
      `INSERT INTO riwayat_surat (pengajuan_id, user_id, action, keterangan)
       VALUES (?, ?, ?, ?)`,
      [id, userId, 'verified', `Diverifikasi oleh ${verifikator_level.toUpperCase()}: ${keterangan || 'Disetujui'} (Surat pengantar: ${suratPengantarPath})`]
    );

    // 🔔 Create notification for warga
    let notifMessage = '';
    if (verifikator_level === 'rt') {
      if (surat.require_rw_verification) {
        notifMessage = `Surat ${surat.kode_surat || ''} telah disetujui oleh RT ${rt} dan sedang menunggu verifikasi RW ${surat.pemohon_rw}`;
      } else {
        notifMessage = `Surat ${surat.kode_surat || ''} telah disetujui oleh RT ${rt} dan sedang menunggu persetujuan Kepala Desa`;
      }
    } else if (verifikator_level === 'rw') {
      notifMessage = `Surat ${surat.kode_surat || ''} telah disetujui oleh RW ${rw} dan sedang menunggu persetujuan Kepala Desa`;
    }

    await db.query(
      `INSERT INTO notifications (user_id, pengajuan_id, type, title, message) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        surat.user_id, 
        id, 
        'verified', 
        `Surat Disetujui ${verifikator_level.toUpperCase()}`,
        notifMessage
      ]
    );

    res.json({
      success: true,
      message: `Surat berhasil diverifikasi (${verifikator_level.toUpperCase()}) dengan surat pengantar`,
      data: {
        next_status: nextStatus,
        next_level: nextLevel,
        surat_pengantar: suratPengantarPath
      }
    });
  } catch (error) {
    console.error('Approve surat error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Reject Surat (kembali ke level sebelumnya)
exports.rejectSurat = async (req, res) => {
  try {
    const { id } = req.params;
    const { keterangan } = req.body;
    const userId = req.user.id;

    if (!keterangan) {
      return res.status(400).json({
        success: false,
        message: 'Keterangan penolakan harus diisi'
      });
    }

    // Get verifikator info
    const [user] = await db.query(
      'SELECT verifikator_level, rt, rw FROM users WHERE id = ?',
      [userId]
    );

    if (user.length === 0 || !user[0].verifikator_level) {
      return res.status(403).json({
        success: false,
        message: 'Anda bukan verifikator'
      });
    }

    const { verifikator_level, rt, rw } = user[0];

    // Get pengajuan surat
    const [pengajuan] = await db.query(
      `SELECT ps.*, u.rt as pemohon_rt, u.rw as pemohon_rw, 
              js.require_rt_verification, js.kode_surat
       FROM pengajuan_surat ps
       JOIN users u ON ps.user_id = u.id
       JOIN jenis_surat js ON ps.jenis_surat_id = js.id
       WHERE ps.id = ?`,
      [id]
    );

    if (pengajuan.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Surat tidak ditemukan'
      });
    }

    const surat = pengajuan[0];

    // Validasi RT/RW
    if (verifikator_level === 'rt' && surat.pemohon_rt !== rt) {
      return res.status(403).json({
        success: false,
        message: `Anda hanya bisa memverifikasi surat dari RT ${rt}`
      });
    }

    if (verifikator_level === 'rw' && surat.pemohon_rw !== rw) {
      return res.status(403).json({
        success: false,
        message: `Anda hanya bisa memverifikasi surat dari RW ${rw}`
      });
    }

    // Determine previous status (untuk rejection flow)
    let previousStatus;
    let previousLevel;

    if (verifikator_level === 'rt') {
      // RT reject: kembali ke warga untuk revisi
      previousStatus = 'revisi_rt';
      previousLevel = null;
    } else if (verifikator_level === 'rw') {
      // RW reject: kembali ke RT untuk verifikasi ulang
      if (surat.require_rt_verification) {
        previousStatus = 'menunggu_verifikasi_rt';
        previousLevel = 'rt';
      } else {
        // Jika tidak ada RT, reject ke warga
        previousStatus = 'revisi_rw';
        previousLevel = null;
      }
    }

    // Update verification_flow: mark as rejected
    await db.query(
      `UPDATE verification_flow 
       SET status = 'rejected', 
           verifier_id = ?,
           keterangan = ?,
           verified_at = NOW()
       WHERE pengajuan_id = ? 
       AND level_type = ?`,
      [userId, keterangan, id, verifikator_level]
    );

    // Update pengajuan_surat
    await db.query(
      `UPDATE pengajuan_surat 
       SET status_surat = ?,
           current_verification_level = ?
       WHERE id = ?`,
      [previousStatus, previousLevel, id]
    );

    // Add to riwayat_surat
    await db.query(
      `INSERT INTO riwayat_surat (pengajuan_id, user_id, action, keterangan)
       VALUES (?, ?, ?, ?)`,
      [id, userId, 'rejected', `Ditolak oleh ${verifikator_level.toUpperCase()}: ${keterangan}`]
    );

    // 🔔 Create notification for warga
    let notifMessage = '';
    if (verifikator_level === 'rt') {
      notifMessage = `Surat ${surat.kode_surat || ''} ditolak oleh RT ${rt}. Alasan: ${keterangan}. Silakan perbaiki dan ajukan kembali.`;
    } else if (verifikator_level === 'rw') {
      if (surat.require_rt_verification) {
        notifMessage = `Surat ${surat.kode_surat || ''} ditolak oleh RW ${rw}. Alasan: ${keterangan}. Surat dikembalikan ke RT untuk verifikasi ulang.`;
      } else {
        notifMessage = `Surat ${surat.kode_surat || ''} ditolak oleh RW ${rw}. Alasan: ${keterangan}. Silakan perbaiki dan ajukan kembali.`;
      }
    }

    await db.query(
      `INSERT INTO notifications (user_id, pengajuan_id, type, title, message) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        surat.user_id, 
        id, 
        'rejected', 
        `Surat Ditolak ${verifikator_level.toUpperCase()}`,
        notifMessage
      ]
    );

    res.json({
      success: true,
      message: `Surat ditolak (${verifikator_level.toUpperCase()})`,
      data: {
        previous_status: previousStatus,
        reason: keterangan
      }
    });
  } catch (error) {
    console.error('Reject surat error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get Riwayat Verifikasi
exports.getRiwayatVerifikasi = async (req, res) => {
  try {
    const userId = req.user.id;

    const [riwayat] = await db.query(
      `SELECT 
        ps.id,
        ps.status_surat,
        js.nama_surat,
        js.kode_surat,
        u.nama as nama_pemohon,
        u.nik as nik_pemohon,
        u.rt as pemohon_rt,
        u.rw as pemohon_rw,
        vf.level_type,
        vf.status as verification_status,
        vf.keterangan,
        vf.verified_at,
        ps.created_at
      FROM verification_flow vf
      JOIN pengajuan_surat ps ON vf.pengajuan_id = ps.id
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      WHERE vf.verifier_id = ?
      ORDER BY vf.verified_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: riwayat
    });
  } catch (error) {
    console.error('Get riwayat error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Dashboard Stats
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get verifikator info
    const [user] = await db.query(
      'SELECT verifikator_level, rt, rw FROM users WHERE id = ?',
      [userId]
    );
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    const { verifikator_level, rt, rw } = user[0];
    const targetStatus = `menunggu_verifikasi_${verifikator_level}`;

    // Count menunggu verifikasi
    let countQuery = `
      SELECT COUNT(*) as total
      FROM pengajuan_surat ps
      JOIN users u ON ps.user_id = u.id
      WHERE ps.status_surat = ?
      AND u.rw = ?
    `;
    const countParams = [targetStatus, rw];

    if (verifikator_level === 'rt') {
      countQuery += ` AND u.rt = ?`;
      countParams.push(rt);
    }

    const [menunggu] = await db.query(countQuery, countParams);

    // Count sudah diverifikasi (hari ini)
    const [verified] = await db.query(
      `SELECT COUNT(*) as total
       FROM verification_flow
       WHERE verifier_id = ?
       AND DATE(verified_at) = CURDATE()`,
      [userId]
    );

    // Count ditolak (hari ini)
    const [rejected] = await db.query(
      `SELECT COUNT(*) as total
       FROM verification_flow
       WHERE verifier_id = ?
       AND status = 'rejected'
       AND DATE(verified_at) = CURDATE()`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        verifikator_info: {
          level: verifikator_level,
          rt: rt,
          rw: rw
        },
        stats: {
          menunggu_verifikasi: menunggu[0].total,
          diverifikasi_hari_ini: verified[0].total,
          ditolak_hari_ini: rejected[0].total
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Change Password untuk Verifikator
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    // Validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password lama dan password baru harus diisi'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 8 karakter'
      });
    }

    // Get user
    const [users] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Verify old password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(oldPassword, users[0].password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password lama tidak sesuai'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get Notifications untuk Verifikator
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get verifikator info
    const [user] = await db.query(
      'SELECT role, verifikator_level, rt, rw, nama FROM users WHERE id = ?',
      [userId]
    );
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    const { role, verifikator_level, rt, rw } = user[0];

    // Jika bukan verifikator, return empty notifications
    if (role !== 'verifikator' && role !== 'verifikator_rt' && role !== 'verifikator_rw') {
      return res.json({
        success: true,
        data: [],
        unread_count: 0
      });
    }

    // Determine target status based on level
    let targetStatus, rtFilter, rwFilter;

    // Check verifikator_level atau role
    const level = verifikator_level || (role === 'verifikator_rt' ? 'rt' : role === 'verifikator_rw' ? 'rw' : null);

    if (level === 'rt' || role === 'verifikator_rt') {
      targetStatus = 'menunggu_verifikasi_rt';
      rtFilter = rt;
      rwFilter = rw;
    } else if (level === 'rw' || role === 'verifikator_rw') {
      targetStatus = 'menunggu_verifikasi_rw';
      rtFilter = null;
      rwFilter = rw;
    } else {
      // Default: return empty
      return res.json({
        success: true,
        data: [],
        unread_count: 0
      });
    }

    // Get recent surat yang menunggu verifikasi (last 24 hours)
    let query = `
      SELECT 
        ps.id,
        ps.no_surat,
        ps.created_at,
        js.nama_surat,
        u.nama as nama_pemohon
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      WHERE ps.status_surat = ?
      AND ps.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;

    const params = [targetStatus];

    if (level === 'rt' || role === 'verifikator_rt') {
      query += ' AND u.rt = ? AND u.rw = ?';
      params.push(rtFilter, rwFilter);
    } else {
      query += ' AND u.rw = ?';
      params.push(rwFilter);
    }

    query += ' ORDER BY ps.created_at DESC LIMIT 10';

    const [suratBaru] = await db.query(query, params);

    // Format notifications
    const notifications = suratBaru.map(surat => {
      const timeAgo = getTimeAgo(surat.created_at);
      return {
        id: surat.id,
        title: 'Surat Baru Menunggu',
        message: `${surat.nama_surat} dari ${surat.nama_pemohon}`,
        time: timeAgo,
        read: false,
        type: 'new_surat',
        data: {
          surat_id: surat.id,
          no_surat: surat.no_surat
        }
      };
    });

    res.json({
      success: true,
      data: notifications,
      unread_count: notifications.length
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Helper function untuk format waktu
function getTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari yang lalu`;
}

module.exports = exports;
