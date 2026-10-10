-- ==============================================================================
-- NEIGHBORHOOD EQUIPMENT SHARING & TOOL DIRECTORY
-- MySQL 8.0+ Production Database Schema with Spatial Engine & Indexes
-- Compatible with Laravel 11.x Eloquent ORM & ST_Distance_Sphere Proximity Queries
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `disputes`;
DROP TABLE IF EXISTS `rental_requests`;
DROP TABLE IF EXISTS `broadcasts`;
DROP TABLE IF EXISTS `tools`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- Table: users
-- ------------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `neighborhood` VARCHAR(100) NOT NULL DEFAULT 'Oakridge North',
  `rating` DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  `rating_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_lent` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_borrowed` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_blacklisted` TINYINT(1) NOT NULL DEFAULT 0,
  `blacklist_reason` VARCHAR(255) NULL,
  `blacklisted_at` TIMESTAMP NULL DEFAULT NULL,
  `latitude` DECIMAL(10,7) NULL,
  `longitude` DECIMAL(10,7) NULL,
  `location` POINT NULL /*!80003 SRID 4326 */,
  `admin_security_hash` VARCHAR(255) NULL,
  `remember_token` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `users_role_idx` (`role`),
  INDEX `users_blacklist_idx` (`is_blacklisted`),
  SPATIAL INDEX `users_spatial_idx` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table: tools
-- ------------------------------------------------------------------------------
CREATE TABLE `tools` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(60) NOT NULL,
  `pricing_type` ENUM('free_community', 'daily_rate', 'hourly_rate') NOT NULL DEFAULT 'free_community',
  `daily_rate` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `hourly_rate` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `condition` ENUM('pristine', 'good', 'fair', 'heavy_duty') NOT NULL DEFAULT 'good',
  `brand` VARCHAR(80) NULL,
  `model_number` VARCHAR(100) NULL,
  `photo_urls` JSON NULL,
  `primary_photo_url` VARCHAR(500) NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `requires_admin_review` TINYINT(1) NOT NULL DEFAULT 0,
  `neighborhood` VARCHAR(100) NOT NULL,
  `latitude` DECIMAL(10,7) NOT NULL,
  `longitude` DECIMAL(10,7) NOT NULL,
  `location_point` POINT NOT NULL /*!80003 SRID 4326 */,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `tools_category_idx` (`category`),
  INDEX `tools_availability_idx` (`is_available`),
  INDEX `tools_owner_fk` (`owner_id`),
  SPATIAL INDEX `tools_spatial_idx` (`location_point`),
  CONSTRAINT `fk_tools_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table: rental_requests (Deterministic FSM State Machine)
-- ------------------------------------------------------------------------------
CREATE TABLE `rental_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tool_id` BIGINT UNSIGNED NOT NULL,
  `borrower_id` BIGINT UNSIGNED NOT NULL,
  `lender_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM(
    'requested',
    'payment_authorized',
    'active_rental',
    'pending_handover',
    'return_pending',
    'completed',
    'disputed',
    'cancelled'
  ) NOT NULL DEFAULT 'requested',
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `total_amount` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `deposit_held` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `pickup_pin_hash` VARCHAR(255) NULL,
  `return_pin_hash` VARCHAR(255) NULL,
  `handover_confirmed_at` TIMESTAMP NULL DEFAULT NULL,
  `return_confirmed_at` TIMESTAMP NULL DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `is_overdue` TINYINT(1) NOT NULL DEFAULT 0,
  `overdue_hours` INT UNSIGNED NOT NULL DEFAULT 0,
  `borrower_rating` TINYINT UNSIGNED NULL,
  `borrower_review` TEXT NULL,
  `lender_rating` TINYINT UNSIGNED NULL,
  `lender_review` TEXT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `rental_borrower_idx` (`borrower_id`, `status`),
  INDEX `rental_lender_idx` (`lender_id`, `status`),
  INDEX `rental_status_idx` (`status`),
  INDEX `rental_expires_idx` (`expires_at`),
  CONSTRAINT `fk_rentals_tool` FOREIGN KEY (`tool_id`) REFERENCES `tools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rentals_borrower` FOREIGN KEY (`borrower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rentals_lender` FOREIGN KEY (`lender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table: disputes
-- ------------------------------------------------------------------------------
CREATE TABLE `disputes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `rental_request_id` BIGINT UNSIGNED NOT NULL,
  `filed_by_id` BIGINT UNSIGNED NOT NULL,
  `against_user_id` BIGINT UNSIGNED NOT NULL,
  `reason` ENUM('late_return','equipment_damage','missing_accessories','incorrect_item','safety_hazard','no_show') NOT NULL,
  `description` TEXT NOT NULL,
  `evidence_photos` JSON NULL,
  `status` ENUM('open','under_investigation','resolved','escalated') NOT NULL DEFAULT 'open',
  `claimed_amount` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `awarded_amount` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `resolved_by_admin_id` BIGINT UNSIGNED NULL,
  `admin_notes` TEXT NULL,
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_disputes_rental` FOREIGN KEY (`rental_request_id`) REFERENCES `rental_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_disputes_filed_by` FOREIGN KEY (`filed_by_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_disputes_against` FOREIGN KEY (`against_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_disputes_admin` FOREIGN KEY (`resolved_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table: audit_logs
-- ------------------------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL,
  `event_type` VARCHAR(80) NOT NULL,
  `target_type` VARCHAR(80) NULL,
  `target_id` BIGINT UNSIGNED NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `payload` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `audit_event_idx` (`event_type`),
  INDEX `audit_user_idx` (`user_id`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Seed Initial Data: Users (Administrator with 2580 Security Clearance + Residents)
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `neighborhood`, `rating`, `rating_count`, `total_lent`, `total_borrowed`, `is_blacklisted`, `latitude`, `longitude`, `location`, `admin_security_hash`) VALUES
(1, 'Eleanor Cross', 'admin@oakridge.gov', '$2y$12$eOa98e.m5oIu/YwG1/2i8uE2mE95sN2m...', 'admin', 'District Civic Hub', 5.00, 124, 45, 8, 0, 37.7749000, -122.4194000, ST_SRID(POINT(-122.4194000, 37.7749000), 4326), '$2y$12$k8l7J9vU/qCg2uF.59z1Xe70wG4xT9l2Y8H1P0k9R7s5V3N2M1K0O'),
(2, 'Sarah Jenkins', 'sarah@example.com', '$2y$12$eOa98e.m5oIu/YwG1/2i8uE2mE95sN2m...', 'user', 'Oakridge North', 4.95, 38, 24, 6, 0, 37.7790000, -122.4150000, ST_SRID(POINT(-122.4150000, 37.7790000), 4326), NULL),
(3, 'Marcus Vance', 'marcus@example.com', '$2y$12$eOa98e.m5oIu/YwG1/2i8uE2mE95sN2m...', 'user', 'Oakridge South', 4.70, 19, 11, 14, 0, 37.7710000, -122.4230000, ST_SRID(POINT(-122.4230000, 37.7710000), 4326), NULL),
(4, 'Chloe Lin', 'chloe@example.com', '$2y$12$eOa98e.m5oIu/YwG1/2i8uE2mE95sN2m...', 'user', 'Highland Glen', 2.40, 5, 1, 4, 0, 37.7810000, -122.4080000, ST_SRID(POINT(-122.4080000, 37.7810000), 4326), NULL);

-- Seed Tools with Point Geometries
INSERT INTO `tools` (`id`, `owner_id`, `name`, `description`, `category`, `pricing_type`, `daily_rate`, `condition`, `brand`, `model_number`, `primary_photo_url`, `is_available`, `neighborhood`, `latitude`, `longitude`, `location_point`) VALUES
(1, 2, 'DeWalt SDS-Plus Rotary Hammer 1-1/8"', 'Heavy duty concrete drilling hammer. Includes SDS chisels and safety goggles.', 'rotary_hammer', 'daily_rate', 18.00, 'good', 'DeWalt', 'D25133K', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80', 1, 'Oakridge North', 37.7790000, -122.4150000, ST_SRID(POINT(-122.4150000, 37.7790000), 4326)),
(2, 3, 'Little Giant 22-Foot Multi-Position Ladder', 'Type 1AA 375 lb rated multi-use ladder. Converts to A-frame, extension, staircase.', 'ladder', 'free_community', 0.00, 'pristine', 'Little Giant', 'Velocity M22', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', 1, 'Oakridge South', 37.7710000, -122.4230000, ST_SRID(POINT(-122.4230000, 37.7710000), 4326)),
(3, 2, 'Sun Joe SPX3000 Electric Pressure Washer', '2030 Max PSI 1.76 GPM with Dual Soap Tanks. Perfect for patios and house siding.', 'pressure_washer', 'daily_rate', 22.00, 'good', 'Sun Joe', 'SPX3000', 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=800&q=80', 1, 'Oakridge North', 37.7790000, -122.4150000, ST_SRID(POINT(-122.4150000, 37.7790000), 4326));

-- Seed Active Rental with PINs
INSERT INTO `rental_requests` (`id`, `tool_id`, `borrower_id`, `lender_id`, `status`, `start_date`, `end_date`, `total_amount`, `pickup_pin_hash`, `return_pin_hash`, `handover_confirmed_at`) VALUES
(1, 1, 3, 2, 'active_rental', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 36.00, '$2y$12$pickupPinHash...', '$2y$12$returnPinHash...', NOW());
