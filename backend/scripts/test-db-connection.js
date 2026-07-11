const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

async function testConnection() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0
  });

  try {
    const conn = await pool.getConnection();
    console.log('DB connection successful as', process.env.DB_USER);
    conn.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('DB connection failed:');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
}

testConnection();
