-- Migration: Create buttermilk_analysis_records table
-- Date: 2026-07-11

USE satral_dairy_test;

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
