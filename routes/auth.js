const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const konfigurasiController = require('../controllers/konfigurasiController');
const { authMiddleware } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/konfigurasi', konfigurasiController.getKonfigurasi);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/password', authMiddleware, authController.changePassword);

module.exports = router;
