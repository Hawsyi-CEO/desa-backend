const express = require('express');
const router = express.Router();
const verifikatorController = require('../controllers/verifikatorController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// All routes require verifikator role (RT/RW)
router.use(authMiddleware);
router.use(roleMiddleware('verifikator'));

// Dashboard
router.get('/dashboard', verifikatorController.getDashboard);

// Surat Verification (Multi-level: RT/RW)
router.get('/surat-masuk', verifikatorController.getSuratMasuk);
router.put('/surat/:id/approve', verifikatorController.approveSurat);
router.put('/surat/:id/reject', verifikatorController.rejectSurat);

// Riwayat
router.get('/riwayat', verifikatorController.getRiwayatVerifikasi);

module.exports = router;
