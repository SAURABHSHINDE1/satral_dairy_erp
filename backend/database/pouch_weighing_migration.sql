-- ─────────────────────────────────────────────────────────────────────────────
-- Pouch Weighing Log Sheet — Migration
-- Run this script once against your MySQL database.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Session table (one per day / per run)
CREATE TABLE IF NOT EXISTS `pouch_weighing_sessions` (
  `id`                       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `date`                     DATE         NOT NULL,
  `packing_supervisor_name`  VARCHAR(150)          DEFAULT NULL,
  `quality_incharge_name`    VARCHAR(150)          DEFAULT NULL,
  `created_at`               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by`               INT UNSIGNED          DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_pws_date`  (`date`),
  INDEX `idx_pws_user`  (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Packing heads per session (up to 9: A–I)
CREATE TABLE IF NOT EXISTS `pouch_weighing_heads` (
  `id`                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id`              INT UNSIGNED NOT NULL,
  `head_name`               CHAR(1)      NOT NULL COMMENT 'A-I',
  `batch_release_tank_number` VARCHAR(100)          DEFAULT NULL,
  `operator_name`           VARCHAR(150)          DEFAULT NULL,
  `batch_no`                VARCHAR(100)          DEFAULT NULL,
  `mfg_date`                DATE                  DEFAULT NULL,
  `exp_date`                DATE                  DEFAULT NULL,
  `pack_size_ml`            DECIMAL(8,2)          DEFAULT NULL,
  `target_weight_min_ml`    DECIMAL(8,2)          DEFAULT NULL,
  `target_weight_max_ml`    DECIMAL(8,2)          DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_pwh_session` (`session_id`),
  CONSTRAINT `fk_pwh_session`
    FOREIGN KEY (`session_id`) REFERENCES `pouch_weighing_sessions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Weight readings per head (23 fixed time slots, value may be NULL)
CREATE TABLE IF NOT EXISTS `pouch_weighing_readings` (
  `id`                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `head_id`           INT UNSIGNED  NOT NULL,
  `timing`            VARCHAR(10)   NOT NULL COMMENT 'e.g. 09:00, 09:30 … 20:00',
  `weight_reading_ml` DECIMAL(8,2)           DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_pwr_head` (`head_id`),
  CONSTRAINT `fk_pwr_head`
    FOREIGN KEY (`head_id`) REFERENCES `pouch_weighing_heads` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
