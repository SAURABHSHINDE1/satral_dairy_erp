-- ============================================================
-- Migration: Performance Indexes for Quality Testing Tables
-- Purpose   : Speeds up date-based and composite filtered
--             queries across all 7 quality modules.
--             Run once against satral_dairy_test.
-- ============================================================

USE satral_dairy_test;

-- ────────────────────────────────────────────────────────────
-- 1. tank_records
--    Existing: idx_date(date), idx_tank_number, idx_status
--    Adding composite indexes for common combined filters:
--      date+tank_number  (filter by date AND specific tank)
--      date+status       (filter by date AND approval state)
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_tr_date_tank   ON tank_records(date, tank_number);
CREATE INDEX idx_tr_date_status ON tank_records(date, status);

-- ────────────────────────────────────────────────────────────
-- 2. final_product_storage_records
--    Existing: idx_date(date), idx_shift, idx_tank_no, idx_fp_status
--    Adding composite indexes:
--      date+tank_no  (filter by date AND tank)
--      date+status   (filter by date AND approval state)
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_fp_date_tank   ON final_product_storage_records(date, tank_no);
CREATE INDEX idx_fp_date_status ON final_product_storage_records(date, status);

-- ────────────────────────────────────────────────────────────
-- 3. bi_product_reports
--    Existing: idx_date(date), idx_product_name, idx_batch_no, idx_bp_status
--    Adding composite indexes:
--      date+product_name  (filter by date AND product)
--      date+status        (filter by date AND approval state)
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_bp_date_product ON bi_product_reports(date, product_name);
CREATE INDEX idx_bp_date_status  ON bi_product_reports(date, status);

-- ────────────────────────────────────────────────────────────
-- 4. raw_bulk_milk_testing_records
--    Existing: idx_rbm_status(status)  — NO date index!
--    Adding:
--      idx_date            (single column for date filter)
--      date+sample_name    (composite for sample search by date)
--      date+status         (composite for status filter by date)
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_rbm_date         ON raw_bulk_milk_testing_records(date);
CREATE INDEX idx_rbm_date_sample  ON raw_bulk_milk_testing_records(date, sample_name);
CREATE INDEX idx_rbm_date_status  ON raw_bulk_milk_testing_records(date, status);

-- ────────────────────────────────────────────────────────────
-- 5. packing_milk_reports
--    Existing: idx_date(date), idx_tank_no, idx_batch_no, idx_product
--    Adding composite indexes:
--      date+product_name  (filter by date AND product)
--      date+tank_no       (filter by date AND tank)
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_pmr_date_product ON packing_milk_reports(date, product_name);
CREATE INDEX idx_pmr_date_tank    ON packing_milk_reports(date, tank_no);

-- ────────────────────────────────────────────────────────────
-- 6. milk_taken_reports_bi_product
--    Existing: idx_date(date), idx_product_name
--    Adding composite index:
--      date+product_name  (filter by date AND product)
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_mtrbp_date_product ON milk_taken_reports_bi_product(date, product_name);

-- ────────────────────────────────────────────────────────────
-- 7. buttermilk_analysis_records
--    Existing: PRIMARY only, no date index at all!
--    Adding:
--      idx_date        (single column for date filter)
--      date+shift      (composite for date+shift filter)
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_btm_date       ON buttermilk_analysis_records(date);
CREATE INDEX idx_btm_date_shift ON buttermilk_analysis_records(date, shift);

SELECT 'Performance indexes migration completed successfully!' AS result;
