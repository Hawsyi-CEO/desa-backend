const db = require('../config/database');

// Get warga data by NIK (untuk autofill form surat)
exports.getWargaByNik = async (req, res) => {
  try {
    const { nik } = req.params;

    // Validasi NIK
    if (!nik || nik.length !== 16) {
      return res.status(400).json({
        success: false,
        message: 'NIK harus 16 digit'
      });
    }

    // Get warga data
    const [warga] = await db.query(
      `SELECT 
        nik,
        nama,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        pekerjaan,
        agama,
        status_perkawinan,
        kewarganegaraan,
        pendidikan,
        golongan_darah,
        alamat,
        dusun,
        rt,
        rw,
        no_telepon,
        no_kk,
        nama_kepala_keluarga,
        hubungan_keluarga
      FROM users 
      WHERE nik = ? AND role = 'warga' AND status = 'aktif'`,
      [nik]
    );

    if (warga.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data warga dengan NIK tersebut tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: warga[0]
    });
  } catch (error) {
    console.error('Get warga by NIK error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get jenis surat yang aktif
exports.getJenisSurat = async (req, res) => {
  try {
    const [jenisSurat] = await db.query(
      `SELECT 
        id, 
        nama_surat, 
        kode_surat, 
        deskripsi, 
        format_nomor,
        kalimat_pembuka,
        template_konten,
        fields, 
        require_verification 
      FROM jenis_surat 
      WHERE status = "aktif" 
      ORDER BY nama_surat`
    );

    // Convert require_verification to boolean (MySQL returns 1/0)
    const formattedData = jenisSurat.map(jenis => ({
      ...jenis,
      require_verification: Boolean(jenis.require_verification)
    }));

    console.log('📋 Jenis surat for warga:', formattedData.map(j => ({
      nama: j.nama_surat,
      require_verification: j.require_verification
    })));

    res.json({
      success: true,
      data: formattedData
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

// Create pengajuan surat
exports.createPengajuanSurat = async (req, res) => {
  try {
    const { jenis_surat_id, data_surat, keperluan } = req.body;
    const userId = req.user.id;
    const lampiran = req.file ? req.file.filename : null;

    // Validasi
    if (!jenis_surat_id || !data_surat) {
      return res.status(400).json({
        success: false,
        message: 'Jenis surat dan data surat harus diisi'
      });
    }

    // Parse data_surat if it's a string (from FormData)
    let parsedDataSurat = data_surat;
    if (typeof data_surat === 'string') {
      try {
        parsedDataSurat = JSON.parse(data_surat);
      } catch (e) {
        parsedDataSurat = data_surat;
      }
    }

    // Check if jenis surat exists and aktif
    const [jenisSurat] = await db.query(
      'SELECT * FROM jenis_surat WHERE id = ? AND status = "aktif"',
      [jenis_surat_id]
    );

    if (jenisSurat.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jenis surat tidak ditemukan atau tidak aktif'
      });
    }

    const jenis = jenisSurat[0];
    
    // Get user data (for RT/RW info in notification)
    const [userData] = await db.query(
      'SELECT rt, rw FROM users WHERE id = ?',
      [userId]
    );
    const user = userData[0];
    
    // Determine initial status and verification level based on requirements
    let initialStatus;
    let initialLevel = null;
    let sequenceOrder = 1;

    const requireRT = jenis.require_rt_verification || false;
    const requireRW = jenis.require_rw_verification || false;
    const requireVerification = jenis.require_verification || false;

    console.log('🔍 Verification Requirements:', {
      jenis_surat: jenis.nama_surat,
      require_verification: requireVerification,
      require_rt_verification: requireRT,
      require_rw_verification: requireRW
    });

    // Logic: Jika require_verification = false, langsung ke admin tanpa verifikasi RT/RW
    if (!requireVerification) {
      initialStatus = 'menunggu_admin';
      initialLevel = 'admin';
      console.log('✅ Surat tidak butuh verifikasi → langsung ke admin');
    } 
    // Jika butuh verifikasi dan ada RT verification
    else if (requireRT) {
      initialStatus = 'menunggu_verifikasi_rt';
      initialLevel = 'rt';
      console.log('✅ Surat butuh verifikasi RT → ke RT terlebih dahulu');
    } 
    // Jika butuh verifikasi tapi tidak ada RT, cek RW
    else if (requireRW) {
      initialStatus = 'menunggu_verifikasi_rw';
      initialLevel = 'rw';
      console.log('✅ Surat butuh verifikasi RW → ke RW terlebih dahulu');
    } 
    // Jika butuh verifikasi tapi tidak ada RT/RW setting, langsung ke admin
    else {
      initialStatus = 'menunggu_admin';
      initialLevel = 'admin';
      console.log('✅ Surat butuh verifikasi tapi tidak ada RT/RW → langsung ke admin');
    }

    // Create pengajuan
    const [result] = await db.query(
      `INSERT INTO pengajuan_surat 
       (jenis_surat_id, user_id, data_surat, keperluan, lampiran, status_surat, current_verification_level) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [jenis_surat_id, userId, JSON.stringify(parsedDataSurat), keperluan, lampiran, initialStatus, initialLevel]
    );

    const pengajuanId = result.insertId;

    // Create verification flow steps (hanya jika butuh verifikasi)
    if (requireVerification && (requireRT || requireRW)) {
      const verificationSteps = [];
      
      console.log('📋 Creating verification flow...');
      
      // Step 1: RT verification (if required)
      if (requireRT) {
        verificationSteps.push([pengajuanId, 'rt', sequenceOrder++, 'pending']);
        console.log('  ✓ Added RT verification step');
      }
      
      // Step 2: RW verification (if required)
      if (requireRW) {
        verificationSteps.push([pengajuanId, 'rw', sequenceOrder++, 'pending']);
        console.log('  ✓ Added RW verification step');
      }
      
      // Step 3: Admin verification (always required if needs RT/RW verification)
      verificationSteps.push([pengajuanId, 'admin', sequenceOrder++, 'pending']);
      console.log('  ✓ Added Admin verification step');
      
      // Insert all verification steps
      if (verificationSteps.length > 0) {
        await db.query(
          `INSERT INTO verification_flow 
           (pengajuan_id, level_type, sequence_order, status) 
           VALUES ?`,
          [verificationSteps]
        );
        console.log(`✅ Created ${verificationSteps.length} verification steps`);
      }
    } else {
      console.log('⏭️ No verification flow needed (require_verification = false)');
    }

    // Add history
    await db.query(
      'INSERT INTO riwayat_surat (pengajuan_id, user_id, action, keterangan) VALUES (?, ?, ?, ?)',
      [pengajuanId, userId, 'created', 'Pengajuan surat dibuat']
    );

    // 🔔 Create notification for warga (confirmation)
    let notifMessage = '';
    if (!requireVerification) {
      notifMessage = `Pengajuan surat ${jenis.nama_surat} berhasil dibuat dan akan langsung diproses oleh Kepala Desa (tanpa verifikasi RT/RW)`;
    } else if (requireRT) {
      notifMessage = `Pengajuan surat ${jenis.nama_surat} berhasil dibuat dan menunggu verifikasi dari RT ${user.rt}`;
    } else if (requireRW) {
      notifMessage = `Pengajuan surat ${jenis.nama_surat} berhasil dibuat dan menunggu verifikasi dari RW ${user.rw}`;
    } else {
      notifMessage = `Pengajuan surat ${jenis.nama_surat} berhasil dibuat dan menunggu persetujuan admin`;
    }

    await db.query(
      `INSERT INTO notifications (user_id, pengajuan_id, type, title, message) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, pengajuanId, 'info', 'Surat Berhasil Diajukan', notifMessage]
    );

    console.log('✅ Pengajuan surat berhasil dibuat:', {
      id: pengajuanId,
      status: initialStatus,
      level: initialLevel,
      require_verification: requireVerification,
      require_rt: requireRT,
      require_rw: requireRW
    });

    res.status(201).json({
      success: true,
      message: 'Pengajuan surat berhasil dibuat',
      data: {
        id: pengajuanId,
        status: initialStatus,
        verification_required: requireVerification,
        verification_flow: {
          require_rt: requireRT,
          require_rw: requireRW,
          current_level: initialLevel
        }
      }
    });
  } catch (error) {
    console.error('Create pengajuan error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get history pengajuan surat
exports.getHistorySurat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT 
        ps.*,
        js.nama_surat,
        js.kode_surat
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      WHERE ps.user_id = ?
    `;

    const params = [userId];

    if (status) {
      query += ' AND ps.status_surat = ?';
      params.push(status);
    }

    query += ' ORDER BY ps.created_at DESC';

    const [surat] = await db.query(query, params);

    res.json({
      success: true,
      data: surat
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get detail pengajuan surat
exports.getSuratDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [surat] = await db.query(`
      SELECT 
        ps.*,
        js.nama_surat,
        js.kode_surat,
        js.template_konten,
        js.fields,
        v.nama as nama_verifikator,
        a.nama as nama_approver,
        r.nama as nama_rejector
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      LEFT JOIN users v ON ps.verifikator_id = v.id
      LEFT JOIN users a ON ps.approved_by = a.id
      LEFT JOIN users r ON ps.rejected_by = r.id
      WHERE ps.id = ? AND ps.user_id = ?
    `, [id, userId]);

    if (surat.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Surat tidak ditemukan'
      });
    }

    // Get history
    const [history] = await db.query(`
      SELECT 
        rs.*,
        u.nama as user_name,
        u.role
      FROM riwayat_surat rs
      JOIN users u ON rs.user_id = u.id
      WHERE rs.pengajuan_id = ?
      ORDER BY rs.created_at ASC
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

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { nama, no_telepon, alamat, rt, rw } = req.body;
    const userId = req.user.id;

    await db.query(
      'UPDATE users SET nama = ?, no_telepon = ?, alamat = ?, rt = ?, rw = ? WHERE id = ?',
      [nama, no_telepon, alamat, rt, rw, userId]
    );

    res.json({
      success: true,
      message: 'Profile berhasil diupdate'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get dashboard stats for warga
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Count by status
    const [stats] = await db.query(`
      SELECT 
        status_surat,
        COUNT(*) as total
      FROM pengajuan_surat
      WHERE user_id = ?
      GROUP BY status_surat
    `, [userId]);

    // Total surat
    const [total] = await db.query(
      'SELECT COUNT(*) as total FROM pengajuan_surat WHERE user_id = ?',
      [userId]
    );

    // Recent surat
    const [recent] = await db.query(`
      SELECT 
        ps.*,
        js.nama_surat
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      WHERE ps.user_id = ?
      ORDER BY ps.created_at DESC
      LIMIT 5
    `, [userId]);

    res.json({
      success: true,
      data: {
        total: total[0].total,
        stats,
        recent
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

// Update surat untuk revisi
exports.updateSuratRevisi = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { data_surat, keperluan } = req.body;

    // First check if surat exists and belongs to user
    const [allSurat] = await db.query(
      `SELECT * FROM pengajuan_surat 
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (allSurat.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Surat tidak ditemukan'
      });
    }

    const currentSurat = allSurat[0];

    // Check if surat is in revision status
    if (currentSurat.status_surat !== 'revisi_rt' && currentSurat.status_surat !== 'revisi_rw') {
      return res.status(400).json({
        success: false,
        message: `Surat tidak dalam status revisi. Status saat ini: ${currentSurat.status_surat}`,
        current_status: currentSurat.status_surat
      });
    }

    // Check if surat exists and belongs to user with revision status
    const [surat] = await db.query(
      `SELECT * FROM pengajuan_surat 
       WHERE id = ? AND user_id = ? 
       AND (status_surat = 'revisi_rt' OR status_surat = 'revisi_rw')`,
      [id, userId]
    );

    if (surat.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Surat tidak ditemukan atau tidak dalam status revisi'
      });
    }

    // Update surat data and reset status to appropriate verification level
    const dataSuratJson = typeof data_surat === 'string' 
      ? data_surat 
      : JSON.stringify(data_surat);

    // Determine new status based on current status
    let newStatus = 'menunggu_verifikasi_rt'; // Default to RT verification
    if (surat[0].status_surat === 'revisi_rt') {
      newStatus = 'menunggu_verifikasi_rt';
    } else if (surat[0].status_surat === 'revisi_rw') {
      newStatus = 'menunggu_verifikasi_rw';
    }

    await db.query(
      `UPDATE pengajuan_surat 
       SET data_surat = ?, 
           keperluan = ?,
           status_surat = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [dataSuratJson, keperluan || surat[0].keperluan, newStatus, id]
    );

    // Log revision to riwayat_surat
    await db.query(
      `INSERT INTO riwayat_surat 
       (pengajuan_id, user_id, action, keterangan, created_at) 
       VALUES (?, ?, 'revisi', ?, NOW())`,
      [id, userId, `Surat direvisi dan diajukan kembali dengan status ${newStatus}`]
    );

    res.json({
      success: true,
      message: 'Surat berhasil direvisi dan diajukan kembali'
    });
  } catch (error) {
    console.error('Update surat revisi error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Delete draft surat
exports.deleteDraftSurat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if surat is draft and belongs to user
    const [surat] = await db.query(
      'SELECT * FROM pengajuan_surat WHERE id = ? AND user_id = ? AND status_surat = "draft"',
      [id, userId]
    );

    if (surat.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Draft surat tidak ditemukan atau sudah diajukan'
      });
    }

    await db.query('DELETE FROM pengajuan_surat WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Draft surat berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// ==================== MANAJEMEN DATA WARGA ====================

// Get all warga (untuk admin/super_admin)
exports.getAllWarga = async (req, res) => {
  try {
    const { role, rt, rw } = req.user;
    const { search, rt: filterRt, rw: filterRw, jenis_kelamin, pekerjaan, page = 1, limit = 10 } = req.query;

    console.log('getAllWarga - Query params:', { search, filterRt, filterRw, jenis_kelamin, pekerjaan, page, limit });
    console.log('User role:', role, 'RT:', rt, 'RW:', rw);

    let query = `
      SELECT 
        u.id,
        u.nik,
        u.nama,
        u.email,
        u.alamat,
        u.rt,
        u.rw,
        u.dusun,
        u.tempat_lahir,
        u.tanggal_lahir,
        TIMESTAMPDIFF(YEAR, u.tanggal_lahir, CURDATE()) as usia,
        u.jenis_kelamin,
        u.agama,
        u.pekerjaan,
        u.pendidikan,
        u.status_perkawinan,
        u.golongan_darah,
        u.no_kk,
        u.nama_kepala_keluarga,
        u.hubungan_keluarga,
        u.no_telepon,
        u.status,
        u.created_at
      FROM users u
      WHERE u.role = 'warga'
    `;

    const params = [];

    // Filter berdasarkan role
    if (role === 'admin') {
      query += ` AND u.rt = ? AND u.rw = ?`;
      params.push(rt, rw);
    }

    // Filter berdasarkan RT/RW jika ada (flexible matching)
    if (filterRt) {
      // Remove leading zeros for comparison or match with LIKE
      query += ` AND (u.rt = ? OR u.rt = ? OR u.rt LIKE ?)`;
      params.push(filterRt, filterRt.replace(/^0+/, ''), `%${filterRt.replace(/^0+/, '')}%`);
    }
    if (filterRw) {
      // Remove leading zeros for comparison or match with LIKE
      query += ` AND (u.rw = ? OR u.rw = ? OR u.rw LIKE ?)`;
      params.push(filterRw, filterRw.replace(/^0+/, ''), `%${filterRw.replace(/^0+/, '')}%`);
    }

    // Filter berdasarkan Jenis Kelamin
    if (jenis_kelamin) {
      query += ` AND u.jenis_kelamin = ?`;
      params.push(jenis_kelamin);
      console.log('Filter jenis_kelamin:', jenis_kelamin);
    }

    // Filter berdasarkan Pekerjaan
    if (pekerjaan) {
      query += ` AND u.pekerjaan = ?`;
      params.push(pekerjaan);
      console.log('Filter pekerjaan:', pekerjaan);
    }

    // Search
    if (search) {
      query += ` AND (u.nik LIKE ? OR u.nama LIKE ? OR u.alamat LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      console.log('Search term:', search);
    }

    // Count total - create proper count query
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/i, 
      'SELECT COUNT(DISTINCT u.id) as total FROM'
    );
    console.log('Count Query:', countQuery);
    console.log('Count Params:', params);
    
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    console.log('Total records:', total);
    console.log('Total pages:', totalPages);

    // Pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [warga] = await db.query(query, params);

    console.log('📦 Returning data:', {
      dataLength: warga.length,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });

    res.json({
      success: true,
      data: warga,
      pagination: {
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: parseInt(totalPages)
      }
    });
  } catch (error) {
    console.error('Error get all warga:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data warga'
    });
  }
};

// Get warga by ID
exports.getWargaById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, rt, rw } = req.user;

    let query = `
      SELECT 
        u.id,
        u.nik,
        u.nama,
        u.email,
        u.alamat,
        u.rt,
        u.rw,
        u.dusun,
        u.tempat_lahir,
        u.tanggal_lahir,
        TIMESTAMPDIFF(YEAR, u.tanggal_lahir, CURDATE()) as usia,
        u.jenis_kelamin,
        u.agama,
        u.pekerjaan,
        u.pendidikan,
        u.status_perkawinan,
        u.golongan_darah,
        u.kewarganegaraan,
        u.no_kk,
        u.nama_kepala_keluarga,
        u.hubungan_keluarga,
        u.no_telepon,
        u.status,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.id = ? AND u.role = 'warga'
    `;

    const params = [id];

    // Filter berdasarkan role
    if (role === 'admin') {
      query += ` AND u.rt = ? AND u.rw = ?`;
      params.push(rt, rw);
    }

    const [warga] = await db.query(query, params);

    if (warga.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data warga tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: warga[0]
    });
  } catch (error) {
    console.error('Error get warga by id:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data warga'
    });
  }
};

// Update warga
exports.updateWarga = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, rt: userRt, rw: userRw } = req.user;
    const {
      nama,
      alamat,
      rt,
      rw,
      dusun,
      tempat_lahir,
      tanggal_lahir,
      jenis_kelamin,
      agama,
      pekerjaan,
      pendidikan,
      status_perkawinan,
      golongan_darah,
      no_telepon
    } = req.body;

    // Cek apakah warga ada dan sesuai dengan wilayah admin
    let checkQuery = 'SELECT id FROM users WHERE id = ? AND role = "warga"';
    const checkParams = [id];

    if (role === 'admin') {
      checkQuery += ' AND rt = ? AND rw = ?';
      checkParams.push(userRt, userRw);
    }

    const [existing] = await db.query(checkQuery, checkParams);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data warga tidak ditemukan atau tidak dapat diakses'
      });
    }

    // Update data
    const updateQuery = `
      UPDATE users SET
        nama = ?,
        alamat = ?,
        rt = ?,
        rw = ?,
        dusun = ?,
        tempat_lahir = ?,
        tanggal_lahir = ?,
        jenis_kelamin = ?,
        agama = ?,
        pekerjaan = ?,
        pendidikan = ?,
        status_perkawinan = ?,
        golongan_darah = ?,
        no_telepon = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    await db.query(updateQuery, [
      nama,
      alamat,
      rt,
      rw,
      dusun,
      tempat_lahir,
      tanggal_lahir,
      jenis_kelamin,
      agama,
      pekerjaan,
      pendidikan,
      status_perkawinan,
      golongan_darah,
      no_telepon,
      id
    ]);

    res.json({
      success: true,
      message: 'Data warga berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error update warga:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui data warga'
    });
  }
};

// Get profile (untuk warga yang login)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user] = await db.query(`
      SELECT 
        id,
        nik,
        nama,
        email,
        alamat,
        rt,
        rw,
        dusun,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        agama,
        pekerjaan,
        pendidikan,
        status_perkawinan,
        golongan_darah,
        kewarganegaraan,
        no_kk,
        nama_kepala_keluarga,
        hubungan_keluarga,
        no_telepon,
        created_at
      FROM users
      WHERE id = ?
    `, [userId]);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profil tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: user[0]
    });
  } catch (error) {
    console.error('Error get profile:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil profil'
    });
  }
};

// Update profile (untuk warga yang login)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      nama,
      alamat,
      tempat_lahir,
      tanggal_lahir,
      jenis_kelamin,
      agama,
      pekerjaan,
      pendidikan,
      status_perkawinan,
      golongan_darah,
      no_telepon
    } = req.body;

    await db.query(`
      UPDATE users SET
        nama = ?,
        alamat = ?,
        tempat_lahir = ?,
        tanggal_lahir = ?,
        jenis_kelamin = ?,
        agama = ?,
        pekerjaan = ?,
        pendidikan = ?,
        status_perkawinan = ?,
        golongan_darah = ?,
        no_telepon = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      nama,
      alamat,
      tempat_lahir,
      tanggal_lahir,
      jenis_kelamin,
      agama,
      pekerjaan,
      pendidikan,
      status_perkawinan,
      golongan_darah,
      no_telepon,
      userId
    ]);

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error update profile:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui profil'
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  const bcrypt = require('bcryptjs');
  
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    // Validasi input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password lama dan password baru harus diisi'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter'
      });
    }

    // Get user
    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, users[0].password);
    
    if (!isValidPassword) {
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
    console.error('Error change password:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah password'
    });
  }
};

// Get statistik warga
exports.getStatistik = async (req, res) => {
  try {
    const { role, rt, rw } = req.user;

    let whereClause = 'WHERE role = "warga"';
    const params = [];

    if (role === 'admin') {
      whereClause += ' AND rt = ? AND rw = ?';
      params.push(rt, rw);
    }

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_warga,
        COUNT(CASE WHEN jenis_kelamin = 'Laki-laki' THEN 1 END) as total_laki,
        COUNT(CASE WHEN jenis_kelamin = 'Perempuan' THEN 1 END) as total_perempuan,
        COUNT(DISTINCT rt) as total_rt,
        COUNT(DISTINCT rw) as total_rw,
        COUNT(DISTINCT no_kk) as total_kk
      FROM users
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Error get statistik:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik'
    });
  }
};

// Create Warga - Super Admin Only
exports.createWarga = async (req, res) => {
  try {
    const {
      nik, nama, email, password, alamat, rt, rw, dusun,
      tempat_lahir, tanggal_lahir, jenis_kelamin, agama,
      pekerjaan, pendidikan, status_perkawinan, golongan_darah,
      no_kk, nama_kepala_keluarga, hubungan_keluarga, no_telepon
    } = req.body;

    console.log('Creating new warga:', { nik, nama, email, rt, rw });

    // Validasi required fields
    if (!nik || !nama) {
      return res.status(400).json({
        success: false,
        message: 'NIK dan nama wajib diisi'
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

    // Check if email already exists (only if email is provided)
    if (email) {
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
    }

    // Hash password if provided, otherwise use default
    const bcrypt = require('bcryptjs');
    const hashedPassword = password 
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash('password123', 10); // Default password

    // Convert empty strings to null for optional fields
    const cleanData = {
      email: email || null,
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
      no_telepon: no_telepon || null
    };

    // Insert new warga
    const [result] = await db.query(
      `INSERT INTO users (
        nik, nama, email, password, role, alamat, rt, rw, dusun,
        tempat_lahir, tanggal_lahir, jenis_kelamin, agama,
        pekerjaan, pendidikan, status_perkawinan, golongan_darah,
        no_kk, nama_kepala_keluarga, hubungan_keluarga, no_telepon,
        status, created_at
      ) VALUES (?, ?, ?, ?, 'warga', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', NOW())`,
      [
        nik, nama, cleanData.email, hashedPassword, 
        cleanData.alamat, cleanData.rt, cleanData.rw, cleanData.dusun,
        cleanData.tempat_lahir, cleanData.tanggal_lahir, cleanData.jenis_kelamin, cleanData.agama,
        cleanData.pekerjaan, cleanData.pendidikan, cleanData.status_perkawinan, cleanData.golongan_darah,
        cleanData.no_kk, cleanData.nama_kepala_keluarga, cleanData.hubungan_keluarga, cleanData.no_telepon
      ]
    );

    console.log('Warga created successfully, ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Data warga berhasil ditambahkan',
      data: {
        id: result.insertId,
        nik,
        nama,
        email
      }
    });
  } catch (error) {
    console.error('Error creating warga:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan data warga',
      error: error.message
    });
  }
};

// Delete Warga - Super Admin Only
exports.deleteWarga = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️  Deleting warga with ID:', id);

    // Check if warga exists
    const [warga] = await db.query(
      'SELECT id, nik, nama FROM users WHERE id = ? AND role = ?',
      [id, 'warga']
    );

    if (warga.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data warga tidak ditemukan'
      });
    }

    // Check if warga has any pengajuan surat
    const [pengajuan] = await db.query(
      'SELECT COUNT(*) as count FROM pengajuan_surat WHERE user_id = ?',
      [id]
    );

    if (pengajuan[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Tidak dapat menghapus data warga karena memiliki ${pengajuan[0].count} pengajuan surat. Nonaktifkan akun sebagai gantinya.`
      });
    }

    // Delete warga
    await db.query('DELETE FROM users WHERE id = ?', [id]);

    console.log('Warga deleted successfully:', warga[0].nama);

    res.json({
      success: true,
      message: 'Data warga berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting warga:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus data warga',
      error: error.message
    });
  }
};

// Get notifications for warga
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [notifications] = await db.query(
      `SELECT n.*, ps.jenis_surat_id, js.nama_surat 
       FROM notifications n
       LEFT JOIN pengajuan_surat ps ON n.pengajuan_id = ps.id
       LEFT JOIN jenis_surat js ON ps.jenis_surat_id = js.id
       WHERE n.user_id = ? AND n.is_read = 0
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil notifikasi',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify notification belongs to user
    const [notif] = await db.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (notif.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notifikasi tidak ditemukan'
      });
    }

    await db.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Notifikasi ditandai sebagai dibaca'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
};

// Get available RT/RW list from warga data
exports.getAvailableRtRw = async (req, res) => {
  try {
    // Get distinct RT and RW from warga table
    const [rtList] = await db.query(`
      SELECT DISTINCT rt 
      FROM warga 
      WHERE rt IS NOT NULL AND rt != ''
      ORDER BY CAST(rt AS UNSIGNED), rt
    `);
    
    const [rwList] = await db.query(`
      SELECT DISTINCT rw 
      FROM warga 
      WHERE rw IS NOT NULL AND rw != ''
      ORDER BY CAST(rw AS UNSIGNED), rw
    `);
    
    res.json({
      success: true,
      data: {
        rt: rtList.map(item => item.rt),
        rw: rwList.map(item => item.rw)
      }
    });
  } catch (error) {
    console.error('Error get available RT/RW:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data RT/RW'
    });
  }
};
