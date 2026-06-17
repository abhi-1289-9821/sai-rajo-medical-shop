-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS `medistore_db`;
USE `medistore_db`;

-- Table structure for table `admins`
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for table `orders`
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `customer_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `address` TEXT NOT NULL,
  `medicines_requested` TEXT NOT NULL,
  `prescription_url` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('pending', 'accepted', 'rejected', 'delivered') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (`status`),
  INDEX idx_created_at (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
