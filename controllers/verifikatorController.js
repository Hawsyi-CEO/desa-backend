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
      `SELECT ps.*, u.rt as pemohon_rt, u.rw as pemohon_rw, js.require_rt_verification, js.require_rw_verification
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

    // Update pengajuan_surat
    await db.query(
      `UPDATE pengajuan_surat 
       SET status_surat = ?,
           current_verification_level = ?
       WHERE id = ?`,
      [nextStatus, nextLevel, id]
    );

    // Add to riwayat_surat
    await db.query(
      `INSERT INTO riwayat_surat (pengajuan_id, user_id, action, keterangan)
       VALUES (?, ?, ?, ?)`,
      [id, userId, 'verified', `Diverifikasi oleh ${verifikator_level.toUpperCase()}: ${keterangan || 'Disetujui'}`]
    );

    res.json({
      success: true,
      message: `Surat berhasil diverifikasi (${verifikator_level.toUpperCase()})`,
      data: {
        next_status: nextStatus,
        next_level: nextLevel
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
      `SELECT ps.*, u.rt as pemohon_rt, u.rw as pemohon_rw, js.require_rt_verification
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

module.exports = exports;
