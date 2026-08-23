-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 23, 2026 at 11:51 PM
-- Server version: 8.0.44-cll-lve
-- PHP Version: 8.4.24

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mylogo_poligrafiya`
--
CREATE DATABASE IF NOT EXISTS `mylogo_poligrafiya` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `mylogo_poligrafiya`;

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity` varchar(50) DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `audit_log`
--

INSERT INTO `audit_log` (`id`, `user_id`, `action`, `entity`, `entity_id`, `detail`, `created_at`) VALUES
(1, 1, 'login', 'user', 1, 'IP: 83.221.173.158', '2026-08-23 21:59:02'),
(2, 1, 'update', 'user', 1, 'admin (admin)', '2026-08-23 22:21:57'),
(3, 1, 'create', 'user', 2, 'komila (menejer)', '2026-08-23 22:22:25'),
(4, 1, 'create', 'user', 3, 'zoxidjon (admin)', '2026-08-23 22:22:42'),
(5, 1, 'update', 'user', 3, 'zoxidjon (xarajatchi)', '2026-08-23 22:22:49'),
(6, 2, 'login', 'user', 2, 'IP: 83.221.173.158', '2026-08-23 22:45:41'),
(7, 2, 'create', 'client', 1, 'Odil aka Mahalla uyushmasi', '2026-08-23 22:46:21'),
(8, 2, 'create', 'order', 1, 'B-2026-0001 yaratildi', '2026-08-23 22:51:25'),
(9, 3, 'login', 'user', 3, 'IP: 83.221.173.158', '2026-08-23 23:00:39');

-- --------------------------------------------------------

--
-- Table structure for table `client`
--

CREATE TABLE `client` (
  `id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `client`
--

INSERT INTO `client` (`id`, `name`, `phone`, `address`, `notes`, `created_at`, `is_deleted`, `deleted_at`) VALUES
(1, 'Odil aka Mahalla uyushmasi', '+9989012345678', 'Istiqlol 15', '', '2026-08-23 22:46:21', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `company_settings`
--

CREATE TABLE `company_settings` (
  `id` int NOT NULL,
  `name` varchar(200) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(100) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `tax_id` varchar(50) DEFAULT NULL,
  `bank_name` varchar(200) DEFAULT NULL,
  `bank_account` varchar(50) DEFAULT NULL,
  `bank_mfo` varchar(20) DEFAULT NULL,
  `invoice_note` varchar(500) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `company_settings`
--

INSERT INTO `company_settings` (`id`, `name`, `address`, `phone`, `email`, `tax_id`, `bank_name`, `bank_account`, `bank_mfo`, `invoice_note`, `updated_at`) VALUES
(1, 'Poligrafiya xizmati', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-23 22:21:30');

-- --------------------------------------------------------

--
-- Table structure for table `expense`
--

CREATE TABLE `expense` (
  `id` int NOT NULL,
  `category` varchar(50) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_attempt`
--

CREATE TABLE `login_attempt` (
  `id` int NOT NULL,
  `username` varchar(80) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order`
--

CREATE TABLE `order` (
  `id` int NOT NULL,
  `order_number` varchar(20) NOT NULL,
  `client_id` int NOT NULL,
  `order_type` varchar(100) DEFAULT NULL,
  `description` text,
  `quantity` int DEFAULT NULL,
  `unit_price` decimal(14,2) DEFAULT NULL,
  `total_price` decimal(14,2) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `deadline` date DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `version` int NOT NULL,
  `is_deleted` tinyint(1) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order`
--

INSERT INTO `order` (`id`, `order_number`, `client_id`, `order_type`, `description`, `quantity`, `unit_price`, `total_price`, `status`, `deadline`, `created_at`, `updated_at`, `created_by`, `version`, `is_deleted`, `deleted_at`, `deleted_by`) VALUES
(1, 'B-2026-0001', 1, 'dfdsfdsf', 'dsfdsfsd', 1, 50000.00, 50000.00, 'yangi', NULL, '2026-08-23 22:51:25', '2026-08-23 22:51:25', 2, 1, 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_file`
--

CREATE TABLE `order_file` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `size_bytes` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_type`
--

CREATE TABLE `order_type` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `default_price` decimal(14,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_type`
--

INSERT INTO `order_type` (`id`, `name`, `unit`, `default_price`, `is_active`, `created_at`) VALUES
(1, 'Vizitka', 'dona', 150.00, 1, '2026-08-23 21:31:55'),
(2, 'Banner', 'm²', 35000.00, 1, '2026-08-23 21:31:55'),
(3, 'Buklet A4', 'dona', 2000.00, 1, '2026-08-23 21:31:55'),
(4, 'Plakat A2', 'dona', 50000.00, 1, '2026-08-23 21:31:55'),
(5, 'Taqvim a6', 'dona', 1500.00, 1, '2026-08-23 21:31:55'),
(6, 'Flayer', 'dona', 400.00, 1, '2026-08-23 21:31:55'),
(7, 'Taklifnoma', 'dona', 45000.00, 1, '2026-08-23 21:31:55'),
(8, 'Naklekya (stiker)', 'dona', 800.00, 1, '2026-08-23 21:31:55');

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `paid_on` date NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `telegram_settings`
--

CREATE TABLE `telegram_settings` (
  `id` int NOT NULL,
  `is_enabled` tinyint(1) NOT NULL,
  `bot_token` varchar(200) DEFAULT NULL,
  `manager_chat_id` varchar(50) DEFAULT NULL,
  `notify_new_order` tinyint(1) NOT NULL,
  `notify_payment` tinyint(1) NOT NULL,
  `notify_daily` tinyint(1) NOT NULL,
  `last_daily_sent` date DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `telegram_settings`
--

INSERT INTO `telegram_settings` (`id`, `is_enabled`, `bot_token`, `manager_chat_id`, `notify_new_order`, `notify_payment`, `notify_daily`, `last_daily_sent`, `updated_at`) VALUES
(1, 0, NULL, NULL, 1, 0, 1, NULL, '2026-08-23 22:51:25');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int NOT NULL,
  `username` varchar(80) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(120) DEFAULT NULL,
  `role` varchar(20) NOT NULL,
  `is_active_user` tinyint(1) NOT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `username`, `password_hash`, `full_name`, `role`, `is_active_user`, `created_at`) VALUES
(1, 'admin', 'scrypt:32768:8:1$N1ltnYYUS8i9y7CT$45e83c6ad4d89c3bdd569e7ca81fe5266b1278d656a6a7291d4fcd620e5282c094eb662fb6ab791a2ee51997a50b54e1103b3720cccbeb288c8653f98ef0ddf3', 'Administrator', 'admin', 1, '2026-08-23 21:31:55'),
(2, 'komila', 'scrypt:32768:8:1$EyPL9YcNstUdcwpy$98d5609c85a1303060d3e228afc4417f1282bb7146d779b6d8fef69a5c412f0f56e4b349783da145ff7712b67705746bffaa5ddff6b26c31482b017cef6fd0ad', 'Komila XXX', 'menejer', 1, '2026-08-23 22:22:25'),
(3, 'zoxidjon', 'scrypt:32768:8:1$YJSzHKsWoRMfTgqb$90198ba0e19ac356b3347d33101eb71b736e08b7d9cd7dd087f75c79e833dacaef62fdc3043f3e968f0dcf3fe1e4046b750bdaf1842b34d13565d4ded6b64c10', 'Ergashev Zoxidjon', 'xarajatchi', 1, '2026-08-23 22:22:42');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_audit_log_created_at` (`created_at`),
  ADD KEY `ix_audit_log_user_id` (`user_id`);

--
-- Indexes for table `client`
--
ALTER TABLE `client`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_client_is_deleted` (`is_deleted`),
  ADD KEY `ix_client_name` (`name`);

--
-- Indexes for table `company_settings`
--
ALTER TABLE `company_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `expense`
--
ALTER TABLE `expense`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `ix_expense_category` (`category`),
  ADD KEY `ix_expense_date` (`date`);

--
-- Indexes for table `login_attempt`
--
ALTER TABLE `login_attempt`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_login_attempt_created_at` (`created_at`),
  ADD KEY `ix_login_attempt_username` (`username`),
  ADD KEY `ix_login_attempt_ip_address` (`ip_address`);

--
-- Indexes for table `order`
--
ALTER TABLE `order`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_order_order_number` (`order_number`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `deleted_by` (`deleted_by`),
  ADD KEY `ix_order_deadline` (`deadline`),
  ADD KEY `ix_order_client_id` (`client_id`),
  ADD KEY `ix_order_is_deleted` (`is_deleted`),
  ADD KEY `ix_order_status` (`status`),
  ADD KEY `ix_order_created_at` (`created_at`);

--
-- Indexes for table `order_file`
--
ALTER TABLE `order_file`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `ix_order_file_order_id` (`order_id`);

--
-- Indexes for table `order_type`
--
ALTER TABLE `order_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `ix_payment_order_id` (`order_id`),
  ADD KEY `ix_payment_paid_on` (`paid_on`);

--
-- Indexes for table `telegram_settings`
--
ALTER TABLE `telegram_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_user_username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `client`
--
ALTER TABLE `client`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `company_settings`
--
ALTER TABLE `company_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `expense`
--
ALTER TABLE `expense`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login_attempt`
--
ALTER TABLE `login_attempt`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `order`
--
ALTER TABLE `order`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order_file`
--
ALTER TABLE `order_file`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_type`
--
ALTER TABLE `order_type`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `telegram_settings`
--
ALTER TABLE `telegram_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

--
-- Constraints for table `expense`
--
ALTER TABLE `expense`
  ADD CONSTRAINT `expense_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

--
-- Constraints for table `order`
--
ALTER TABLE `order`
  ADD CONSTRAINT `order_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`),
  ADD CONSTRAINT `order_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `order_ibfk_3` FOREIGN KEY (`deleted_by`) REFERENCES `user` (`id`);

--
-- Constraints for table `order_file`
--
ALTER TABLE `order_file`
  ADD CONSTRAINT `order_file_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`),
  ADD CONSTRAINT `order_file_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`),
  ADD CONSTRAINT `payment_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
