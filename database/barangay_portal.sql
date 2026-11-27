-- Barangay San Miguel Report and Request Portal
-- XAMPP / MariaDB / MySQL Importable Schema

CREATE DATABASE IF NOT EXISTS `barangay_portal`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `barangay_portal`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `role` ENUM('resident', 'staff') NOT NULL,
  `full_name` VARCHAR(160) NOT NULL,
  `email` VARCHAR(190) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `purok` VARCHAR(100) NOT NULL DEFAULT '',
  `address` VARCHAR(255) NOT NULL DEFAULT '',
  `phone` VARCHAR(40) NOT NULL DEFAULT '',
  `official_title` VARCHAR(120) NOT NULL DEFAULT '',
  `created_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `submissions` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `reference_number` VARCHAR(40) NOT NULL UNIQUE,
  `kind` ENUM('issue', 'service') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(120) NOT NULL,
  `purok` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `urgency` ENUM('Low', 'Medium', 'High') NULL,
  `photo_data_url` MEDIUMTEXT NULL,
  `photo_name` VARCHAR(255) NULL,
  `purpose` VARCHAR(255) NULL,
  `preferred_pickup_date` VARCHAR(20) NULL,
  `resident_id` VARCHAR(64) NOT NULL,
  `resident_name` VARCHAR(160) NOT NULL,
  `resident_contact` VARCHAR(40) NOT NULL,
  `status` ENUM('Received', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Received',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  INDEX `idx_submissions_status` (`status`),
  INDEX `idx_submissions_resident` (`resident_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `submission_remarks` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `submission_id` VARCHAR(64) NOT NULL,
  `timestamp` DATETIME NOT NULL,
  `status` ENUM('Received', 'In Progress', 'Resolved') NOT NULL,
  `author_name` VARCHAR(160) NOT NULL,
  `author_role` VARCHAR(120) NOT NULL,
  `note` TEXT NOT NULL,
  `photo_data_url` MEDIUMTEXT NULL,
  `photo_name` VARCHAR(255) NULL,
  INDEX `idx_remarks_submission` (`submission_id`),
  CONSTRAINT `fk_remarks_submission`
    FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
