const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const verifikatorRoutes = require('./routes/verifikator');
const wargaRoutes = require('./routes/warga');
const wargaUniversalRoutes = require('./routes/wargaUniversal');

// Initialize app
const app = express();

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://suratmuliya.id', 'https://www.suratmuliya.id', 'https://api.suratmuliya.id', 'http://suratmuliya.id', 'http://www.suratmuliya.id']
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000'];

console.log('🌐 CORS - Environment:', process.env.NODE_ENV || 'development');
console.log('🌐 CORS - Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    console.log('🔍 CORS - Request from origin:', origin);
    
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      console.log('✅ CORS - Allowing request with no origin');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS - Origin allowed:', origin);
      return callback(null, true);
    }
    
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ CORS - Origin blocked:', origin);
      const msg = `CORS policy blocked access from: ${origin}. Allowed: ${allowedOrigins.join(', ')}`;
      return callback(new Error(msg), false);
    }
    
    // Development mode: allow all
    console.log('⚠️ CORS - Development mode, allowing all origins');
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Increase payload limit for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verifikator', verifikatorRoutes);
app.use('/api/warga', wargaRoutes);
app.use('/api/warga-universal', wargaUniversalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});

module.exports = app;
