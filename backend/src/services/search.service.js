const pool = require('../config/database.config');

class SearchService {
  async globalSearch(query) {
    const q = `%${query}%`;
    const conn = await pool.getConnection();

    try {
      const results = {};

      // 1. Tank Records
      const [tankRows] = await conn.query(
        `SELECT id, date, tank_number, batch_number, milk_quantity, fat_percentage, snf_percentage, status 
         FROM tank_records 
         WHERE tank_number LIKE ? OR batch_number LIKE ? OR status LIKE ? OR milk_type LIKE ?
         ORDER BY date DESC LIMIT 10`,
        [q, q, q, q]
      );
      if (tankRows.length > 0) results.tank_records = tankRows;

      // 2. Final Product Storage
      const [finalProductRows] = await conn.query(
        `SELECT id, date, tank_no, type_of_milk, milk_quantity_l, fat_percent, snf_percent, status 
         FROM final_product_storage_records 
         WHERE tank_no LIKE ? OR flavour_taste LIKE ? OR status LIKE ? OR type_of_milk LIKE ?
         ORDER BY date DESC LIMIT 10`,
        [q, q, q, q]
      );
      if (finalProductRows.length > 0) results.final_product_storage_records = finalProductRows;

      // 3. Final Bi-Product
      const [biProductRows] = await conn.query(
        `SELECT id, date, batch_no, product_name, fat_percent, snf_percent, status 
         FROM bi_product_reports 
         WHERE batch_no LIKE ? OR product_name LIKE ? OR status LIKE ?
         ORDER BY date DESC LIMIT 10`,
        [q, q, q]
      );
      if (biProductRows.length > 0) results.bi_product_reports = biProductRows;

      // 4. Raw Bulk Milk Testing
      const [rawBulkRows] = await conn.query(
        `SELECT id, date, sample_name, type_of_milk, milk_quantity_lit, fat_percent, status 
         FROM raw_bulk_milk_testing_records 
         WHERE sample_name LIKE ? OR type_of_milk LIKE ? OR status LIKE ?
         ORDER BY date DESC LIMIT 10`,
        [q, q, q]
      );
      if (rawBulkRows.length > 0) results.raw_bulk_milk_testing_records = rawBulkRows;

      // 5. Packing Milk Report
      const [packingMilkRows] = await conn.query(
        `SELECT id, date, tank_no, batch_no, product_name, fat_percent, status 
         FROM packing_milk_reports 
         WHERE tank_no LIKE ? OR batch_no LIKE ? OR product_name LIKE ? OR status LIKE ?
         ORDER BY date DESC LIMIT 10`,
        [q, q, q, q]
      );
      if (packingMilkRows.length > 0) results.packing_milk_reports = packingMilkRows;

      // 6. Milk Taken (Bi-Product)
      const [milkTakenRows] = await conn.query(
        `SELECT id, date, product_name, fat_percent, snf_percent, status 
         FROM milk_taken_report_bi_products 
         WHERE product_name LIKE ? OR status LIKE ?
         ORDER BY date DESC LIMIT 10`,
        [q, q]
      );
      if (milkTakenRows.length > 0) results.milk_taken_report_bi_products = milkTakenRows;

      // 7. Buttermilk Analysis
      const [buttermilkRows] = await conn.query(
        `SELECT id, date, batch_no, type_of_sample, fat_percent, acidity_percent, status 
         FROM buttermilk_analysis_records 
         WHERE batch_no LIKE ? OR type_of_sample LIKE ? OR status LIKE ?
         ORDER BY date DESC LIMIT 10`,
        [q, q, q]
      );
      if (buttermilkRows.length > 0) results.buttermilk_analysis_records = buttermilkRows;

      // 8. Pouch Weighing Sessions
      const [pouchRows] = await conn.query(
        `SELECT DISTINCT s.id, s.date, s.packing_supervisor_name, s.quality_incharge_name, s.status
         FROM pouch_weighing_sessions s
         LEFT JOIN pouch_weighing_heads h ON s.id = h.session_id
         WHERE s.packing_supervisor_name LIKE ? OR s.quality_incharge_name LIKE ? OR h.operator_name LIKE ? OR h.batch_no LIKE ? OR s.status LIKE ?
         ORDER BY s.date DESC LIMIT 10`,
        [q, q, q, q, q]
      );
      if (pouchRows.length > 0) results.pouch_weighing_sessions = pouchRows;

      return results;
    } finally {
      conn.release();
    }
  }
}

module.exports = new SearchService();
