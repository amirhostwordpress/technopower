require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const pool = require('./config/db');
const { testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.use('/', express.static(path.join(__dirname, '..')));

app.use('/admin', express.static(path.join(__dirname, 'admin')));

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const enquiriesRoutes = require('./routes/enquiries');
const mediaRoutes = require('./routes/media');
const publicRoutes = require('./routes/public');
const settingsRoutes = require('./routes/settings');

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/enquiries', enquiriesRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/settings', settingsRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found', message: `Route ${req.method} ${req.originalUrl} does not exist.` });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

async function startServer() {
  const LINE = '═'.repeat(62);
  console.log('\n' + LINE);
  console.log('  🟦 Tech Power Group Server  v1.0.0');
  console.log(LINE);

  const jwtSecret = process.env.JWT_SECRET || '';
  const defaultSecrets = [
    '',
    'change-this-to-a-long-random-string',
    'CHANGE_ME_TO_A_LONG_RANDOM_STRING',
    'fallback_secret_change_in_env'
  ];
  if (defaultSecrets.includes(jwtSecret.trim())) {
    console.warn('\n  ⚠️  🔐 JWT_SECRET is using a default/empty value!');
    console.warn('  ⚠️     → Set a strong random string in your .env file.');
    console.warn('  ⚠️     → Example: JWT_SECRET=$(openssl rand -hex 32)\n');
  }

  const dbOk = await testConnection();

  app.listen(PORT, () => {
    const publicUrl = process.env.PUBLIC_SITE_URL || `http://localhost:${PORT}`;
    const adminUrl = `${publicUrl.replace(/\/$/, '')}/admin`;
    console.log('');
    console.log(`  🌐 Public site : ${publicUrl}`);
    console.log(`  🔧 Admin panel : ${adminUrl}`);
    console.log(`  📡 API base    : ${publicUrl.replace(/\/$/, '')}/api`);
    console.log('');
    if (dbOk) {
      console.log('  ✅ MySQL       : connected');
    } else {
      console.log('  ⚠️  MySQL       : NOT CONNECTED — check DB_* vars in .env');
      console.log('  ⚠️               (Content API will error until MySQL is available.)');
    }
    console.log('  ℹ️  FTP         : configure via Admin → Settings page, or FTP_* env vars');
    console.log('');
    console.log('  📋 Quick start:');
    console.log('     • Run migrations:  npm run migrate');
    console.log('     • Seed defaults:   npm run seed');
    console.log('     • Start server:    npm run dev    (nodemon)');
    console.log(LINE + '\n');
  });
}

startServer();
