#!/usr/bin/env node
/**
 * run-performance-indexes.js
 * Runs the migration_performance_indexes.sql migration against the MySQL database.
 */

const fs   = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SQL_FILE = path.resolve(
  __dirname,
  '../../database/migration_performance_indexes.sql'
);

(async () => {
  const conn = await mysql.createConnection({
    host     : process.env.DB_HOST     || 'localhost',
    port     : process.env.DB_PORT     || 3306,
    user     : process.env.DB_USER     || 'root',
    password : process.env.DB_PASSWORD || 'root',
    database : process.env.DB_NAME     || 'satral_dairy_test',
    multipleStatements: true,
  });

  try {
    console.log('Running performance indexes migration...');
    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    const [results] = await conn.query(sql);

    // Last result is the SELECT result message
    const msgs = Array.isArray(results) ? results : [results];
    msgs.forEach(r => {
      if (r && r[0] && r[0].result) console.log('DB says:', r[0].result);
    });

    console.log('✅  Performance indexes migration completed successfully!');
  } catch (err) {
    console.error('❌  Migration failed:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();
