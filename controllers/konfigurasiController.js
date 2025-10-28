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
    const {
      nama_kabupaten,
      nama_kecamatan,
      nama_desa,
      alamat_kantor,
      kota,
      kode_pos,
      telepon,
      email,
      jabatan_ttd,
      nama_ttd,
      nip_ttd,
      nama_sekretaris,
      nip_sekretaris
    } = req.body;

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
          alamat_kantor,
          kota,
          kode_pos,
          telepon,
          email,
          jabatan_ttd,
          nama_ttd,
          nip_ttd,
          nama_sekretaris,
          nip_sekretaris
        }
      );
    } else {
      // Update existing config
      await db.query(
        `UPDATE konfigurasi_surat SET 
          nama_kabupaten = ?,
          nama_kecamatan = ?,
          nama_desa = ?,
          alamat_kantor = ?,
          kota = ?,
          kode_pos = ?,
          telepon = ?,
          email = ?,
          jabatan_ttd = ?,
          nama_ttd = ?,
          nip_ttd = ?,
          nama_sekretaris = ?,
          nip_sekretaris = ?
        WHERE id = ?`,
        [
          nama_kabupaten,
          nama_kecamatan,
          nama_desa,
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
          existing[0].id
        ]
      );
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
