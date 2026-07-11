const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function inspect() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'satral_dairy_test',
  });

  try {
    const [tables] = await conn.query('SHOW TABLES');
    console.log('Tables in Database:', tables.map(t => Object.values(t)[0]));

    const targetTables = [
      'tank_records',
      'final_product_storage_records',
      'bi_product_reports',
      'raw_bulk_milk_testing_records',
      'packing_milk_reports',
      'milk_taken_reports_bi_product',
      'buttermilk_analysis_records'
    ];

    for (const table of targetTables) {
      console.log(`\n=== Table: ${table} ===`);
      
      // Show columns
      const [columns] = await conn.query(`DESCRIBE ${table}`);
      console.log('Columns:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });

      // Show indexes
      const [indexes] = await conn.query(`SHOW INDEX FROM ${table}`);
      console.log('Indexes:');
      const indexMap = {};
      indexes.forEach(idx => {
        if (!indexMap[idx.Key_name]) indexMap[idx.Key_name] = [];
        indexMap[idx.Key_name].push(idx.Column_name);
      });
      Object.entries(indexMap).forEach(([name, cols]) => {
        console.log(`  - ${name}: (${cols.join(', ')})`);
      });
    }
  } catch (err) {
    console.error('Inspection failed:', err);
  } finally {
    await conn.end();
  }
}

inspect();
