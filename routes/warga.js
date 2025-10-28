const express = require('express');
const router = express.Router();
const wargaController = require('../controllers/wargaController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require warga role
router.use(authMiddleware);
router.use(roleMiddleware('warga'));

// Dashboard
router.get('/dashboard', wargaController.getDashboard);

// Jenis Surat (read only)
router.get('/jenis-surat', wargaController.getJenisSurat);

// Get Warga by NIK (untuk autofill form surat)
router.get('/data-by-nik/:nik', wargaController.getWargaByNik);

// Pengajuan Surat
router.post('/surat', upload.single('lampiran'), wargaController.createPengajuanSurat);
router.get('/surat', wargaController.getHistorySurat);
router.get('/surat/:id', wargaController.getSuratDetail);
router.delete('/surat/:id', wargaController.deleteDraftSurat);

// Profile
router.get('/profile', wargaController.getProfile);
router.put('/profile', wargaController.updateProfile);
router.post('/change-password', wargaController.changePassword);

module.exports = router;
