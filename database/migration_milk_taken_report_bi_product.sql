-- Migration: Create milk_taken_reports_bi_product table
-- Run this script on your MySQL database (satral_dairy_test) to apply the schema change.
-- Date: 2026-07-11

USE satral_dairy_test;

CREATE TABLE IF NOT EXISTS milk_taken_reports_bi_product (
    id                              INT AUTO_INCREMENT PRIMARY KEY,
    date                            DATE NOT NULL,
    product_name                    VARCHAR(100) NOT NULL,
    testing_time                    TIME,
    temp_celsius                    DECIMAL(5, 2),
    ot                              DECIMAL(6, 3),
    acidity_percent                 DECIMAL(5, 3),
    alcohol_result                  VARCHAR(50),
    fat_percent                     DECIMAL(5, 2),
    clr                             DECIMAL(6, 3),
    snf_percent                     DECIMAL(5, 2),
    neutralizer_adultration         VARCHAR(100),
    sodium_electrolyte_condition     VARCHAR(100) NULL,
    ph                              DECIMAL(4, 2) NULL,
    chemist_name                    VARCHAR(100),
    qc_manager_name                 VARCHAR(100),
    created_by                      INT,
    created_at                      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_date         (date),
    INDEX idx_product_name (product_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
