const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = './uploads';
const suratPengantarDir = './uploads/surat-pengantar';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(suratPengantarDir)) {
  fs.mkdirSync(suratPengantarDir, { recursive: true });
}

// Configure storage for general uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'file-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for surat pengantar
const storageSuratPengantar = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, suratPengantarDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'surat-pengantar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type tidak diizinkan. Hanya jpeg, jpg, png, pdf, doc, docx yang diperbolehkan.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default (increased from 5MB)
  },
  fileFilter: fileFilter
});

// Upload khusus untuk surat pengantar
const uploadSuratPengantar = multer({
  storage: storageSuratPengantar,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default (increased from 5MB)
  },
  fileFilter: fileFilter
});

module.exports = upload;
module.exports.uploadSuratPengantar = uploadSuratPengantar;
