const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const konfigurasiController = require('../controllers/konfigurasiController');
const wargaController = require('../controllers/wargaController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authMiddleware);

// Data Warga - accessible by both super_admin and admin
// (filtering by RT/RW is handled in controller based on user role)
router.get('/warga', roleMiddleware('super_admin', 'admin'), wargaController.getAllWarga);
router.get('/warga/statistik', roleMiddleware('super_admin', 'admin'), wargaController.getStatistik);
router.get('/warga/:id', roleMiddleware('super_admin', 'admin'), wargaController.getWargaById);
router.put('/warga/:id', roleMiddleware('super_admin', 'admin'), wargaController.updateWarga);

// Warga Management - Super Admin only
router.post('/warga', roleMiddleware('super_admin'), wargaController.createWarga);
router.delete('/warga/:id', roleMiddleware('super_admin'), wargaController.deleteWarga);

// Surat Management - accessible by both super_admin and admin
router.get('/surat', roleMiddleware('super_admin', 'admin'), adminController.getAllSurat);
router.get('/surat/menunggu-approval', roleMiddleware('super_admin', 'admin'), adminController.getSuratMenungguApproval);
router.get('/surat/:id', roleMiddleware('super_admin', 'admin'), adminController.getSuratDetail);
router.put('/surat/:id/approve', roleMiddleware('super_admin', 'admin'), adminController.approveSurat);
router.put('/surat/:id/reject', roleMiddleware('super_admin', 'admin'), adminController.rejectSurat);

// Super Admin only routes
// Dashboard
router.get('/dashboard', roleMiddleware('super_admin'), adminController.getDashboard);

// Konfigurasi Surat
router.get('/konfigurasi', roleMiddleware('super_admin'), konfigurasiController.getKonfigurasi);
router.put('/konfigurasi', roleMiddleware('super_admin'), konfigurasiController.updateKonfigurasi);
router.post('/konfigurasi/upload-logo', roleMiddleware('super_admin'), upload.single('logo'), konfigurasiController.uploadLogo);

// Jenis Surat Management
router.get('/jenis-surat', roleMiddleware('super_admin'), adminController.getJenisSurat);
router.get('/jenis-surat/:id', roleMiddleware('super_admin'), adminController.getJenisSuratById);
router.post('/jenis-surat', roleMiddleware('super_admin'), adminController.createJenisSurat);
router.put('/jenis-surat/:id', roleMiddleware('super_admin'), adminController.updateJenisSurat);
router.delete('/jenis-surat/:id', roleMiddleware('super_admin'), adminController.deleteJenisSurat);

// User Management
router.get('/users', roleMiddleware('super_admin'), adminController.getAllUsers);
router.get('/users/stats', roleMiddleware('super_admin'), adminController.getUserStats);
router.post('/users', roleMiddleware('super_admin'), adminController.createUser);
router.put('/users/:id/status', roleMiddleware('super_admin'), adminController.updateUserStatus);

module.exports = router;
