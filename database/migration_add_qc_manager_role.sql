-- Migration: Add 'qc_manager' role to users table
-- Run this script on your MySQL database (satral_dairy_test) to apply the change.
-- Date: 2026-07-11

USE satral_dairy_test;

ALTER TABLE users
  MODIFY COLUMN role ENUM('admin', 'lab_incharge', 'quality_incharge', 'operator', 'qc_manager')
  NOT NULL DEFAULT 'operator';

ALTER TABLE approvals
  MODIFY COLUMN approver_role ENUM('lab_incharge', 'quality_incharge', 'qc_manager', 'admin') NOT NULL;
