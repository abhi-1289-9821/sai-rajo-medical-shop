const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Support CA certificate verification for managed databases (e.g. Aiven)
let caCert = process.env.DB_CA_CERT;
if (!caCert) {
  const caPath = path.join(__dirname, '../../ca.pem');
  if (fs.existsSync(caPath)) {
    caCert = fs.readFileSync(caPath, 'utf8');
  }
}

const sslOption = process.env.DB_SSL === 'false'
  ? false
  : (caCert ? { rejectUnauthorized: true, ca: caCert } : { rejectUnauthorized: false });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medistore_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl: sslOption
});

// Verify database connection on startup
pool.getConnection()
  .then(conn => {
    console.log('[Database] Connected successfully to MySQL.');
    conn.release();
  })
  .catch(err => {
    console.error('[Database] Failed to connect:', err.message);
  });

// Helper for running queries with parameterized arguments (prevents SQL injection)
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  }
}

module.exports = {
  pool,
  query
};
