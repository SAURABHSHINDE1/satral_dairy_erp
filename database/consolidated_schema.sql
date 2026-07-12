-- =============================================================================
-- Satral Dairy ERP - Consolidated Database Schema
-- MySQL Version
-- Consolidated Date: 2026-07-12
-- =============================================================================

CREATE DATABASE IF NOT EXISTS satral_dairy_test;
USE satral_dairy_test;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Users Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'lab_incharge', 'quality_incharge', 'operator', 'qc_manager') NOT NULL DEFAULT 'operator',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tank Records Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tank_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    tank_number VARCHAR(20) NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    milk_quantity DECIMAL(10, 2) NOT NULL,
    fat_percentage DECIMAL(5, 2) NOT NULL,
    snf_percentage DECIMAL(5, 2) NOT NULL,
    temperature DECIMAL(5, 2) NOT NULL,
    milk_type ENUM('cow', 'buffalo', 'mixed') NOT NULL,
    process_operator_id INT NOT NULL,
    lab_incharge_id INT,
    tank_release_time TIME,
    packing_machine_detail VARCHAR(255),
    release_time TIME,
    remarks TEXT,
    status ENUM('draft', 'pending_lab', 'pending_admin', 'approved', 'rejected') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (process_operator_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (lab_incharge_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_date (date),
    INDEX idx_tank_number (tank_number),
    INDEX idx_status (status),
    INDEX idx_process_operator (process_operator_id),
    INDEX idx_lab_incharge (lab_incharge_id),
    INDEX idx_tr_date_tank (date, tank_number),
    INDEX idx_tr_date_status (date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Approvals Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tank_record_id INT NOT NULL,
    approver_id INT NOT NULL,
    approver_role ENUM('lab_incharge', 'quality_incharge', 'qc_manager', 'admin') NOT NULL,
    action ENUM('approved', 'rejected') NOT NULL,
    comments TEXT,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tank_record_id) REFERENCES tank_records(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_tank_record (tank_record_id),
    INDEX idx_approver (approver_id),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Activity Logs Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Reports Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_name VARCHAR(100) NOT NULL,
    report_type ENUM('daily', 'weekly', 'monthly', 'custom') NOT NULL,
    generated_by INT NOT NULL,
    start_date DATE,
    end_date DATE,
    file_path VARCHAR(255),
    parameters JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_report_type (report_type),
    INDEX idx_generated_by (generated_by),
    INDEX idx_date_range (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Notifications Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    entity_type VARCHAR(50),
    entity_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Settings Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Final Product Storage Records Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS final_product_storage_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    shift ENUM('morning', 'evening', 'night') NOT NULL,
    testing_time TIME,
    tank_no VARCHAR(20) NOT NULL,
    type_of_milk ENUM('cow', 'buffalo', 'mixed') NOT NULL DEFAULT 'cow',
    milk_quantity_l DECIMAL(10, 2),
    temp_celsius DECIMAL(5, 2),
    flavour_taste VARCHAR(100),
    acidity_percent DECIMAL(5, 3),
    alcohol_result VARCHAR(50),
    fat_percent DECIMAL(5, 2),
    clr DECIMAL(6, 3),
    snf_percent DECIMAL(5, 2),
    efficiency_percent DECIMAL(5, 2) NULL,
    protein_percent DECIMAL(5, 2),
    electrolyte_condition VARCHAR(100),
    remark TEXT,
    status ENUM('draft', 'pending_lab', 'pending_admin', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    approved_by INT NULL,
    approved_at DATETIME NULL,
    approval_comment TEXT NULL,
    chemist_name VARCHAR(100),
    quality_incharge_name VARCHAR(100),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_date (date),
    INDEX idx_shift (shift),
    INDEX idx_tank_no (tank_no),
    INDEX idx_fp_status (status),
    INDEX idx_fp_date_tank (date, tank_no),
    INDEX idx_fp_date_status (date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Bi-Product Reports Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bi_product_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_no VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    body_structure VARCHAR(100),
    sensory VARCHAR(100),
    taste VARCHAR(100),
    temp_celsius DECIMAL(5, 2),
    acidity_percent DECIMAL(5, 3),
    ph DECIMAL(4, 2),
    self_life VARCHAR(50),
    fdm DECIMAL(5, 2) NULL,
    fat_percent DECIMAL(5, 2) NULL,
    ts DECIMAL(5, 2) NULL,
    lassi_viscosity DECIMAL(8, 2) NULL,
    moisture DECIMAL(5, 2) NULL,
    status ENUM('draft', 'pending_lab', 'pending_admin', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    approved_by INT NULL,
    approved_at DATETIME NULL,
    approval_comment TEXT NULL,
    chemist_name VARCHAR(100),
    quality_incharge_name VARCHAR(100),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_date (date),
    INDEX idx_product_name (product_name),
    INDEX idx_batch_no (batch_no),
    INDEX idx_bp_status (status),
    INDEX idx_bp_date_product (date, product_name),
    INDEX idx_bp_date_status (date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Raw Bulk Milk Testing Records Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raw_bulk_milk_testing_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    testing_time TIME,
    sample_name VARCHAR(100) NOT NULL,
    type_of_milk ENUM('cow', 'buffalo', 'mixed') NOT NULL DEFAULT 'cow',
    milk_quantity_lit DECIMAL(10, 2),
    temp_celsius DECIMAL(5, 2),
    ot DECIMAL(6, 3),
    acidity_percent DECIMAL(5, 3),
    alcohol_result VARCHAR(50),
    fat_percent DECIMAL(5, 2),
    clr DECIMAL(6, 3),
    snf DECIMAL(5, 2),
    protein_percent DECIMAL(5, 2) NULL,
    sodium_electrolyte_condition VARCHAR(100) NULL,
    ph DECIMAL(4, 2) NULL,
    remark TEXT,
    chemist_name VARCHAR(100),
    quality_incharge_name VARCHAR(100),
    status ENUM('draft', 'pending_lab', 'pending_admin', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    approved_by INT NULL,
    approved_at DATETIME NULL,
    approval_comment TEXT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_rbm_status (status),
    INDEX idx_rbm_date (date),
    INDEX idx_rbm_date_sample (date, sample_name),
    INDEX idx_rbm_date_status (date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Packing Milk Reports Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS packing_milk_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    testing_time TIME,
    tank_no VARCHAR(50) NOT NULL,
    batch_no VARCHAR(50) NOT NULL,
    packing_head VARCHAR(100) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    temp_celsius DECIMAL(5, 2),
    acidity_percent DECIMAL(5, 3),
    alcohol_result VARCHAR(50),
    fat_percent DECIMAL(5, 2),
    clr DECIMAL(6, 3),
    snf_percent DECIMAL(5, 2),
    phosphatase_test VARCHAR(50),
    br DECIMAL(6, 3) NULL,
    ph DECIMAL(4, 2) NULL,
    ts DECIMAL(5, 2),
    protein_percent DECIMAL(5, 2),
    remark TEXT,
    chemist_name VARCHAR(100),
    quality_incharge_name VARCHAR(100),
    status ENUM('draft', 'pending_lab', 'pending_admin', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    approved_by INT NULL,
    approved_at DATETIME NULL,
    approval_comment TEXT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_date (date),
    INDEX idx_tank_no (tank_no),
    INDEX idx_batch_no (batch_no),
    INDEX idx_product (product_name),
    INDEX idx_pmr_date_product (date, product_name),
    INDEX idx_pmr_date_tank (date, tank_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. Milk Taken Report (Bi-Product) Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milk_taken_reports_bi_product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    testing_time TIME,
    temp_celsius DECIMAL(5, 2),
    ot DECIMAL(6, 3),
    acidity_percent DECIMAL(5, 3),
    alcohol_result VARCHAR(50),
    fat_percent DECIMAL(5, 2),
    clr DECIMAL(6, 3),
    snf_percent DECIMAL(5, 2),
    neutralizer_adultration VARCHAR(100),
    sodium_electrolyte_condition VARCHAR(100) NULL,
    ph DECIMAL(4, 2) NULL,
    chemist_name VARCHAR(100),
    qc_manager_name VARCHAR(100),
    status ENUM('draft', 'pending_lab', 'pending_admin', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    approved_by INT NULL,
    approved_at DATETIME NULL,
    approval_comment TEXT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_date (date),
    INDEX idx_product_name (product_name),
    INDEX idx_mtrbp_date_product (date, product_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. Buttermilk Analysis Records Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buttermilk_analysis_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL,
    type_of_sample VARCHAR(100) NOT NULL,
    testing_time VARCHAR(20) NOT NULL,
    batch_no VARCHAR(50) NOT NULL,
    packing_date VARCHAR(50) NOT NULL,
    expiry_date VARCHAR(50) NOT NULL,
    flavour VARCHAR(100) NOT NULL,
    taste VARCHAR(100) NOT NULL,
    fat_percent VARCHAR(20) NOT NULL,
    degree VARCHAR(20) NOT NULL,
    acidity_percent VARCHAR(20) NOT NULL,
    protein_percent VARCHAR(20) NOT NULL,
    adulteration VARCHAR(100) NOT NULL,
    remark VARCHAR(255) NOT NULL,
    sign_name VARCHAR(100) NOT NULL,
    chemist_name VARCHAR(100) NOT NULL,
    quality_incharge_name VARCHAR(100) NOT NULL,
    status ENUM('draft', 'pending_lab', 'pending_admin', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    approved_by INT NULL,
    approved_at DATETIME NULL,
    approval_comment TEXT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_btm_date (date),
    INDEX idx_btm_date_shift (date, shift)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. Pouch Weighing Log Sessions Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pouch_weighing_sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  packing_supervisor_name VARCHAR(150) DEFAULT NULL,
  quality_incharge_name VARCHAR(150) DEFAULT NULL,
  status ENUM('draft', 'pending_lab', 'pending_admin', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INT UNSIGNED DEFAULT NULL,
  INDEX idx_pws_date (date),
  INDEX idx_pws_user (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. Pouch Weighing Heads Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pouch_weighing_heads (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_id INT UNSIGNED NOT NULL,
  head_name CHAR(1) NOT NULL COMMENT 'A-I',
  batch_release_tank_number VARCHAR(100) DEFAULT NULL,
  operator_name VARCHAR(150) DEFAULT NULL,
  batch_no VARCHAR(100) DEFAULT NULL,
  mfg_date DATE DEFAULT NULL,
  exp_date DATE DEFAULT NULL,
  pack_size_ml DECIMAL(8,2) DEFAULT NULL,
  target_weight_min_ml DECIMAL(8,2) DEFAULT NULL,
  target_weight_max_ml DECIMAL(8,2) DEFAULT NULL,
  INDEX idx_pwh_session (session_id),
  CONSTRAINT fk_pwh_session FOREIGN KEY (session_id) REFERENCES pouch_weighing_sessions (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. Pouch Weighing Readings Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pouch_weighing_readings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  head_id INT UNSIGNED NOT NULL,
  timing VARCHAR(10) NOT NULL COMMENT 'e.g. 09:00, 09:30 … 20:00',
  weight_reading_ml DECIMAL(8,2) DEFAULT NULL,
  INDEX idx_pwr_head (head_id),
  CONSTRAINT fk_pwr_head FOREIGN KEY (head_id) REFERENCES pouch_weighing_heads (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─────────────────────────────────────────────────────────────────────────────
-- 17. Seed Data and System Views
-- ─────────────────────────────────────────────────────────────────────────────

-- Views
CREATE OR REPLACE VIEW daily_statistics AS
SELECT 
    DATE(created_at) as stat_date,
    COUNT(*) as total_records,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_records,
    SUM(CASE WHEN status = 'pending_lab' OR status = 'pending_admin' THEN 1 ELSE 0 END) as pending_records,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_records,
    SUM(milk_quantity) as total_milk_quantity,
    AVG(fat_percentage) as avg_fat,
    AVG(snf_percentage) as avg_snf,
    AVG(temperature) as avg_temperature
FROM tank_records
GROUP BY DATE(created_at);

CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id as user_id,
    u.username,
    u.full_name,
    u.role,
    COUNT(DISTINCT al.id) as total_activities,
    COUNT(DISTINCT CASE WHEN al.action = 'login' THEN al.id END) as login_count,
    MAX(al.created_at) as last_activity
FROM users u
LEFT JOIN activity_logs al ON u.id = al.user_id
GROUP BY u.id, u.username, u.full_name, u.role;

-- Seed Default Settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('company_name', 'Satral Dairy', 'Company name for reports'),
('company_address', 'Satral Dairy Farm', 'Company address'),
('company_phone', '+91 XXXXXXXXXX', 'Company phone number'),
('company_email', 'info@satral.com', 'Company email'),
('session_timeout', '30', 'Session timeout in minutes'),
('auto_logout', 'true', 'Enable auto logout on session timeout'),
('pdf_logo_path', '/assets/logo.png', 'Path to company logo for PDF'),
('default_milk_type', 'cow', 'Default milk type for new records')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Seed Default Users
-- Passwords are encrypted using bcrypt: 
-- admin/admin, lab/lab123, operator/op123
INSERT INTO users (username, password, email, full_name, role, is_active) VALUES
('admin', '$2a$10$uO8yYviRvGWesQRJ/C0CKejMpv.j22G5YaCRxMVVpIBro8Zdu/gOC', 'admin@satral.com', 'System Administrator', 'admin', true),
('lab', '$2a$10$lIaUiHvsBJFxZMiiojnZ4O8a2kFYtiXNE/h.pjmEfQjrkNc9UzcEO', 'lab@satral.com', 'Lab Incharge', 'lab_incharge', true),
('operator', '$2a$10$wndFxn99GdKjbs3BKplUX.N2ijUcRh/OrNo7kKwBBnKtKpKchD/i.', 'operator@satral.com', 'Process Operator', 'operator', true)
ON DUPLICATE KEY UPDATE is_active=true;
