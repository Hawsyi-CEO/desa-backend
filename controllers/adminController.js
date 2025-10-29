const db = require('../config/database');

// Dashboard stats
exports.getDashboard = async (req, res) => {
  try {
    // Total users
    const [totalUsers] = await db.query(
      'SELECT COUNT(*) as total FROM users WHERE role = "warga"'
    );

    // Total surat
    const [totalSurat] = await db.query(
      'SELECT COUNT(*) as total FROM pengajuan_surat'
    );

    // Surat by status
    const [suratByStatus] = await db.query(`
      SELECT 
        status_surat,
        COUNT(*) as total
      FROM pengajuan_surat
      GROUP BY status_surat
    `);

    // Recent surat
    const [recentSurat] = await db.query(`
      SELECT 
        ps.*,
        js.nama_surat,
        u.nama as nama_pemohon
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      ORDER BY ps.created_at DESC
      LIMIT 10
    `);

    // Jenis surat stats
    const [jenisSuratStats] = await db.query(`
      SELECT 
        js.nama_surat,
        COUNT(ps.id) as total
      FROM jenis_surat js
      LEFT JOIN pengajuan_surat ps ON js.id = ps.jenis_surat_id
      GROUP BY js.id, js.nama_surat
    `);

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers[0].total,
        totalSurat: totalSurat[0].total,
        suratByStatus,
        recentSurat,
        jenisSuratStats
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

// Get all jenis surat
exports.getJenisSurat = async (req, res) => {
  try {
    const [jenisSurat] = await db.query(`
      SELECT 
        js.*,
        u.nama as created_by_name
      FROM jenis_surat js
      LEFT JOIN users u ON js.created_by = u.id
      ORDER BY js.created_at DESC
    `);

    res.json({
      success: true,
      data: jenisSurat
    });
  } catch (error) {
    console.error('Get jenis surat error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get single jenis surat
exports.getJenisSuratById = async (req, res) => {
  try {
    const { id } = req.params;

    const [jenisSurat] = await db.query(
      'SELECT * FROM jenis_surat WHERE id = ?',
      [id]
    );

    if (jenisSurat.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jenis surat tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: jenisSurat[0]
    });
  } catch (error) {
    console.error('Get jenis surat error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Create jenis surat
exports.createJenisSurat = async (req, res) => {
  try {
    const { nama_surat, kode_surat, deskripsi, format_nomor, kalimat_pembuka, template_konten, fields, require_verification } = req.body;

    // Validasi
    if (!nama_surat || !kode_surat || !template_konten) {
      return res.status(400).json({
        success: false,
        message: 'Nama surat, kode surat, dan template konten harus diisi'
      });
    }

    const [result] = await db.query(
      `INSERT INTO jenis_surat (nama_surat, kode_surat, deskripsi, format_nomor, kalimat_pembuka, template_konten, fields, require_verification, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nama_surat, 
        kode_surat, 
        deskripsi, 
        format_nomor || 'NOMOR/KODE/BULAN/TAHUN',
        kalimat_pembuka || 'Yang bertanda tangan di bawah ini, Kepala Desa Cibadak, dengan ini menerangkan bahwa :',
        template_konten, 
        JSON.stringify(fields), 
        require_verification, 
        req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Jenis surat berhasil ditambahkan',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Create jenis surat error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Kode surat sudah digunakan'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Update jenis surat
exports.updateJenisSurat = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_surat, kode_surat, deskripsi, format_nomor, kalimat_pembuka, template_konten, fields, require_verification, status } = req.body;

    await db.query(
      `UPDATE jenis_surat 
       SET nama_surat = ?, kode_surat = ?, deskripsi = ?, format_nomor = ?, kalimat_pembuka = ?, template_konten = ?, fields = ?, require_verification = ?, status = ?
       WHERE id = ?`,
      [
        nama_surat, 
        kode_surat, 
        deskripsi, 
        format_nomor || 'NOMOR/KODE/BULAN/TAHUN',
        kalimat_pembuka || 'Yang bertanda tangan di bawah ini, Kepala Desa Cibadak, dengan ini menerangkan bahwa :',
        template_konten, 
        JSON.stringify(fields), 
        require_verification, 
        status, 
        id
      ]
    );

    res.json({
      success: true,
      message: 'Jenis surat berhasil diupdate'
    });
  } catch (error) {
    console.error('Update jenis surat error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Delete jenis surat
exports.deleteJenisSurat = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM jenis_surat WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Jenis surat berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete jenis surat error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get all surat
exports.getAllSurat = async (req, res) => {
  try {
    const { status, jenis } = req.query;

    let query = `
      SELECT 
        ps.*,
        js.nama_surat,
        js.kode_surat,
        js.fields,
        js.template_konten,
        js.kalimat_pembuka,
        js.format_nomor,
        u.nama as nama_pemohon,
        u.nik as nik_pemohon,
        u.alamat as alamat_pemohon,
        u.rt,
        u.rw,
        v.nama as nama_verifikator,
        a.nama as nama_approver
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      LEFT JOIN users v ON ps.verifikator_id = v.id
      LEFT JOIN users a ON ps.approved_by = a.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND ps.status_surat = ?';
      params.push(status);
    }

    if (jenis) {
      query += ' AND ps.jenis_surat_id = ?';
      params.push(jenis);
    }

    query += ' ORDER BY ps.created_at DESC';

    const [surat] = await db.query(query, params);

    res.json({
      success: true,
      data: surat
    });
  } catch (error) {
    console.error('Get all surat error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get surat detail
exports.getSuratDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [surat] = await db.query(`
      SELECT 
        ps.*,
        js.nama_surat,
        js.kode_surat,
        js.format_nomor,
        js.kalimat_pembuka,
        js.template_konten,
        js.fields,
        u.nama as nama_pemohon,
        u.nik as nik_pemohon,
        u.alamat as alamat_pemohon,
        u.rt,
        u.rw,
        v.nama as nama_verifikator,
        a.nama as nama_approver
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      LEFT JOIN users v ON ps.verifikator_id = v.id
      LEFT JOIN users a ON ps.approved_by = a.id
      WHERE ps.id = ?
    `, [id]);

    if (surat.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Surat tidak ditemukan'
      });
    }

    // Parse data_surat dan fields untuk kemudahan
    const suratData = {
      ...surat[0],
      jenis_surat: {
        nama_surat: surat[0].nama_surat,
        kode_surat: surat[0].kode_surat,
        format_nomor: surat[0].format_nomor,
        kalimat_pembuka: surat[0].kalimat_pembuka,
        template_konten: surat[0].template_konten,
        fields: surat[0].fields
      }
    };

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
        ...suratData,
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

// Get surat yang menunggu approval admin (multi-level aware)
exports.getSuratMenungguApproval = async (req, res) => {
  try {
    // Get surat dengan status menunggu_admin
    const [surat] = await db.query(`
      SELECT 
        ps.*,
        js.nama_surat,
        js.kode_surat,
        js.require_rt_verification,
        js.require_rw_verification,
        u.nama as nama_pemohon,
        u.nik as nik_pemohon,
        u.rt as pemohon_rt,
        u.rw as pemohon_rw,
        (SELECT COUNT(*) FROM verification_flow 
         WHERE pengajuan_id = ps.id 
         AND status = 'approved') as completed_verifications,
        (SELECT COUNT(*) FROM verification_flow 
         WHERE pengajuan_id = ps.id) as total_verifications
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      WHERE ps.status_surat = 'menunggu_admin'
      AND ps.current_verification_level = 'admin'
      ORDER BY ps.created_at ASC
    `);

    // Ambil verification flow untuk setiap surat
    for (let i = 0; i < surat.length; i++) {
      const [flows] = await db.query(`
        SELECT 
          vf.*,
          u.nama as verifier_name
        FROM verification_flow vf
        LEFT JOIN users u ON vf.verifier_id = u.id
        WHERE vf.pengajuan_id = ?
        ORDER BY vf.sequence_order
      `, [surat[i].id]);
      
      surat[i].verification_history = flows;
    }

    res.json({
      success: true,
      data: surat,
      meta: {
        total: surat.length,
        message: 'Surat yang telah melewati verifikasi RT/RW dan menunggu approval final admin'
      }
    });
  } catch (error) {
    console.error('Get surat menunggu approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Approve surat (FINAL ADMIN APPROVAL - Multi-level aware)
exports.approveSurat = async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan, tanggal_surat } = req.body;
    const userId = req.user.id;

    // Get pengajuan info
    const [suratInfo] = await db.query(`
      SELECT ps.*, js.format_nomor, js.kode_surat, js.require_rt_verification, js.require_rw_verification
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      WHERE ps.id = ?
    `, [id]);

    if (suratInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Surat tidak ditemukan'
      });
    }

    const surat = suratInfo[0];

    // Validasi: hanya admin yang bisa final approve
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang bisa melakukan approval final'
      });
    }

    // Validasi: status harus menunggu_admin
    if (surat.status_surat !== 'menunggu_admin') {
      return res.status(400).json({
        success: false,
        message: `Surat tidak dalam status menunggu_admin (status saat ini: ${surat.status_surat})`
      });
    }

    // Generate nomor surat otomatis berdasarkan format
    const [lastSurat] = await db.query(
      'SELECT no_surat FROM pengajuan_surat WHERE jenis_surat_id = ? AND no_surat IS NOT NULL ORDER BY id DESC LIMIT 1',
      [surat.jenis_surat_id]
    );

    let nomorUrut = 1;
    if (lastSurat.length > 0 && lastSurat[0].no_surat) {
      // Extract nomor from last surat
      const match = lastSurat[0].no_surat.match(/\d+/);
      if (match) {
        nomorUrut = parseInt(match[0]) + 1;
      }
    }

    const tahun = new Date(tanggal_surat || new Date()).getFullYear();
    const bulan = String(new Date(tanggal_surat || new Date()).getMonth() + 1).padStart(2, '0');
    
    // Generate berdasarkan format custom
    const finalNoSurat = (surat.format_nomor || 'NOMOR/KODE/BULAN/TAHUN')
      .replace(/NOMOR/g, String(nomorUrut).padStart(3, '0'))
      .replace(/KODE/g, surat.kode_surat)
      .replace(/BULAN/g, bulan)
      .replace(/TAHUN/g, tahun);

    // Update pengajuan_surat: FINAL APPROVAL
    await db.query(
      `UPDATE pengajuan_surat 
       SET status_surat = 'disetujui', 
           current_verification_level = 'completed',
           approved_by = ?, 
           approved_at = NOW(), 
           catatan_approval = ?, 
           no_surat = ?, 
           tanggal_surat = ?
       WHERE id = ?`,
      [userId, catatan, finalNoSurat, tanggal_surat || new Date(), id]
    );

    // Update verification_flow: mark admin level as approved
    await db.query(
      `UPDATE verification_flow 
       SET status = 'approved', 
           verifier_id = ?,
           keterangan = ?,
           verified_at = NOW()
       WHERE pengajuan_id = ? 
       AND level_type = 'admin'
       AND status = 'pending'`,
      [userId, catatan || 'Disetujui', id]
    );

    // Add history
    await db.query(
      'INSERT INTO riwayat_surat (pengajuan_id, user_id, action, keterangan) VALUES (?, ?, ?, ?)',
      [id, userId, 'approved', catatan || `Disetujui dengan nomor: ${finalNoSurat}`]
    );

    res.json({
      success: true,
      message: 'Surat berhasil disetujui (FINAL)',
      data: { 
        no_surat: finalNoSurat,
        status: 'disetujui',
        level: 'completed'
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

// Reject surat (ADMIN REJECTION - Multi-level aware)
exports.rejectSurat = async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan } = req.body;
    const userId = req.user.id;

    if (!catatan) {
      return res.status(400).json({
        success: false,
        message: 'Catatan penolakan harus diisi'
      });
    }

    // Get pengajuan info
    const [pengajuan] = await db.query(
      `SELECT ps.*, js.require_rt_verification, js.require_rw_verification
       FROM pengajuan_surat ps
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

    // Admin reject: kembali ke RW (jika ada) atau RT (jika ada) atau warga
    let previousStatus;
    let previousLevel;

    if (surat.require_rw_verification) {
      // Ada RW: kembali ke RW
      previousStatus = 'menunggu_verifikasi_rw';
      previousLevel = 'rw';
    } else if (surat.require_rt_verification) {
      // Ada RT tapi tidak ada RW: kembali ke RT
      previousStatus = 'menunggu_verifikasi_rt';
      previousLevel = 'rt';
    } else {
      // Tidak ada RT/RW: ditolak final
      previousStatus = 'ditolak';
      previousLevel = null;
    }

    // Update pengajuan_surat
    await db.query(
      `UPDATE pengajuan_surat 
       SET status_surat = ?, 
           current_verification_level = ?,
           rejected_by = ?, 
           rejected_at = NOW(), 
           catatan_reject = ?
       WHERE id = ?`,
      [previousStatus, previousLevel, userId, catatan, id]
    );

    // Update verification_flow: mark admin level as rejected
    await db.query(
      `UPDATE verification_flow 
       SET status = 'rejected', 
           verifier_id = ?,
           keterangan = ?,
           verified_at = NOW()
       WHERE pengajuan_id = ? 
       AND level_type = 'admin'`,
      [userId, catatan, id]
    );

    // Add history
    await db.query(
      'INSERT INTO riwayat_surat (pengajuan_id, user_id, action, keterangan) VALUES (?, ?, ?, ?)',
      [id, userId, 'rejected', `Ditolak oleh Admin: ${catatan}`]
    );

    res.json({
      success: true,
      message: 'Surat ditolak oleh Admin',
      data: {
        previous_status: previousStatus,
        previous_level: previousLevel,
        reason: catatan
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

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;

    let query = 'SELECT id, nik, nama, email, role, no_telepon, alamat, rt, rw, status, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (nama LIKE ? OR nik LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Count total
    const countQuery = query.replace('SELECT id, nik, nama, email, role, no_telepon, alamat, rt, rw, status, created_at', 'SELECT COUNT(*) as total');
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    query += ' ORDER BY FIELD(role, "super_admin", "admin", "verifikator", "warga"), created_at DESC';
    
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await db.query(query, params);

    res.json({
      success: true,
      data: users,
      total: total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      perPage: parseInt(limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as super_admin,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin,
        SUM(CASE WHEN role = 'verifikator' THEN 1 ELSE 0 END) as verifikator,
        SUM(CASE WHEN role = 'warga' THEN 1 ELSE 0 END) as warga,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as aktif,
        SUM(CASE WHEN status = 'nonaktif' THEN 1 ELSE 0 END) as nonaktif
      FROM users
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);

    res.json({
      success: true,
      message: 'Status user berhasil diupdate'
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const {
      nik, nama, email, password, role, status,
      no_telepon, alamat, rt, rw, dusun,
      tempat_lahir, tanggal_lahir, jenis_kelamin,
      agama, pekerjaan, pendidikan, status_perkawinan,
      golongan_darah, no_kk, nama_kepala_keluarga,
      hubungan_keluarga
    } = req.body;

    console.log('Creating new user:', { nik, nama, email, role });

    // Validasi required fields
    if (!nik || !nama || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'NIK, nama, email, dan role wajib diisi'
      });
    }

    // Validasi role
    const validRoles = ['super_admin', 'admin', 'verifikator', 'warga'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role tidak valid'
      });
    }

    // Check if NIK already exists
    const [existingNik] = await db.query(
      'SELECT id FROM users WHERE nik = ?',
      [nik]
    );

    if (existingNik.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'NIK sudah terdaftar'
      });
    }

    // Check if email already exists
    const [existingEmail] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = password 
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash('password123', 10);

    // Convert empty strings to null
    const cleanData = {
      no_telepon: no_telepon || null,
      alamat: alamat || null,
      rt: rt || null,
      rw: rw || null,
      dusun: dusun || null,
      tempat_lahir: tempat_lahir || null,
      tanggal_lahir: tanggal_lahir || null,
      jenis_kelamin: jenis_kelamin || null,
      agama: agama || null,
      pekerjaan: pekerjaan || null,
      pendidikan: pendidikan || null,
      status_perkawinan: status_perkawinan || null,
      golongan_darah: golongan_darah || null,
      no_kk: no_kk || null,
      nama_kepala_keluarga: nama_kepala_keluarga || null,
      hubungan_keluarga: hubungan_keluarga || null,
      status: status || 'aktif'
    };

    // Insert new user
    const [result] = await db.query(
      `INSERT INTO users (
        nik, nama, email, password, role, status,
        no_telepon, alamat, rt, rw, dusun,
        tempat_lahir, tanggal_lahir, jenis_kelamin,
        agama, pekerjaan, pendidikan, status_perkawinan,
        golongan_darah, no_kk, nama_kepala_keluarga,
        hubungan_keluarga, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        nik, nama, email, hashedPassword, role, cleanData.status,
        cleanData.no_telepon, cleanData.alamat, cleanData.rt, cleanData.rw, cleanData.dusun,
        cleanData.tempat_lahir, cleanData.tanggal_lahir, cleanData.jenis_kelamin,
        cleanData.agama, cleanData.pekerjaan, cleanData.pendidikan, cleanData.status_perkawinan,
        cleanData.golongan_darah, cleanData.no_kk, cleanData.nama_kepala_keluarga,
        cleanData.hubungan_keluarga
      ]
    );

    console.log('User created successfully, ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'User berhasil ditambahkan',
      data: {
        id: result.insertId,
        nik,
        nama,
        email,
        role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan user',
      error: error.message
    });
  }
};

// Reset user password
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    console.log('Resetting password for user ID:', id);

    // Validasi input
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password baru wajib diisi'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter'
      });
    }

    // Check if user exists
    const [users] = await db.query(
      'SELECT id, nama, email FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    console.log('Password reset successfully for user:', users[0].nama);

    res.json({
      success: true,
      message: `Password untuk ${users[0].nama} berhasil direset`
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mereset password',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Deleting user ID:', id);

    // Check if user exists
    const [users] = await db.query(
      'SELECT id, nama, role FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Prevent deleting super_admin
    if (users[0].role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super Admin tidak dapat dihapus'
      });
    }

    // Check if user has any surat
    const [suratCount] = await db.query(
      'SELECT COUNT(*) as total FROM pengajuan_surat WHERE user_id = ?',
      [id]
    );

    if (suratCount[0].total > 0) {
      return res.status(400).json({
        success: false,
        message: `User tidak dapat dihapus karena memiliki ${suratCount[0].total} pengajuan surat`
      });
    }

    // Delete user
    await db.query('DELETE FROM users WHERE id = ?', [id]);

    console.log('User deleted successfully:', users[0].nama);

    res.json({
      success: true,
      message: `User ${users[0].nama} berhasil dihapus`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus user',
      error: error.message
    });
  }
};

// Update user (role and status only)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    console.log('Updating user ID:', id, { role, status });

    // Check if user exists
    const [users] = await db.query(
      'SELECT id, nama, role as current_role FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Prevent changing super_admin role
    if (users[0].current_role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Role Super Admin tidak dapat diubah'
      });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['super_admin', 'admin', 'verifikator', 'warga'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role tidak valid'
        });
      }

      // Prevent changing to super_admin
      if (role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Tidak dapat mengubah user menjadi Super Admin'
        });
      }
    }

    // Build update query
    const updates = [];
    const values = [];

    if (role) {
      updates.push('role = ?');
      values.push(role);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data yang diupdate'
      });
    }

    values.push(id);

    // Update user
    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    console.log('User updated successfully:', users[0].nama);

    res.json({
      success: true,
      message: `User ${users[0].nama} berhasil diupdate`
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengupdate user',
      error: error.message
    });
  }
};

// Delete single surat
exports.deleteSurat = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if surat exists
    const [surat] = await db.query(
      'SELECT * FROM pengajuan_surat WHERE id = ?',
      [id]
    );

    if (surat.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Surat tidak ditemukan'
      });
    }

    // Delete surat
    await db.query('DELETE FROM pengajuan_surat WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Surat berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting surat:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus surat',
      error: error.message
    });
  }
};

// Bulk delete surat
exports.bulkDeleteSurat = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { ids } = req.body;

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ID surat tidak valid'
      });
    }

    // Start transaction
    await connection.beginTransaction();

    // Delete all surat with given IDs
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await connection.query(
      `DELETE FROM pengajuan_surat WHERE id IN (${placeholders})`,
      ids
    );

    // Commit transaction
    await connection.commit();

    res.json({
      success: true,
      message: `${result.affectedRows} surat berhasil dihapus`,
      deletedCount: result.affectedRows
    });
  } catch (error) {
    // Rollback on error
    await connection.rollback();
    console.error('Error bulk deleting surat:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus surat',
      error: error.message
    });
  } finally {
    connection.release();
  }
};
