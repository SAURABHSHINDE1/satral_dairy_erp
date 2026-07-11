const fs = require('fs');
const path = require('path');

function generateSqlSeed() {
  console.log('Generating seed.sql file...');
  
  let sql = `-- Satral Dairy ERP Dummy Data Seed File\n`;
  sql += `USE satral_dairy_test;\n\n`;
  
  // Clear existing records
  sql += `-- Clear existing transactional data\n`;
  sql += `DELETE FROM approvals;\n`;
  sql += `DELETE FROM tank_records;\n`;
  sql += `DELETE FROM activity_logs;\n`;
  sql += `DELETE FROM notifications;\n\n`;

  // Make sure default users exist
  sql += `-- Ensure default users exist\n`;
  sql += `INSERT IGNORE INTO users (id, username, password, email, full_name, role, is_active) VALUES\n`;
  sql += `(1, 'admin', '$2a$10$uO8yYviRvGWesQRJ/C0CKejMpv.j22G5YaCRxMVVpIBro8Zdu/gOC', 'admin@satral.com', 'System Administrator', 'admin', true),\n`;
  sql += `(2, 'lab', '$2a$10$lIaUiHvsBJFxZMiiojnZ4O8a2kFYtiXNE/h.pjmEfQjrkNc9UzcEO', 'lab@satral.com', 'Lab Incharge', 'lab_incharge', true),\n`;
  sql += `(3, 'operator', '$2a$10$wndFxn99GdKjbs3BKplUX.N2ijUcRh/OrNo7kKwBBnKtKpKchD/i.', 'operator@satral.com', 'Process Operator', 'operator', true);\n\n`;

  const tankNumbers = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05'];
  const milkTypes = ['cow', 'buffalo', 'mixed'];
  const statuses = ['approved', 'approved', 'approved', 'approved', 'rejected', 'pending_lab', 'pending_admin', 'draft'];

  const now = new Date();
  let recordId = 1;
  let approvalId = 1;
  let logId = 1;

  sql += `-- Insert Tank Records and corresponding Approvals & Logs\n`;

  for (let d = 30; d >= 0; d--) {
    const date = new Date();
    date.setDate(now.getDate() - d);
    const dateString = date.toISOString().split('T')[0];
    
    // 2-4 records per day
    const numRecords = Math.floor(Math.random() * 3) + 2;
    
    for (let r = 1; r <= numRecords; r++) {
      const tankNumber = tankNumbers[Math.floor(Math.random() * tankNumbers.length)];
      const milkType = milkTypes[Math.floor(Math.random() * milkTypes.length)];
      const batchNumber = `B-${dateString.replace(/-/g, '')}-${String(r).padStart(2, '0')}`;
      
      let milkQuantity = (Math.random() * 8000 + 4000).toFixed(2);
      let temperature = (Math.random() * 2.5 + 3.0).toFixed(2);
      
      let fatPercentage, snfPercentage;
      if (milkType === 'cow') {
        fatPercentage = (Math.random() * 1.2 + 3.4).toFixed(2);
        snfPercentage = (Math.random() * 0.7 + 8.2).toFixed(2);
      } else if (milkType === 'buffalo') {
        fatPercentage = (Math.random() * 2.5 + 6.0).toFixed(2);
        snfPercentage = (Math.random() * 0.8 + 9.0).toFixed(2);
      } else {
        fatPercentage = (Math.random() * 1.5 + 4.5).toFixed(2);
        snfPercentage = (Math.random() * 0.7 + 8.5).toFixed(2);
      }

      let status = statuses[Math.floor(Math.random() * statuses.length)];
      if (d === 0) {
        status = Math.random() > 0.5 ? 'pending_lab' : 'draft';
      } else if (d === 1) {
        status = Math.random() > 0.4 ? 'approved' : 'pending_admin';
      }

      let remarks = 'Normal batch processing quality.';
      if (status === 'rejected') {
        remarks = Math.random() > 0.5 
          ? 'Rejected: Temperature was above maximum limit (5.5°C).' 
          : 'Rejected: SNF percentage below accepted standard limits.';
        if (remarks.includes('Temperature')) {
          temperature = (Math.random() * 3 + 6.5).toFixed(2);
        } else {
          snfPercentage = (Math.random() * 0.5 + 7.5).toFixed(2);
        }
      } else if (status === 'approved') {
        remarks = 'Parameters standard. Approved for production.';
      }

      const processOperatorId = 3;
      const labInchargeId = (status === 'approved' || status === 'rejected' || status === 'pending_admin') ? 2 : 'NULL';
      const tankReleaseTime = status === 'approved' 
        ? `'${dateString} ${String(Math.floor(Math.random() * 6) + 10).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00'` 
        : 'NULL';

      // Insert tank record statement
      sql += `INSERT INTO tank_records (id, date, tank_number, batch_number, milk_quantity, fat_percentage, snf_percentage, temperature, milk_type, process_operator_id, lab_incharge_id, tank_release_time, remarks, status, created_at) VALUES `;
      sql += `(${recordId}, '${dateString}', '${tankNumber}', '${batchNumber}', ${milkQuantity}, ${fatPercentage}, ${snfPercentage}, ${temperature}, '${milkType}', ${processOperatorId}, ${labInchargeId}, ${tankReleaseTime}, '${remarks.replace(/'/g, "\\'")}', '${status}', '${dateString} 09:00:00');\n`;

      // Approvals
      if (status === 'approved' || status === 'rejected') {
        sql += `INSERT INTO approvals (id, tank_record_id, approver_id, approver_role, action, comments, approved_at) VALUES `;
        sql += `(${approvalId++}, ${recordId}, 2, 'lab_incharge', '${status}', '${status === 'approved' ? 'Lab parameters verified. OK.' : 'Lab checks failed. Parameter out of range.'}', '${dateString} 10:30:00');\n`;

        if (status === 'approved' && Math.random() > 0.5) {
          sql += `INSERT INTO approvals (id, tank_record_id, approver_id, approver_role, action, comments, approved_at) VALUES `;
          sql += `(${approvalId++}, ${recordId}, 1, 'admin', 'approved', 'Final approval given for processing.', '${dateString} 11:00:00');\n`;
        }
      }

      // Logs
      sql += `INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, ip_address, details, created_at) VALUES `;
      sql += `(${logId++}, 3, 'create', 'tank_record', ${recordId}, '127.0.0.1', 'Created tank record for batch ${batchNumber}', '${dateString} 09:00:00');\n`;

      if (status === 'approved' || status === 'rejected') {
        sql += `INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, ip_address, details, created_at) VALUES `;
        sql += `(${logId++}, 2, '${status}', 'tank_record', ${recordId}, '127.0.0.1', '${status.toUpperCase()} tank record for batch ${batchNumber}', '${dateString} 10:30:00');\n`;
      }

      recordId++;
    }
  }

  // Activity logs for logins
  sql += `\n-- Insert general activity logs\n`;
  sql += `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address, details, created_at) VALUES\n`;
  sql += `(1, 'login', 'user', 1, '127.0.0.1', 'Admin user logged in successfully', NOW()),\n`;
  sql += `(2, 'login', 'user', 2, '127.0.0.1', 'Lab incharge logged in successfully', NOW() - INTERVAL 1 HOUR),\n`;
  sql += `(3, 'login', 'user', 3, '127.0.0.1', 'Process operator logged in successfully', NOW() - INTERVAL 2 HOUR);\n\n`;

  // Notifications
  sql += `-- Insert general notifications\n`;
  sql += `INSERT INTO notifications (user_id, title, message, type, is_read, entity_type, entity_id, created_at) VALUES\n`;
  sql += `(1, 'New Record Pending Approval', 'Batch B-${now.toISOString().split('T')[0].replace(/-/g, '')}-01 requires admin approval.', 'warning', false, 'tank_record', null, NOW()),\n`;
  sql += `(2, 'Lab Review Needed', 'Operator submitted new tank parameters for verification.', 'info', false, 'tank_record', null, NOW()),\n`;
  sql += `(3, 'Batch Rejected', 'Batch from Tank T-03 has been rejected due to low fat content.', 'error', false, 'tank_record', null, NOW()),\n`;
  sql += `(3, 'Batch Approved', 'Batch from Tank T-01 approved and released.', 'success', true, 'tank_record', null, NOW()),\n`;
  sql += `(1, 'System Update', 'Database maintenance completed successfully.', 'info', true, 'system', null, NOW());\n`;

  const outputPath = path.resolve(__dirname, '../../../database/seed.sql');
  fs.writeFileSync(outputPath, sql);
  console.log(`Successfully generated seed.sql at ${outputPath}`);
}

generateSqlSeed();
