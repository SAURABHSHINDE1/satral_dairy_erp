const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'satral_dairy_test',
  waitForConnections: true,
  // Tune DB_CONNECTION_LIMIT in .env to match available VPS resources (recommended: 10-15)
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
pool.getConnection()
  .then(connection => {
    logger.info('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    logger.error('Database connection failed:', err);
  });

module.exports = pool;
