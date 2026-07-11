-- ============================================================
-- Migration: Approval System + Quality Incharge Role
-- Run this once against your satral_dairy_test database
-- ============================================================

USE satral_dairy_test;

-- ────────────────────────────────────────────────────────────
-- 1. Add quality_incharge to users role ENUM
-- ────────────────────────────────────────────────────────────
ALTER TABLE users
  MODIFY COLUMN role ENUM('admin', 'lab_incharge', 'quality_incharge', 'operator') NOT NULL;

-- ────────────────────────────────────────────────────────────
-- 2. Add quality_incharge to approvals table approver_role
-- ────────────────────────────────────────────────────────────
ALTER TABLE approvals
  MODIFY COLUMN approver_role ENUM('lab_incharge', 'quality_incharge', 'admin') NOT NULL;

-- ────────────────────────────────────────────────────────────
-- 3. Add approval columns to final_product_storage_records
-- ────────────────────────────────────────────────────────────
ALTER TABLE final_product_storage_records
  ADD COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' AFTER remark,
  ADD COLUMN approved_by INT NULL AFTER status,
  ADD COLUMN approved_at DATETIME NULL AFTER approved_by,
  ADD COLUMN approval_comment TEXT NULL AFTER approved_at,
  ADD INDEX idx_fp_status (status),
  ADD CONSTRAINT fk_fp_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- ────────────────────────────────────────────────────────────
-- 4. Add approval columns to bi_product_reports
-- ────────────────────────────────────────────────────────────
ALTER TABLE bi_product_reports
  ADD COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' AFTER moisture,
  ADD COLUMN approved_by INT NULL AFTER status,
  ADD COLUMN approved_at DATETIME NULL AFTER approved_by,
  ADD COLUMN approval_comment TEXT NULL AFTER approved_at,
  ADD INDEX idx_bp_status (status),
  ADD CONSTRAINT fk_bp_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- ────────────────────────────────────────────────────────────
-- 5. Add approval columns to raw_bulk_milk_testing_records
-- ────────────────────────────────────────────────────────────
ALTER TABLE raw_bulk_milk_testing_records
  ADD COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' AFTER quality_incharge_name,
  ADD COLUMN approved_by INT NULL AFTER status,
  ADD COLUMN approved_at DATETIME NULL AFTER approved_by,
  ADD COLUMN approval_comment TEXT NULL AFTER approved_at,
  ADD INDEX idx_rbm_status (status),
  ADD CONSTRAINT fk_rbm_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

SELECT 'Migration completed successfully!' AS result;
