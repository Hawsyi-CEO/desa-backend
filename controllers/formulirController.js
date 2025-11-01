const db = require('../config/database');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

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
  },

  // Get PDF form fields
  getPDFFields: async (req, res) => {
    try {
      const { id } = req.params;

      // Get formulir data
      const [formulir] = await db.query(
        'SELECT * FROM formulir_cetak WHERE id = ?',
        [id]
      );

      if (formulir.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Formulir tidak ditemukan'
        });
      }

      // Check if file is PDF
      if (formulir[0].file_type !== 'pdf') {
        return res.status(400).json({
          success: false,
          message: 'Hanya file PDF yang mendukung fitur pengisian otomatis'
        });
      }

      const filePath = path.join(__dirname, '..', formulir[0].file_path);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File PDF tidak ditemukan'
        });
      }

      // Read PDF file
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      // Extract field information
      const fieldInfo = fields.map(field => {
        const fieldName = field.getName();
        let fieldType = 'unknown';

        try {
          if (field.constructor.name.includes('Text')) fieldType = 'text';
          else if (field.constructor.name.includes('CheckBox')) fieldType = 'checkbox';
          else if (field.constructor.name.includes('Radio')) fieldType = 'radio';
          else if (field.constructor.name.includes('Dropdown')) fieldType = 'dropdown';
        } catch (e) {
          fieldType = 'text'; // default
        }

        return {
          name: fieldName,
          type: fieldType
        };
      });

      res.json({
        success: true,
        data: {
          totalFields: fields.length,
          fields: fieldInfo,
          currentMapping: formulir[0].field_mapping || { autoFill: [], manualInput: [] }
        }
      });
    } catch (error) {
      console.error('Get PDF fields error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengekstrak fields dari PDF',
        error: error.message
      });
    }
  },

  // Fill PDF with data
  fillPDF: async (req, res) => {
    try {
      const { id } = req.params;
      const { formData } = req.body; // formData contains field values to fill
      const userId = req.user.id;

      // Get formulir data
      const [formulir] = await db.query(
        'SELECT * FROM formulir_cetak WHERE id = ?',
        [id]
      );

      if (formulir.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Formulir tidak ditemukan'
        });
      }

      if (!formulir[0].is_fillable) {
        return res.status(400).json({
          success: false,
          message: 'Formulir ini tidak mendukung pengisian otomatis'
        });
      }

      // Get user/warga data for auto-fill
      const [userData] = await db.query(
        `SELECT 
          u.*,
          w.nama_lengkap,
          w.nik,
          w.tempat_lahir,
          w.tanggal_lahir,
          w.jenis_kelamin,
          w.alamat,
          w.rt,
          w.rw,
          w.dusun,
          w.kelurahan_desa,
          w.kecamatan,
          w.agama,
          w.status_perkawinan,
          w.pekerjaan,
          w.kewarganegaraan,
          w.no_kk
        FROM users u
        LEFT JOIN warga w ON u.nik = w.nik
        WHERE u.id = ?`,
        [userId]
      );

      if (userData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data pengguna tidak ditemukan'
        });
      }

      const warga = userData[0];

      // Read PDF file
      const filePath = path.join(__dirname, '..', formulir[0].file_path);
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Get field mapping
      const fieldMapping = formulir[0].field_mapping || { autoFill: [], manualInput: [] };

      // Auto-fill fields from warga data
      const autoFillMapping = {
        'nama': warga.nama_lengkap || warga.nama || '',
        'nama_lengkap': warga.nama_lengkap || warga.nama || '',
        'nik': warga.nik || '',
        'tempat_lahir': warga.tempat_lahir || '',
        'tanggal_lahir': warga.tanggal_lahir || '',
        'jenis_kelamin': warga.jenis_kelamin || '',
        'alamat': warga.alamat || '',
        'rt': warga.rt || '',
        'rw': warga.rw || '',
        'dusun': warga.dusun || '',
        'kelurahan': warga.kelurahan_desa || '',
        'kelurahan_desa': warga.kelurahan_desa || '',
        'desa': warga.kelurahan_desa || '',
        'kecamatan': warga.kecamatan || '',
        'agama': warga.agama || '',
        'status_perkawinan': warga.status_perkawinan || '',
        'pekerjaan': warga.pekerjaan || '',
        'kewarganegaraan': warga.kewarganegaraan || '',
        'no_kk': warga.no_kk || '',
        'kk': warga.no_kk || ''
      };

      // Fill all fields
      const fields = form.getFields();
      
      for (const field of fields) {
        const fieldName = field.getName();
        const fieldNameLower = fieldName.toLowerCase().replace(/[_\s-]/g, '');
        
        try {
          let value = '';

          // Check if it's from formData (manual input)
          if (formData && formData[fieldName]) {
            value = String(formData[fieldName]);
          } else {
            // Try auto-fill
            // Check direct match
            if (autoFillMapping[fieldNameLower]) {
              value = String(autoFillMapping[fieldNameLower]);
            } else {
              // Check partial match
              for (const [key, val] of Object.entries(autoFillMapping)) {
                if (fieldNameLower.includes(key) || key.includes(fieldNameLower)) {
                  value = String(val);
                  break;
                }
              }
            }
          }

          // Fill the field if value exists
          if (value && field.constructor.name.includes('Text')) {
            field.setText(value);
          }
        } catch (error) {
          console.error(`Error filling field ${fieldName}:`, error.message);
        }
      }

      // Flatten the form (make it non-editable)
      // form.flatten(); // Uncomment if you want to make PDF non-editable

      // Save the filled PDF
      const filledPdfBytes = await pdfDoc.save();

      // Increment download counter
      await db.query(
        'UPDATE formulir_cetak SET jumlah_download = jumlah_download + 1 WHERE id = ?',
        [id]
      );

      // Send the filled PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="filled_${formulir[0].file_name}"`);
      res.send(Buffer.from(filledPdfBytes));

    } catch (error) {
      console.error('Fill PDF error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengisi PDF',
        error: error.message
      });
    }
  },

  // Update field mapping
  updateFieldMapping: async (req, res) => {
    try {
      const { id } = req.params;
      const { is_fillable, field_mapping } = req.body;

      const updates = [];
      const params = [];

      if (is_fillable !== undefined) {
        updates.push('is_fillable = ?');
        params.push(is_fillable);
      }

      if (field_mapping !== undefined) {
        updates.push('field_mapping = ?');
        params.push(JSON.stringify(field_mapping));
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada data yang diupdate'
        });
      }

      params.push(id);

      await db.query(
        `UPDATE formulir_cetak SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      res.json({
        success: true,
        message: 'Konfigurasi formulir berhasil diupdate'
      });
    } catch (error) {
      console.error('Update field mapping error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengupdate konfigurasi formulir',
        error: error.message
      });
    }
  }
};

module.exports = formulirController;
