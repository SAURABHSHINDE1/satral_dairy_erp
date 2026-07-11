-- Migration: Add packing_machine_detail column to tank_records
-- Run this script on your MySQL database to apply the schema change

ALTER TABLE tank_records
  ADD COLUMN packing_machine_detail VARCHAR(255) NULL AFTER tank_release_time;
