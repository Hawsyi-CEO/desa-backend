const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
exports.register = async (req, res) => {
  try {
    const { nik, nama, email, password, no_telepon, alamat, rt, rw } = req.body;

    // Validasi
    if (!nik || !nama || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'NIK, nama, email, dan password harus diisi'
      });
    }

    // Check if user exists
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE nik = ? OR email = ?',
      [nik, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'NIK atau email sudah terdaftar'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      `INSERT INTO users (nik, nama, email, password, role, no_telepon, alamat, rt, rw) 
       VALUES (?, ?, ?, ?, 'warga', ?, ?, ?, ?)`,
      [nik, nama, email, hashedPassword, no_telepon, alamat, rt, rw]
    );

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        id: result.insertId,
        nik,
        nama,
        email,
        role: 'warga'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // Validasi
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/NIK dan password harus diisi'
      });
    }

    // Find user by email or NIK
    const [users] = await db.query(
      'SELECT * FROM users WHERE (email = ? OR nik = ?) AND status = "aktif"',
      [email, email]
    );

    if (users.length === 0) {
      console.log('User not found or inactive');
      return res.status(401).json({
        success: false,
        message: 'Email/NIK atau password salah'
      });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Email/NIK atau password salah'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        nik: user.nik,
        nama: user.nama,
        rt: user.rt,
        rw: user.rw
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Remove password from response
    delete user.password;

    console.log('Login successful for:', user.email || user.nik, 'Role:', user.role);

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, nik, nama, email, role, no_telepon, alamat, rt, rw, foto_profile, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { nama, no_telepon, alamat, rt, rw } = req.body;
    const userId = req.user.id;

    await db.query(
      'UPDATE users SET nama = ?, no_telepon = ?, alamat = ?, rt = ?, rw = ? WHERE id = ?',
      [nama, no_telepon, alamat, rt, rw, userId]
    );

    res.json({
      success: true,
      message: 'Profile berhasil diupdate'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password lama dan password baru harus diisi'
      });
    }

    // Get current password
    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, users[0].password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password lama salah'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};
