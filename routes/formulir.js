const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const formulirController = require('../controllers/formulirController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/formulir';
    
    // Buat folder jika belum ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, basename + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept pdf, doc, docx only
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || 
                   file.mimetype === 'application/msword' ||
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file PDF, DOC, dan DOCX yang diperbolehkan'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: fileFilter
});

// All routes require authentication
router.use(authMiddleware);

// Public routes (authenticated users)
router.get('/', formulirController.getAllFormulir);
router.get('/:id', formulirController.getFormulirById);
router.get('/:id/download', formulirController.downloadFormulir);

// Super Admin only routes
router.post('/', roleMiddleware('super_admin'), upload.single('file'), formulirController.uploadFormulir);
router.put('/:id', roleMiddleware('super_admin'), formulirController.updateFormulir);
router.delete('/:id', roleMiddleware('super_admin'), formulirController.deleteFormulir);

module.exports = router;
