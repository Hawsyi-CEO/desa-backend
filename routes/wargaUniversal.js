const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole, roleMiddleware } = require('../middleware/auth');
const wargaUniversalController = require('../controllers/wargaUniversalController');

// Semua route butuh auth dan role warga_universal
router.use(authenticateToken);
router.use(roleMiddleware('warga_universal'));

// Get all warga (untuk pilih NIK)
router.get('/all-warga', wargaUniversalController.getAllWarga);

// Get warga by NIK (untuk autofill)
router.get('/warga/:nik', wargaUniversalController.getWargaByNik);

// Get jenis surat list
router.get('/jenis-surat', wargaUniversalController.getJenisSurat);

// Create surat (langsung selesai)
router.post('/surat', wargaUniversalController.createSurat);

// Get surat history
router.get('/surat', wargaUniversalController.getSuratHistory);

// Get surat detail (untuk print/reprint)
router.get('/surat/:id', wargaUniversalController.getSuratDetail);

module.exports = router;
