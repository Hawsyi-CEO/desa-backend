const db = require('../config/database');

// Dashboard verifikasi
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const [user] = await db.query('SELECT rt, rw FROM users WHERE id = ?', [userId]);
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    const { rt, rw } = user[0];

    // Surat menunggu verifikasi dari RT/RW yang sama
    const [menungguVerifikasi] = await db.query(`
      SELECT COUNT(*) as total
      FROM pengajuan_surat ps
      JOIN users u ON ps.user_id = u.id
      WHERE ps.status_surat = 'menunggu_verifikasi'
      AND u.rt = ? AND u.rw = ?
    `, [rt, rw]);

    // Surat yang sudah diverifikasi
    const [sudahVerifikasi] = await db.query(`
      SELECT COUNT(*) as total
      FROM pengajuan_surat ps
      WHERE ps.verifikator_id = ?
    `, [userId]);

    // Recent verifikasi
    const [recentVerifikasi] = await db.query(`
      SELECT 
        ps.*,
        js.nama_surat,
        u.nama as nama_pemohon
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      WHERE ps.verifikator_id = ?
      ORDER BY ps.verifikasi_at DESC
      LIMIT 10
    `, [userId]);

    res.json({
      success: true,
      data: {
        menungguVerifikasi: menungguVerifikasi[0].total,
        sudahVerifikasi: sudahVerifikasi[0].total,
        recentVerifikasi,
        wilayah: { rt, rw }
      }
    });
  } catch (error) {
    console.error('Dashboard verifikasi error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get surat yang perlu verifikasi
exports.getSuratNeedVerification = async (req, res) => {
  try {
    const userId = req.user.id;
    const [user] = await db.query('SELECT rt, rw FROM users WHERE id = ?', [userId]);
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    const { rt, rw } = user[0];

    const [surat] = await db.query(`
      SELECT 
        ps.*,
        js.nama_surat,
        js.kode_surat,
        js.fields,
        js.template_konten,
        js.kalimat_pembuka,
        u.nama as nama_pemohon,
        u.nik as nik_pemohon,
        u.alamat as alamat_pemohon,
        u.no_telepon,
        u.rt,
        u.rw
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      WHERE ps.status_surat = 'menunggu_verifikasi'
      AND u.rt = ? AND u.rw = ?
      ORDER BY ps.created_at ASC
    `, [rt, rw]);

    res.json({
      success: true,
      data: surat
    });
  } catch (error) {
    console.error('Get surat need verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get riwayat verifikasi
exports.getRiwayatVerifikasi = async (req, res) => {
  try {
    const userId = req.user.id;

    const [surat] = await db.query(`
      SELECT 
        ps.*,
        js.nama_surat,
        u.nama as nama_pemohon,
        u.nik as nik_pemohon
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      WHERE ps.verifikator_id = ?
      ORDER BY ps.verifikasi_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: surat
    });
  } catch (error) {
    console.error('Get riwayat verifikasi error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Verify surat (approve)
exports.verifySurat = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, catatan } = req.body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action harus berisi "approve" atau "reject"'
      });
    }

    const userId = req.user.id;

    // Verify that this surat is from same RT/RW
    const [surat] = await db.query(`
      SELECT ps.*, u.rt, u.rw, v.rt as verif_rt, v.rw as verif_rw
      FROM pengajuan_surat ps
      JOIN users u ON ps.user_id = u.id
      JOIN users v ON v.id = ?
      WHERE ps.id = ?
    `, [userId, id]);

    if (surat.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Surat tidak ditemukan'
      });
    }

    if (surat[0].rt !== surat[0].verif_rt || surat[0].rw !== surat[0].verif_rw) {
      return res.status(403).json({
        success: false,
        message: 'Anda hanya bisa memverifikasi surat dari RT/RW yang sama'
      });
    }

    if (surat[0].status_surat !== 'menunggu_verifikasi') {
      return res.status(400).json({
        success: false,
        message: 'Surat ini sudah diverifikasi'
      });
    }

    if (action === 'approve') {
      // Approve - kirim ke super admin
      await db.query(
        `UPDATE pengajuan_surat 
         SET status_surat = 'diverifikasi', verifikator_id = ?, verifikasi_at = NOW(), catatan_verifikasi = ?
         WHERE id = ?`,
        [userId, catatan, id]
      );

      // Add history
      await db.query(
        'INSERT INTO riwayat_surat (pengajuan_id, user_id, action, keterangan) VALUES (?, ?, ?, ?)',
        [id, userId, 'verified', catatan || 'Diverifikasi oleh RT/RW']
      );

      res.json({
        success: true,
        message: 'Surat berhasil diverifikasi dan dikirim ke Super Admin'
      });
    } else {
      // Reject
      await db.query(
        `UPDATE pengajuan_surat 
         SET status_surat = 'ditolak', verifikator_id = ?, verifikasi_at = NOW(), catatan_verifikasi = ?
         WHERE id = ?`,
        [userId, catatan, id]
      );

      // Add history
      await db.query(
        'INSERT INTO riwayat_surat (pengajuan_id, user_id, action, keterangan) VALUES (?, ?, ?, ?)',
        [id, userId, 'rejected_by_verifikator', catatan || 'Ditolak oleh RT/RW']
      );

      res.json({
        success: true,
        message: 'Surat berhasil ditolak'
      });
    }
  } catch (error) {
    console.error('Verify surat error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get detail surat
exports.getSuratDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [surat] = await db.query(`
      SELECT 
        ps.*,
        js.nama_surat,
        js.template_konten,
        js.fields,
        u.nama as nama_pemohon,
        u.nik as nik_pemohon,
        u.alamat as alamat_pemohon,
        u.rt,
        u.rw,
        u.no_telepon,
        v.nama as nama_verifikator
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      LEFT JOIN users v ON ps.verifikator_id = v.id
      WHERE ps.id = ?
    `, [id]);

    if (surat.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Surat tidak ditemukan'
      });
    }

    // Verify RT/RW access
    const [verifikator] = await db.query('SELECT rt, rw FROM users WHERE id = ?', [userId]);
    
    if (surat[0].rt !== verifikator[0].rt || surat[0].rw !== verifikator[0].rw) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak'
      });
    }

    // Get history
    const [history] = await db.query(`
      SELECT 
        rs.*,
        u.nama as user_name
      FROM riwayat_surat rs
      JOIN users u ON rs.user_id = u.id
      WHERE rs.pengajuan_id = ?
      ORDER BY rs.created_at DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...surat[0],
        history
      }
    });
  } catch (error) {
    console.error('Get surat detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};
