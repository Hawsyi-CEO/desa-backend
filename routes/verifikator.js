const express = require('express');
const router = express.Router();
const verifikatorController = require('../controllers/verifikatorController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { uploadSuratPengantar } = require('../middleware/upload');

// All routes require verifikator role (RT/RW)
router.use(authMiddleware);
router.use(roleMiddleware('verifikator'));

// Dashboard
router.get('/dashboard', verifikatorController.getDashboard);

// Surat Verification (Multi-level: RT/RW)
router.get('/surat-masuk', verifikatorController.getSuratMasuk);
router.put('/surat/:id/approve', uploadSuratPengantar.single('surat_pengantar'), verifikatorController.approveSurat);
router.put('/surat/:id/reject', verifikatorController.rejectSurat);

// Riwayat
router.get('/riwayat', verifikatorController.getRiwayatVerifikasi);

// Change Password
router.put('/change-password', verifikatorController.changePassword);

// Notifications
router.get('/notifications', verifikatorController.getNotifications);

module.exports = router;
