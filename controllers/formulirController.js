const db = require('../config/database');
const path = require('path');
const fs = require('fs');

const formulirController = {
  // Get all formulir (with filter)
  getAllFormulir: async (req, res) => {
    try {
      const { kategori, is_active } = req.query;
      
      let query = `
        SELECT 
          f.*,
          u.nama as uploaded_by_name
        FROM formulir_cetak f
        LEFT JOIN users u ON f.created_by = u.id
        WHERE 1=1
      `;
      const params = [];

      if (kategori) {
        query += ` AND f.kategori = ?`;
        params.push(kategori);
      }

      if (is_active !== undefined) {
        query += ` AND f.is_active = ?`;
        params.push(is_active);
      }

      query += ` ORDER BY f.urutan ASC, f.created_at DESC`;

      const [formulir] = await db.query(query, params);

      res.json({
        success: true,
        data: formulir
      });
    } catch (error) {
      console.error('Get formulir error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data formulir',
        error: error.message
      });
    }
  },

  // Get formulir by ID
  getFormulirById: async (req, res) => {
    try {
      const { id } = req.params;

      const [formulir] = await db.query(
        `SELECT 
          f.*,
          u.nama as uploaded_by_name
        FROM formulir_cetak f
        LEFT JOIN users u ON f.created_by = u.id
        WHERE f.id = ?`,
        [id]
      );

      if (formulir.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Formulir tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: formulir[0]
      });
    } catch (error) {
      console.error('Get formulir by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data formulir',
        error: error.message
      });
    }
  },

  // Upload formulir (Super Admin only)
  uploadFormulir: async (req, res) => {
    try {
      const { nama_formulir, kategori, deskripsi, urutan } = req.body;
      const userId = req.user.id;

      // Validasi file
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File formulir harus diupload'
        });
      }

      // Validasi required fields
      if (!nama_formulir || !kategori) {
        // Hapus file yang sudah diupload jika validasi gagal
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Nama formulir dan kategori harus diisi'
        });
      }

      // Validasi tipe file
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Tipe file tidak didukung. Gunakan PDF, DOC, atau DOCX'
        });
      }

      // Insert ke database
      const [result] = await db.query(
        `INSERT INTO formulir_cetak 
        (nama_formulir, kategori, deskripsi, file_path, file_name, file_type, file_size, urutan, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nama_formulir,
          kategori,
          deskripsi || null,
          req.file.path,
          req.file.originalname,
          fileExt.replace('.', ''),
          req.file.size,
          urutan || 0,
          userId
        ]
      );

      res.json({
        success: true,
        message: 'Formulir berhasil diupload',
        data: {
          id: result.insertId,
          nama_formulir,
          file_name: req.file.originalname
        }
      });
    } catch (error) {
      console.error('Upload formulir error:', error);
      
      // Hapus file jika ada error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Gagal mengupload formulir',
        error: error.message
      });
    }
  },

  // Update formulir info (tanpa file)
  updateFormulir: async (req, res) => {
    try {
      const { id } = req.params;
      const { nama_formulir, kategori, deskripsi, urutan, is_active } = req.body;

      // Cek formulir exists
      const [existing] = await db.query(
        'SELECT * FROM formulir_cetak WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Formulir tidak ditemukan'
        });
      }

      // Update
      await db.query(
        `UPDATE formulir_cetak 
        SET nama_formulir = ?, kategori = ?, deskripsi = ?, urutan = ?, is_active = ?
        WHERE id = ?`,
        [nama_formulir, kategori, deskripsi, urutan || 0, is_active !== undefined ? is_active : 1, id]
      );

      res.json({
        success: true,
        message: 'Formulir berhasil diupdate'
      });
    } catch (error) {
      console.error('Update formulir error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengupdate formulir',
        error: error.message
      });
    }
  },

  // Delete formulir
  deleteFormulir: async (req, res) => {
    try {
      const { id } = req.params;

      // Get file path
      const [formulir] = await db.query(
        'SELECT file_path FROM formulir_cetak WHERE id = ?',
        [id]
      );

      if (formulir.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Formulir tidak ditemukan'
        });
      }

      // Delete file
      if (fs.existsSync(formulir[0].file_path)) {
        fs.unlinkSync(formulir[0].file_path);
      }

      // Delete dari database
      await db.query('DELETE FROM formulir_cetak WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Formulir berhasil dihapus'
      });
    } catch (error) {
      console.error('Delete formulir error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus formulir',
        error: error.message
      });
    }
  },

  // Download formulir (increment counter)
  downloadFormulir: async (req, res) => {
    try {
      const { id } = req.params;

      const [formulir] = await db.query(
        'SELECT * FROM formulir_cetak WHERE id = ? AND is_active = 1',
        [id]
      );

      if (formulir.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Formulir tidak ditemukan'
        });
      }

      const filePath = formulir[0].file_path;

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File tidak ditemukan di server'
        });
      }

      // Increment download counter
      await db.query(
        'UPDATE formulir_cetak SET jumlah_download = jumlah_download + 1 WHERE id = ?',
        [id]
      );

      // Send file
      res.download(filePath, formulir[0].file_name);
    } catch (error) {
      console.error('Download formulir error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mendownload formulir',
        error: error.message
      });
    }
  }
};

module.exports = formulirController;
