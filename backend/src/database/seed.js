const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const pool = require('../config/database.config');

async function seed() {
  console.log('Starting database seeding...');
  
  try {
    // 1. Check if default users exist, if not insert them
    const [users] = await pool.query('SELECT * FROM users');
    if (users.length === 0) {
      console.log('Inserting default users...');
      await pool.query(`
        INSERT INTO users (id, username, password, email, full_name, role, is_active) VALUES
        (1, 'admin', '$2a$10$uO8yYviRvGWesQRJ/C0CKejMpv.j22G5YaCRxMVVpIBro8Zdu/gOC', 'admin@satral.com', 'System Administrator', 'admin', true),
        (2, 'lab', '$2a$10$lIaUiHvsBJFxZMiiojnZ4O8a2kFYtiXNE/h.pjmEfQjrkNc9UzcEO', 'lab@satral.com', 'Lab Incharge', 'lab_incharge', true),
        (3, 'operator', '$2a$10$wndFxn99GdKjbs3BKplUX.N2ijUcRh/OrNo7kKwBBnKtKpKchD/i.', 'operator@satral.com', 'Process Operator', 'operator', true)
      `);
    }

    // 2. Clear old test records
    console.log('Cleaning up existing records...');
    await pool.query('DELETE FROM approvals');
    await pool.query('DELETE FROM tank_records');
    await pool.query('DELETE FROM activity_logs');
    await pool.query('DELETE FROM notifications');

    // 3. Generate tank records
    console.log('Generating dummy tank records...');
    const tankNumbers = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05'];
    const milkTypes = ['cow', 'buffalo', 'mixed'];
    const statuses = ['approved', 'approved', 'approved', 'approved', 'rejected', 'pending_lab', 'pending_admin', 'draft']; // Weighted distribution
    
    const now = new Date();
    
    // Generate records for the last 30 days
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
        
        let milkQuantity = parseFloat((Math.random() * 8000 + 4000).toFixed(2)); // 4000 - 12000 L
        let temperature = parseFloat((Math.random() * 2.5 + 3.0).toFixed(2)); // 3.0 - 5.5 C
        
        let fatPercentage, snfPercentage;
        if (milkType === 'cow') {
          fatPercentage = parseFloat((Math.random() * 1.2 + 3.4).toFixed(2)); // 3.4 - 4.6
          snfPercentage = parseFloat((Math.random() * 0.7 + 8.2).toFixed(2)); // 8.2 - 8.9
        } else if (milkType === 'buffalo') {
          fatPercentage = parseFloat((Math.random() * 2.5 + 6.0).toFixed(2)); // 6.0 - 8.5
          snfPercentage = parseFloat((Math.random() * 0.8 + 9.0).toFixed(2)); // 9.0 - 9.8
        } else {
          fatPercentage = parseFloat((Math.random() * 1.5 + 4.5).toFixed(2)); // 4.5 - 6.0
          snfPercentage = parseFloat((Math.random() * 0.7 + 8.5).toFixed(2)); // 8.5 - 9.2
        }

        // status
        // Today's records are more likely to be draft/pending
        let status = statuses[Math.floor(Math.random() * statuses.length)];
        if (d === 0) {
          status = Math.random() > 0.5 ? 'pending_lab' : 'draft';
        } else if (d === 1) {
          status = Math.random() > 0.4 ? 'approved' : 'pending_admin';
        }

        // Adjust parameters to reject some records purposefully
        let remarks = 'Normal batch processing quality.';
        if (status === 'rejected') {
          remarks = Math.random() > 0.5 
            ? 'Rejected: Temperature was above maximum limit (5.5°C).' 
            : 'Rejected: SNF percentage below accepted standard limits.';
          if (remarks.includes('Temperature')) {
            temperature = parseFloat((Math.random() * 3 + 6.5).toFixed(2)); // 6.5 - 9.5 C
          } else {
            snfPercentage = parseFloat((Math.random() * 0.5 + 7.5).toFixed(2)); // 7.5 - 8.0
          }
        } else if (status === 'approved') {
          remarks = 'Parameters standard. Approved for production.';
        }

        const processOperatorId = 3; // Operator
        const labInchargeId = status === 'approved' || status === 'rejected' || status === 'pending_admin' ? 2 : null;
        const tankReleaseTime = status === 'approved' ? `${dateString} ${String(Math.floor(Math.random() * 6) + 10).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00` : null;

        // Insert record
        const [result] = await pool.query(
          `INSERT INTO tank_records 
           (date, tank_number, batch_number, milk_quantity, fat_percentage, snf_percentage, 
            temperature, milk_type, process_operator_id, lab_incharge_id, tank_release_time, remarks, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dateString,
            tankNumber,
            batchNumber,
            milkQuantity,
            fatPercentage,
            snfPercentage,
            temperature,
            milkType,
            processOperatorId,
            labInchargeId,
            tankReleaseTime,
            remarks,
            status,
            date
          ]
        );

        const recordId = result.insertId;

        // Create approvals table entries
        if (status === 'approved' || status === 'rejected') {
          // Lab approval
          await pool.query(
            `INSERT INTO approvals (tank_record_id, approver_id, approver_role, action, comments, approved_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              recordId,
              2, // lab
              'lab_incharge',
              status,
              status === 'approved' ? 'Lab parameters verified. OK.' : 'Lab checks failed. Parameter out of range.',
              date
            ]
          );

          // Admin approval for admin release or final check if needed
          if (status === 'approved' && Math.random() > 0.5) {
            await pool.query(
              `INSERT INTO approvals (tank_record_id, approver_id, approver_role, action, comments, approved_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                recordId,
                1, // admin
                'admin',
                'approved',
                'Final approval given for processing.',
                date
              ]
            );
          }
        }

        // Activity log entries
        await pool.query(
          `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address, details, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            3, // operator
            'create',
            'tank_record',
            recordId,
            '127.0.0.1',
            `Created tank record for batch ${batchNumber}`,
            date
          ]
        );

        if (status === 'approved' || status === 'rejected') {
          await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address, details, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              2, // lab
              status,
              'tank_record',
              recordId,
              '127.0.0.1',
              `${status.toUpperCase()} tank record for batch ${batchNumber}`,
              date
            ]
          );
        }
      }
    }

    // 4. Create some activity logs for log-ins and setting updates
    console.log('Generating dummy activity logs...');
    const activityDates = [new Date(), new Date(now.getTime() - 3600000), new Date(now.getTime() - 7200000)];
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address, details, created_at) VALUES
       (1, 'login', 'user', 1, '127.0.0.1', 'Admin user logged in successfully', ?),
       (2, 'login', 'user', 2, '127.0.0.1', 'Lab incharge logged in successfully', ?),
       (3, 'login', 'user', 3, '127.0.0.1', 'Process operator logged in successfully', ?),
       (1, 'update_settings', 'settings', null, '127.0.0.1', 'Updated company contact settings', ?)`,
      [activityDates[0], activityDates[1], activityDates[2], activityDates[0]]
    );

    // 5. Create some notifications
    console.log('Generating dummy notifications...');
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read, entity_type, entity_id, created_at) VALUES
       (1, 'New Record Pending Approval', 'Batch B-${now.toISOString().split('T')[0].replace(/-/g, '')}-01 requires admin approval.', 'warning', false, 'tank_record', null, ?),
       (2, 'Lab Review Needed', 'Operator submitted new tank parameters for verification.', 'info', false, 'tank_record', null, ?),
       (3, 'Batch Rejected', 'Batch from Tank T-03 has been rejected due to low fat content.', 'error', false, 'tank_record', null, ?),
       (3, 'Batch Approved', 'Batch from Tank T-01 approved and released.', 'success', true, 'tank_record', null, ?),
       (1, 'System Update', 'Database maintenance completed successfully.', 'info', true, 'system', null, ?)`,
      [now, now, now, now, now]
    );

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await pool.end();
  }
}

seed();
