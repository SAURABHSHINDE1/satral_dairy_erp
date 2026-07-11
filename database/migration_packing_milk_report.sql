-- Migration: Create packing_milk_reports table
-- Run this script on your MySQL database (satral_dairy_test) to apply the schema change.
-- Date: 2026-07-11

USE satral_dairy_test;

CREATE TABLE IF NOT EXISTS packing_milk_reports (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    date                    DATE NOT NULL,
    testing_time            TIME,
    tank_no                 VARCHAR(50) NOT NULL,
    batch_no                VARCHAR(50) NOT NULL,
    packing_head            VARCHAR(100) NOT NULL,
    product_name            VARCHAR(100) NOT NULL,
    temp_celsius            DECIMAL(5, 2),
    acidity_percent         DECIMAL(5, 3),
    alcohol_result          VARCHAR(50),
    fat_percent             DECIMAL(5, 2),
    clr                     DECIMAL(6, 3),
    snf_percent             DECIMAL(5, 2),
    phosphatase_test        VARCHAR(50),
    br                      DECIMAL(6, 3) NULL,
    ph                      DECIMAL(4, 2) NULL,
    ts                      DECIMAL(5, 2),
    protein_percent         DECIMAL(5, 2),
    remark                  TEXT,
    chemist_name            VARCHAR(100),
    quality_incharge_name   VARCHAR(100),
    created_by              INT,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_date      (date),
    INDEX idx_tank_no   (tank_no),
    INDEX idx_batch_no  (batch_no),
    INDEX idx_product   (product_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
