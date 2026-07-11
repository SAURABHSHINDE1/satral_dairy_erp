const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const rootPw = process.argv[2];
  if (!rootPw) {
    console.error('Usage: node run-sql-as-root.js <root_password>');
    process.exit(2);
  }

  const sqlPath = path.resolve(__dirname, '..', 'database', 'create_dev_user.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: rootPw,
      multipleStatements: true
    });
    await conn.query(sql);
    console.log('SQL executed successfully.');
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to execute SQL:');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();
