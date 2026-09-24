require('dotenv').config();
const mysql = require('mysql2/promise');

const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = requiredVars.filter(v => !process.env[v] || String(process.env[v]).trim() === '');
if (missing.length > 0) {
  console.warn('[DB config] ⚠️  Missing environment variables: ' + missing.join(', ') + ' — check your .env file.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('[DB] ✅ MySQL database connection successful.');
    conn.release();
    return true;
  } catch (err) {
    console.error('[DB] ❌ MySQL database connection FAILED:', err.message);
    if (missing.length) {
      console.warn('[DB] → Missing env vars detected earlier. Did you copy .env.example to .env?');
    }
    return false;
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;
