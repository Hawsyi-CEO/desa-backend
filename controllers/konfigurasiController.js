const db = require('../config/database');

// Get konfigurasi surat
exports.getKonfigurasi = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM konfigurasi_surat ORDER BY id DESC LIMIT 1');
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Konfigurasi belum diatur'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error getting konfigurasi:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update konfigurasi surat
exports.updateKonfigurasi = async (req, res) => {
  try {
    console.log('📥 Received konfigurasi update:', req.body); // Debug
    
    const {
      nama_kabupaten,
      nama_kecamatan,
      nama_desa,
      nama_desa_penandatangan,
      alamat_kantor,
      kota,
      kode_pos,
      telepon,
      email,
      jabatan_ttd,
      nama_ttd,
      nip_ttd,
      nama_sekretaris,
      nip_sekretaris,
      nama_camat,
      nip_camat,
      nama_kapolsek,
      nip_kapolsek,
      nama_danramil,
      nip_danramil
    } = req.body;
    
    console.log('✅ Extracted values:', {
      nama_sekretaris,
      nip_sekretaris,
      nama_camat,
      nip_camat,
      nama_kapolsek,
      nip_kapolsek,
      nama_danramil,
      nip_danramil
    }); // Debug

    // Check if config exists
    const [existing] = await db.query('SELECT id FROM konfigurasi_surat LIMIT 1');
    
    if (existing.length === 0) {
      // Insert new config
      await db.query(
        `INSERT INTO konfigurasi_surat SET ?`,
        {
          nama_kabupaten,
          nama_kecamatan,
          nama_desa,
          nama_desa_penandatangan,
          alamat_kantor,
          kota,
          kode_pos,
          telepon,
          email,
          jabatan_ttd,
          nama_ttd,
          nip_ttd,
          nama_sekretaris,
          nip_sekretaris,
          nama_camat,
          nip_camat,
          nama_kapolsek,
          nip_kapolsek,
          nama_danramil,
          nip_danramil
        }
      );
    } else {
      // Update existing config
      const params = [
        nama_kabupaten,
        nama_kecamatan,
        nama_desa,
        nama_desa_penandatangan,
        alamat_kantor,
        kota,
        kode_pos,
        telepon,
        email,
        jabatan_ttd,
        nama_ttd,
        nip_ttd,
        nama_sekretaris,
        nip_sekretaris,
        nama_camat,
        nip_camat,
        nama_kapolsek,
        nip_kapolsek,
        nama_danramil,
        nip_danramil,
        existing[0].id
      ];
      
      console.log('🔍 UPDATE parameters:', params); // Debug
      
      const [result] = await db.query(
        `UPDATE konfigurasi_surat SET 
          nama_kabupaten = ?,
          nama_kecamatan = ?,
          nama_desa = ?,
          nama_desa_penandatangan = ?,
          alamat_kantor = ?,
          kota = ?,
          kode_pos = ?,
          telepon = ?,
          email = ?,
          jabatan_ttd = ?,
          nama_ttd = ?,
          nip_ttd = ?,
          nama_sekretaris = ?,
          nip_sekretaris = ?,
          nama_camat = ?,
          nip_camat = ?,
          nama_kapolsek = ?,
          nip_kapolsek = ?,
          nama_danramil = ?,
          nip_danramil = ?
        WHERE id = ?`,
        params
      );
      
      console.log('✅ UPDATE result:', result); // Debug
    }

    const [updated] = await db.query('SELECT * FROM konfigurasi_surat ORDER BY id DESC LIMIT 1');
    
    res.json({
      success: true,
      message: 'Konfigurasi berhasil disimpan',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating konfigurasi:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Upload logo
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File logo harus diupload'
      });
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Logo berhasil diupload',
      data: {
        url: logoUrl
      }
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal upload logo'
    });
  }
};

// Get RT/RW options from users table
exports.getRTRWOptions = async (req, res) => {
  try {
    // Get unique RT numbers
    const [rtRows] = await db.query(`
      SELECT DISTINCT rt 
      FROM users 
      WHERE rt IS NOT NULL 
        AND rt != '' 
        AND role = 'verifikator'
        AND verifikator_level = 'rt'
      ORDER BY rt ASC
    `);
    
    // Get unique RW numbers
    const [rwRows] = await db.query(`
      SELECT DISTINCT rw 
      FROM users 
      WHERE rw IS NOT NULL 
        AND rw != '' 
        AND role = 'verifikator'
        AND verifikator_level = 'rw'
      ORDER BY rw ASC
    `);

    res.json({
      success: true,
      rt: rtRows.map(row => row.rt),
      rw: rwRows.map(row => row.rw)
    });
  } catch (error) {
    console.error('Error getting RT/RW options:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get RT name by RT number
exports.getRTName = async (req, res) => {
  try {
    const { rtNumber } = req.params;
    
    const [rows] = await db.query(`
      SELECT nama 
      FROM users 
      WHERE rt = ? 
        AND role = 'verifikator'
        AND verifikator_level = 'rt'
      LIMIT 1
    `, [rtNumber]);

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: 'RT tidak ditemukan'
      });
    }

    res.json({
      success: true,
      nama: rows[0].nama
    });
  } catch (error) {
    console.error('Error getting RT name:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get RW name by RW number
exports.getRWName = async (req, res) => {
  try {
    const { rwNumber } = req.params;
    
    const [rows] = await db.query(`
      SELECT nama 
      FROM users 
      WHERE rw = ? 
        AND role = 'verifikator'
        AND verifikator_level = 'rw'
      LIMIT 1
    `, [rwNumber]);

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: 'RW tidak ditemukan'
      });
    }

    res.json({
      success: true,
      nama: rows[0].nama
    });
  } catch (error) {
    console.error('Error getting RW name:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};
