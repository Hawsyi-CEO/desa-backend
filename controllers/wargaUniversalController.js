const db = require('../config/database');

// Get all warga data (untuk pilih NIK di mesin pelayanan)
exports.getAllWarga = async (req, res) => {
  try {
    const [warga] = await db.query(
      `SELECT 
        id, nik, nama, email, no_telepon, alamat,
        tempat_lahir, tanggal_lahir, jenis_kelamin,
        pekerjaan, agama, status_perkawinan, kewarganegaraan,
        pendidikan, golongan_darah, dusun, no_kk,
        nama_kepala_keluarga, hubungan_keluarga, rt, rw
      FROM users 
      WHERE role = 'warga' AND status = 'aktif'
      ORDER BY nama ASC`
    );

    res.json({
      success: true,
      data: warga
    });
  } catch (error) {
    console.error('Error getting all warga:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data warga'
    });
  }
};

// Get warga by NIK (untuk autofill form)
exports.getWargaByNik = async (req, res) => {
  try {
    const { nik } = req.params;

    const [warga] = await db.query(
      `SELECT 
        id, nik, nama, email, no_telepon, alamat,
        tempat_lahir, tanggal_lahir, jenis_kelamin,
        pekerjaan, agama, status_perkawinan, kewarganegaraan,
        pendidikan, golongan_darah, dusun, no_kk,
        nama_kepala_keluarga, hubungan_keluarga, rt, rw
      FROM users 
      WHERE nik = ? AND role = 'warga' AND status = 'aktif'`,
      [nik]
    );

    if (warga.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Warga tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: warga[0]
    });
  } catch (error) {
    console.error('Error getting warga by NIK:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data warga'
    });
  }
};

// Create surat langsung selesai (bypass verifikasi)
exports.createSurat = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { nik_pemohon, jenis_surat_id, data_surat, tanggal_surat } = req.body;

    // Validasi input
    if (!nik_pemohon || !jenis_surat_id || !data_surat) {
      return res.status(400).json({
        success: false,
        message: 'NIK pemohon, jenis surat, dan data surat harus diisi'
      });
    }

    // Get user_id from NIK
    const [warga] = await connection.query(
      'SELECT id FROM users WHERE nik = ? AND role = "warga"',
      [nik_pemohon]
    );

    if (warga.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Warga tidak ditemukan'
      });
    }

    const user_id = warga[0].id;

    // Get jenis surat info untuk generate nomor
    const [jenisSurat] = await connection.query(
      'SELECT kode_surat, nama_surat FROM jenis_surat WHERE id = ?',
      [jenis_surat_id]
    );

    if (jenisSurat.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Jenis surat tidak ditemukan'
      });
    }

    // Generate nomor surat otomatis
    const kodeSurat = jenisSurat[0].kode_surat;
    const tanggalSuratFinal = tanggal_surat || new Date().toISOString().split('T')[0];
    const tahun = new Date(tanggalSuratFinal).getFullYear();
    const bulan = String(new Date(tanggalSuratFinal).getMonth() + 1).padStart(2, '0');

    // Cari nomor urut terakhir untuk bulan ini
    const [lastSurat] = await connection.query(
      `SELECT no_surat FROM pengajuan_surat 
       WHERE jenis_surat_id = ? 
       AND YEAR(tanggal_surat) = ? 
       AND MONTH(tanggal_surat) = ?
       AND no_surat IS NOT NULL
       ORDER BY id DESC LIMIT 1`,
      [jenis_surat_id, tahun, bulan]
    );

    let nomorUrut = 1;
    if (lastSurat.length > 0 && lastSurat[0].no_surat) {
      // Extract nomor urut dari format: 001/SKTM/X/2024
      const parts = lastSurat[0].no_surat.split('/');
      if (parts.length > 0) {
        const currentUrut = parseInt(parts[0]);
        if (!isNaN(currentUrut)) {
          nomorUrut = currentUrut + 1;
        }
      }
    }

    // Format nomor surat: 001/KODE/BULAN_ROMAWI/TAHUN
    const bulanRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const nomorSurat = `${String(nomorUrut).padStart(3, '0')}/${kodeSurat}/${bulanRomawi[parseInt(bulan) - 1]}/${tahun}`;

    // Insert pengajuan surat dengan status langsung 'disetujui' (approved)
    const [result] = await connection.query(
      `INSERT INTO pengajuan_surat 
       (user_id, jenis_surat_id, data_surat, status_surat, no_surat, tanggal_surat, created_at, approved_by, approved_at) 
       VALUES (?, ?, ?, 'disetujui', ?, ?, NOW(), ?, NOW())`,
      [user_id, jenis_surat_id, JSON.stringify(data_surat), nomorSurat, tanggalSuratFinal, req.user.id]
    );

    const pengajuanId = result.insertId;

    // Skip verification_flow karena langsung approved
    // Untuk warga_universal, surat langsung disetujui tanpa proses verifikasi

    await connection.commit();

    // Get complete surat data untuk response
    const [suratData] = await connection.query(
      `SELECT 
        ps.*,
        js.nama_surat,
        js.kode_surat,
        js.template_konten,
        js.kalimat_pembuka,
        js.fields,
        u.nik,
        u.nama as nama_pemohon,
        u.alamat as alamat_pemohon,
        u.tempat_lahir,
        u.tanggal_lahir,
        u.jenis_kelamin,
        u.pekerjaan,
        u.agama,
        u.status_perkawinan,
        u.kewarganegaraan
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      WHERE ps.id = ?`,
      [pengajuanId]
    );

    res.json({
      success: true,
      message: 'Surat berhasil dibuat',
      data: suratData[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating surat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat surat'
    });
  } finally {
    connection.release();
  }
};

// Get surat history (hari ini atau dengan filter tanggal)
exports.getSuratHistory = async (req, res) => {
  try {
    const { tanggal_mulai, tanggal_akhir } = req.query;

    let query = `
      SELECT 
        ps.id,
        ps.nomor_surat,
        ps.tanggal_surat,
        ps.tanggal_pengajuan,
        ps.status_surat,
        js.nama_surat,
        js.kode_surat,
        u.nik,
        u.nama as nama_pemohon
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      WHERE ps.status_surat = 'selesai'
    `;

    const params = [];

    if (tanggal_mulai && tanggal_akhir) {
      query += ' AND DATE(ps.tanggal_surat) BETWEEN ? AND ?';
      params.push(tanggal_mulai, tanggal_akhir);
    } else {
      // Default: hari ini
      query += ' AND DATE(ps.tanggal_surat) = CURDATE()';
    }

    query += ' ORDER BY ps.id DESC';

    const [surat] = await db.query(query, params);

    res.json({
      success: true,
      data: surat
    });
  } catch (error) {
    console.error('Error getting surat history:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat surat'
    });
  }
};

// Get surat detail untuk print/reprint
exports.getSuratDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [surat] = await db.query(
      `SELECT 
        ps.*,
        js.nama_surat,
        js.kode_surat,
        js.template_konten,
        js.kalimat_pembuka,
        js.fields,
        u.nik,
        u.nama as nama_pemohon,
        u.alamat as alamat_pemohon,
        u.tempat_lahir,
        u.tanggal_lahir,
        u.jenis_kelamin,
        u.pekerjaan,
        u.agama,
        u.status_perkawinan,
        u.kewarganegaraan,
        u.no_telepon,
        u.pendidikan,
        u.golongan_darah,
        u.dusun,
        u.rt,
        u.rw
      FROM pengajuan_surat ps
      JOIN jenis_surat js ON ps.jenis_surat_id = js.id
      JOIN users u ON ps.user_id = u.id
      WHERE ps.id = ?`,
      [id]
    );

    if (surat.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Surat tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: surat[0]
    });
  } catch (error) {
    console.error('Error getting surat detail:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail surat'
    });
  }
};

// Get jenis surat list
exports.getJenisSurat = async (req, res) => {
  try {
    const [jenisSurat] = await db.query(
      `SELECT 
        id, 
        nama_surat, 
        kode_surat, 
        deskripsi, 
        fields, 
        template_konten, 
        kalimat_pembuka,
        format_nomor,
        require_verification
       FROM jenis_surat 
       WHERE status = 'aktif'
       ORDER BY nama_surat ASC`
    );

    // Convert require_verification to boolean (MySQL returns 1/0)
    const formattedData = jenisSurat.map(jenis => ({
      ...jenis,
      require_verification: Boolean(jenis.require_verification)
    }));

    console.log('📋 Jenis surat for warga universal:', formattedData.map(j => ({
      nama: j.nama_surat,
      require_verification: j.require_verification
    })));

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error getting jenis surat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jenis surat'
    });
  }
};
