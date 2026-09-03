-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 03, 2026 at 11:30 PM
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
(6, NULL, 'login', 'user', 2, 'IP: 83.221.173.158', '2026-08-23 22:45:41'),
(7, NULL, 'create', 'client', 1, 'Odil aka Mahalla uyushmasi', '2026-08-23 22:46:21'),
(8, NULL, 'create', 'order', 1, 'B-2026-0001 yaratildi', '2026-08-23 22:51:25'),
(9, NULL, 'login', 'user', 3, 'IP: 83.221.173.158', '2026-08-23 23:00:39'),
(10, 1, 'login', 'user', 1, 'IP: 83.221.171.253', '2026-08-28 01:50:41'),
(11, 1, 'update', 'user', 1, 'admin (admin)', '2026-08-28 01:51:16'),
(12, 1, 'update', 'user', 2, 'komila (menejer)', '2026-08-28 01:51:29'),
(13, 1, 'update', 'user', 2, 'komila (menejer)', '2026-08-28 01:51:42'),
(14, 1, 'update', 'user', 3, 'zoxidjon (xarajatchi)', '2026-08-28 01:51:55'),
(15, 1, 'create', 'user', 4, 'husniddin (boss)', '2026-08-28 01:52:17'),
(16, 1, 'login', 'user', 1, 'IP: 83.221.171.253', '2026-08-28 03:09:46'),
(17, 1, 'login', 'user', 1, 'IP: 83.221.171.253', '2026-08-28 03:24:46'),
(18, 1, 'login', 'user', 1, 'IP: 90.156.194.93', '2026-08-28 11:51:26'),
(19, 1, 'update', 'telegram', 1, 'uzildi', '2026-08-28 11:54:14'),
(20, 1, 'toggle', 'order_type', 2, 'Banner', '2026-08-28 11:54:22'),
(21, 1, 'create', 'client', 2, 'Saipov Iskandar Dilmurodovich', '2026-08-28 20:13:05'),
(22, 1, 'create', 'order', 2, 'B-2026-0002 yaratildi (2 qator)', '2026-08-28 20:14:03'),
(23, 1, 'status', 'order', 2, 'buyurtma yaratildi -> to\'lov qilish jarayonida', '2026-08-28 20:14:19'),
(24, 1, 'status', 'order', 2, 'to\'lov qilish jarayonida -> dizayn jarayonida', '2026-08-28 20:14:30'),
(25, 1, 'status', 'order', 2, 'dizayn jarayonida -> ishlab chiqarishda', '2026-08-28 20:14:42'),
(26, 1, 'status', 'order', 2, 'ishlab chiqarishda -> yetkazish uchun tayyor', '2026-08-28 20:14:43'),
(27, 1, 'status', 'order', 2, 'yetkazish uchun tayyor -> maxsulot yetkazildi', '2026-08-28 20:14:44'),
(28, 1, 'payment', 'order', 2, '3300000.00 so\'m to\'lov', '2026-08-28 20:15:30'),
(29, 1, 'create', 'material', 1, 'Konvert', '2026-08-28 20:19:47'),
(30, 1, 'create', 'supplier', 1, 'Alzuben', '2026-08-28 20:19:47'),
(31, 1, 'create', 'stock_in', 1, 'Konvert +100 dona (Alzuben)', '2026-08-28 20:19:47'),
(32, NULL, 'login', 'user', 4, 'IP: 90.156.194.93', '2026-08-28 20:31:08'),
(33, NULL, 'login', 'user', 2, 'IP: 90.156.194.93', '2026-08-28 20:34:13'),
(34, 1, 'login', 'user', 1, 'IP: 90.156.194.93', '2026-08-28 20:48:26'),
(35, NULL, 'login', 'user', 3, 'IP: 90.156.194.93', '2026-08-28 20:48:59'),
(36, 1, 'login', 'user', 1, 'IP: 90.156.194.93', '2026-08-29 18:21:09'),
(37, 1, 'login', 'user', 1, 'IP: 90.156.194.93', '2026-08-29 18:44:47'),
(38, 1, 'login', 'user', 1, 'IP: 90.156.194.93', '2026-08-29 18:46:27'),
(39, 1, 'login', 'user', 1, 'IP: 90.156.194.93', '2026-08-29 18:47:12'),
(40, 1, 'update', 'user', 4, 'husniddin (boss)', '2026-08-29 18:47:30'),
(41, NULL, 'login', 'user', 4, 'IP: 90.156.194.93', '2026-08-29 18:47:42'),
(42, 1, 'login', 'user', 1, 'IP: 90.156.194.93', '2026-08-29 18:51:33'),
(43, 1, 'delete', 'user', 2, 'komila butunlay o\'chirildi', '2026-08-29 18:51:43'),
(44, 1, 'delete', 'user', 3, 'zoxidjon butunlay o\'chirildi', '2026-08-29 18:51:47'),
(45, 1, 'create', 'user', 5, 'zoxidjon (admin)', '2026-08-29 18:52:04'),
(46, 1, 'update', 'user', 5, 'zoxidjon (xarajatchi)', '2026-08-29 18:52:18'),
(47, 1, 'create', 'user', 6, 'menejer1 (admin)', '2026-08-29 18:53:04'),
(48, 1, 'update', 'user', 6, 'menejer1 (menejer)', '2026-08-29 18:53:13'),
(49, 1, 'create', 'user', 7, 'menejer2 (admin)', '2026-08-29 18:53:40'),
(50, 1, 'update', 'user', 7, 'menejer2 (menejer)', '2026-08-29 18:53:52'),
(51, NULL, 'login', 'user', 7, 'IP: 90.156.194.93', '2026-08-29 18:54:09'),
(52, NULL, 'login', 'user', 6, 'IP: 90.156.194.93', '2026-08-29 18:54:58'),
(53, NULL, 'login', 'user', 7, 'IP: 90.156.194.93', '2026-08-29 18:55:25'),
(54, NULL, 'login', 'user', 6, 'IP: 90.156.194.93', '2026-08-29 18:55:48'),
(55, NULL, 'login', 'user', 5, 'IP: 90.156.194.93', '2026-08-29 19:10:30'),
(56, NULL, 'login', 'user', 5, 'IP: 90.156.194.93', '2026-08-29 19:19:20'),
(57, 1, 'login', 'user', 1, 'IP: 90.156.194.93', '2026-08-29 19:19:34'),
(58, 1, 'create', 'employee', 1, 'Temur aka', '2026-08-29 19:19:56'),
(59, 1, 'login', 'user', 1, 'IP: 83.221.172.235', '2026-08-29 21:10:24'),
(60, 1, 'delete', 'user', 4, 'husniddin butunlay o\'chirildi', '2026-08-29 21:11:06'),
(61, 1, 'delete', 'user', 6, 'menejer1 butunlay o\'chirildi', '2026-08-29 21:11:09'),
(62, 1, 'delete', 'user', 7, 'menejer2 butunlay o\'chirildi', '2026-08-29 21:11:10'),
(63, 1, 'delete', 'user', 5, 'zoxidjon butunlay o\'chirildi', '2026-08-29 21:11:13'),
(64, 1, 'create', 'user', 8, 'Zoxidjon (xarajatchi)', '2026-08-29 21:11:35'),
(65, 1, 'create', 'user', 9, 'husniddin (boss)', '2026-08-29 21:12:07'),
(66, 1, 'create', 'user', 10, 'menejer1 (menejer)', '2026-08-29 21:12:41'),
(67, 1, 'create', 'user', 11, 'menejer2 (menejer)', '2026-08-29 21:13:04'),
(68, 11, 'login', 'user', 11, 'IP: 83.221.172.235', '2026-08-29 21:57:49'),
(69, 11, 'login', 'user', 11, 'IP: 83.221.172.235', '2026-08-30 01:53:21'),
(70, 11, 'login', 'user', 11, 'IP: 83.221.172.235', '2026-08-30 14:08:08'),
(71, 11, 'login', 'user', 11, 'IP: 83.221.172.235', '2026-08-30 14:18:15'),
(72, 8, 'login', 'user', 8, 'IP: 83.221.172.235', '2026-08-30 14:18:28'),
(73, 8, 'create', 'supplier', 2, 'Effect Print MChJ', '2026-08-30 20:37:27'),
(74, 8, 'update', 'supplier', 1, 'Alzuben', '2026-08-30 20:38:05'),
(75, 8, 'create', 'supplier', 3, 'Reykachi aka', '2026-08-30 20:38:41'),
(76, 8, 'create', 'supplier', 4, 'USN', '2026-08-30 20:38:59'),
(77, 8, 'create', 'supplier', 5, 'Norbek aka Reklama', '2026-08-30 20:39:18'),
(78, 8, 'create', 'supplier', 6, 'Deli kanstova', '2026-08-30 20:39:42'),
(79, 8, 'create', 'supplier', 7, 'Verbattom OUT', '2026-08-30 20:40:03'),
(80, 8, 'create', 'supplier', 8, 'Maruf aka reklama', '2026-08-30 20:40:23'),
(81, 8, 'create', 'supplier', 9, 'DTF STAR', '2026-08-30 20:40:42'),
(82, 8, 'create', 'supplier', 10, 'Marvan Kanstovar', '2026-08-30 20:41:00'),
(83, 8, 'create', 'supplier', 11, 'Murodaka Kanstova', '2026-08-30 20:41:23'),
(84, 8, 'create', 'supplier', 12, 'Diary kanstovar', '2026-08-30 20:41:39'),
(85, 8, 'create', 'supplier', 13, 'Victus service mchj', '2026-08-30 20:42:02'),
(86, 8, 'create', 'supplier', 14, 'Ramka berezia oloybozor', '2026-08-30 20:42:29'),
(87, 8, 'create', 'supplier', 15, 'Avanta Trade MChJ', '2026-08-30 20:42:49'),
(88, 8, 'create', 'supplier', 16, 'Fresh Print', '2026-08-30 20:43:04'),
(89, 8, 'create', 'supplier', 17, 'Humo ART', '2026-08-30 20:43:25'),
(90, 8, 'create', 'supplier', 18, 'Politex Design', '2026-08-30 20:43:52'),
(91, 8, 'create', 'supplier', 19, 'Green Code Laser', '2026-08-30 20:44:08'),
(92, 8, 'create', 'supplier', 20, 'NUR reklama magazin', '2026-08-30 20:44:29'),
(93, 8, 'create', 'supplier', 21, 'NAR reklama magazin', '2026-08-30 20:44:45'),
(94, 8, 'create', 'supplier', 22, 'Innavatsion Print', '2026-08-30 20:45:06'),
(95, 8, 'create', 'supplier', 23, 'ColorPack MChJ', '2026-08-30 20:45:22'),
(96, 8, 'create', 'supplier', 24, 'Shoxjaxon kanstovar', '2026-08-30 20:46:10'),
(97, 8, 'create', 'supplier', 25, 'Premer Print MChH', '2026-08-30 20:46:32'),
(98, 8, 'create', 'supplier', 26, 'KEDR Akmal aka Kanstovar', '2026-08-30 20:46:52'),
(99, 8, 'create', 'supplier', 27, 'AliPrint MChJ', '2026-08-30 20:47:10'),
(100, 8, 'create', 'supplier', 28, 'Gulnara opa Papka Kanstovar', '2026-08-30 20:47:48'),
(101, 8, 'create', 'supplier', 29, 'Javlon aka Xozmag', '2026-08-30 20:48:08'),
(102, 8, 'create', 'supplier', 30, 'Dunyo Bayroqlari', '2026-08-30 20:48:24'),
(103, 8, 'create', 'supplier', 31, 'ArialMax MCHJ', '2026-08-30 20:48:47'),
(104, 8, 'create', 'supplier', 32, 'Tohir aka Sumka', '2026-08-30 20:49:13'),
(105, 8, 'create', 'supplier', 33, 'Vadim aka Tisneniya', '2026-08-30 20:49:29'),
(106, 8, 'create', 'supplier', 34, 'ArtCover', '2026-08-30 20:49:50'),
(107, 8, 'create', 'supplier', 35, 'AutoCAD', '2026-08-30 20:50:03'),
(108, 8, 'create', 'supplier', 36, 'Berezia G\'uncha', '2026-08-30 20:50:21'),
(109, 8, 'create', 'supplier', 37, 'Status Shop', '2026-08-30 20:50:43'),
(110, 8, 'create', 'supplier', 38, 'Lola Opa Textile', '2026-08-30 20:51:04'),
(111, 8, 'create', 'supplier', 39, 'Oleg Klishe', '2026-08-30 20:51:22'),
(112, 8, 'create', 'supplier', 40, 'O\'tkir aka Global Print', '2026-08-30 20:51:42'),
(113, 8, 'create', 'supplier', 41, 'Abror Print', '2026-08-30 20:51:56'),
(114, 8, 'create', 'supplier', 42, 'Temur Vibr lak', '2026-08-30 20:52:16'),
(115, 8, 'create', 'supplier', 43, 'Basico', '2026-08-30 20:52:31'),
(116, 8, 'create', 'supplier', 44, 'Anvar aka o\'rikzor termos', '2026-08-30 20:52:56'),
(117, 8, 'login', 'user', 8, 'IP: 83.221.186.172', '2026-08-30 20:53:46'),
(118, 10, 'login', 'user', 10, 'IP: 83.221.186.172', '2026-08-30 20:55:41'),
(119, 1, 'login', 'user', 1, 'IP: 83.221.186.172', '2026-08-30 20:57:31'),
(120, 1, 'payment_delete', 'order', 2, '3300000.00 so\'m to\'lov o\'chirildi', '2026-08-30 20:57:57'),
(121, 1, 'delete', 'order', 2, 'B-2026-0002 o\'chirildi', '2026-08-30 20:58:00'),
(122, 1, 'create', 'client', 3, 'Sherzod aka', '2026-08-30 20:59:36'),
(123, 1, 'update', 'client', 1, 'Odil aka Mahalla uyushmasi', '2026-08-30 21:00:11'),
(124, 1, 'update', 'client', 2, 'Asad aka', '2026-08-30 21:00:56'),
(125, 1, 'update', 'client', 1, 'Odil aka', '2026-08-30 21:01:35'),
(126, 1, 'create', 'client', 4, 'Kamolliddin aka', '2026-08-30 21:02:08'),
(127, 1, 'create', 'client', 5, 'Orif aka', '2026-08-30 21:02:39'),
(128, 1, 'login', 'user', 1, 'IP: 90.156.194.93', '2026-09-01 11:21:34'),
(129, 10, 'login', 'user', 10, 'IP: 90.156.194.93', '2026-09-01 11:22:14'),
(130, 10, 'create', 'client', 6, 'safdsjhkj (pipeline orqali)', '2026-09-01 11:22:46'),
(131, 10, 'create', 'client_pipeline_card', 1, 'Komila Ahmedova: safdsjhkj kartasi ochildi', '2026-09-01 11:22:46'),
(132, 10, 'update', 'client_pipeline_card', 1, 'Komila Ahmedova: safdsjhkj -> Taklif yuborish kutilmoqda', '2026-09-01 11:23:04'),
(133, 10, 'update', 'client_pipeline_card', 1, 'Komila Ahmedova: safdsjhkj -> Taklifni qabul qilish kutilmoqda', '2026-09-01 11:23:07'),
(134, 10, 'update', 'client_pipeline_card', 1, 'Komila Ahmedova: safdsjhkj -> Muvaffaqiyatli', '2026-09-01 11:23:10'),
(135, 9, 'login', 'user', 9, 'IP: 90.156.194.93', '2026-09-01 11:23:44'),
(136, 10, 'login', 'user', 10, 'IP: 90.156.194.93', '2026-09-02 10:30:46'),
(137, 10, 'create', 'client', 7, 'Zoxidaka', '2026-09-02 10:41:42'),
(138, 10, 'create', 'client_pipeline_card', 2, 'Komila Ahmedova: Zoxidaka kartasi ochildi', '2026-09-02 10:45:43'),
(139, 10, 'update', 'client_pipeline_card', 2, 'Komila Ahmedova: Zoxidaka — izoh qo\'shildi', '2026-09-02 10:46:07'),
(140, 10, 'update', 'client_pipeline_card', 2, 'Komila Ahmedova: Zoxidaka -> Taklif yuborish kutilmoqda', '2026-09-02 10:46:21'),
(141, 10, 'update', 'client_pipeline_card', 2, 'Komila Ahmedova: Zoxidaka -> Taklifni qabul qilish kutilmoqda', '2026-09-02 10:47:59'),
(142, 10, 'update', 'client_pipeline_card', 2, 'Komila Ahmedova: Zoxidaka -> Muvaffaqiyatli', '2026-09-02 10:48:17'),
(143, 10, 'update', 'client_pipeline_card', 2, 'Komila Ahmedova: Zoxidaka -> Taklif yuborish kutilmoqda', '2026-09-02 10:49:12'),
(144, 10, 'update', 'client_pipeline_card', 2, 'Komila Ahmedova: Zoxidaka -> Taklifni qabul qilish kutilmoqda', '2026-09-02 10:49:32'),
(145, 10, 'update', 'client_pipeline_card', 2, 'Komila Ahmedova: Zoxidaka -> Bekor qilindi', '2026-09-02 10:49:58'),
(146, 10, 'create', 'client', 8, 'Ulug\'bek muto (buyurtma orqali)', '2026-09-02 10:54:31'),
(147, 10, 'create', 'order', 3, 'B-2026-0003 yaratildi (4 qator)', '2026-09-02 10:54:31'),
(148, 10, 'payment', 'order', 3, '4000000.00 so\'m to\'lov', '2026-09-02 10:55:08'),
(149, 10, 'status', 'order', 3, 'buyurtma yaratildi -> to\'lov qilish jarayonida', '2026-09-02 10:55:41'),
(150, 10, 'status', 'order', 3, 'to\'lov qilish jarayonida -> dizayn jarayonida', '2026-09-02 10:55:55'),
(151, 8, 'login', 'user', 8, 'IP: 90.156.194.93', '2026-09-02 10:58:25'),
(152, 1, 'login', 'user', 1, 'IP: 90.156.194.93', '2026-09-02 11:02:44'),
(153, 10, 'login', 'user', 10, 'IP: 90.156.194.93', '2026-09-02 11:03:34'),
(154, 10, 'login', 'user', 10, 'IP: 90.156.194.93', '2026-09-02 11:03:34'),
(155, 1, 'create', 'user', 12, 'menejer (menejer)', '2026-09-02 11:04:00'),
(156, 1, 'delete', 'user', 12, 'menejer butunlay o\'chirildi', '2026-09-02 11:04:29'),
(157, 1, 'create', 'user', 13, 'menejer3 (menejer)', '2026-09-02 11:04:48'),
(158, 1, 'create', 'user', 14, 'menejer4 (menejer)', '2026-09-02 11:06:18'),
(159, 1, 'delete', 'client_pipeline_card', 1, 'Komila Ahmedova: safdsjhkj kartasi o\'chirildi', '2026-09-02 11:07:11'),
(160, 1, 'delete', 'client_pipeline_card', 2, 'Komila Ahmedova: Zoxidaka kartasi o\'chirildi', '2026-09-02 11:07:19'),
(161, 1, 'payment_delete', 'order', 3, '4000000.00 so\'m to\'lov o\'chirildi', '2026-09-02 11:08:10'),
(162, 1, 'delete', 'order', 3, 'B-2026-0003 o\'chirildi', '2026-09-02 11:08:12'),
(163, 1, 'delete', 'order', 1, 'B-2026-0001 o\'chirildi', '2026-09-02 11:08:16'),
(164, 13, 'login', 'user', 13, 'IP: 90.156.194.93', '2026-09-02 11:11:44'),
(165, 8, 'login', 'user', 8, 'IP: 90.156.194.93', '2026-09-02 11:47:34'),
(166, 14, 'login', 'user', 14, 'IP: 90.156.194.93', '2026-09-02 11:50:18'),
(167, 13, 'create', 'client', 9, 'Shaxzodjon (buyurtma orqali)', '2026-09-02 11:55:41'),
(168, 13, 'create', 'order', 4, 'B-2026-0004 yaratildi (1 qator)', '2026-09-02 11:55:41'),
(169, 14, 'login', 'user', 14, 'IP: 90.156.194.93', '2026-09-02 11:57:24'),
(170, 13, 'login', 'user', 13, 'IP: 90.156.194.93', '2026-09-02 11:57:55'),
(171, 14, 'login', 'user', 14, 'IP: 90.156.194.93', '2026-09-02 11:58:11'),
(172, 13, 'create', 'client', 10, 'Anastasiya (buyurtma orqali)', '2026-09-02 11:59:06'),
(173, 13, 'create', 'order', 5, 'B-2026-0005 yaratildi (1 qator)', '2026-09-02 11:59:06'),
(174, 14, 'create', 'client', 11, 'Ulug\'bek mutola (buyurtma orqali)', '2026-09-02 12:02:18'),
(175, 14, 'create', 'order', 6, 'B-2026-0006 yaratildi (2 qator)', '2026-09-02 12:02:18'),
(176, 13, 'status', 'order', 5, 'buyurtma yaratildi -> to\'lov qilish jarayonida', '2026-09-02 12:03:46'),
(177, 13, 'payment', 'order', 5, '130000.00 so\'m to\'lov', '2026-09-02 12:04:13'),
(178, 14, 'payment', 'order', 6, '1300000.00 so\'m to\'lov', '2026-09-02 12:05:56'),
(179, 14, 'payment', 'order', 6, '1300000.00 so\'m to\'lov', '2026-09-02 12:05:56'),
(180, 14, 'status', 'order', 6, 'buyurtma yaratildi -> to\'lov qilish jarayonida', '2026-09-02 12:06:56'),
(181, 14, 'status', 'order', 6, 'to\'lov qilish jarayonida -> dizayn jarayonida', '2026-09-02 12:07:05'),
(182, 14, 'status', 'order', 6, 'dizayn jarayonida -> ishlab chiqarishda', '2026-09-02 12:07:06'),
(183, 13, 'file_upload', 'order', 5, 'photo_2026-09-02_12-04-02.jpg', '2026-09-02 12:07:15'),
(184, 14, 'status', 'order', 6, 'ishlab chiqarishda -> yetkazish uchun tayyor', '2026-09-02 12:07:23'),
(185, 13, 'payment', 'order', 5, '120000.00 so\'m to\'lov', '2026-09-02 12:07:31'),
(186, 13, 'status', 'order', 5, 'to\'lov qilish jarayonida -> dizayn jarayonida', '2026-09-02 12:07:52'),
(187, 13, 'status', 'order', 5, 'dizayn jarayonida -> ishlab chiqarishda', '2026-09-02 12:09:07'),
(188, 8, 'login', 'user', 8, 'IP: 90.156.194.93', '2026-09-02 12:10:23'),
(189, 1, 'login', 'user', 1, 'IP: 90.156.194.93', '2026-09-02 12:10:33'),
(190, 1, 'payment_delete', 'order', 6, '1300000.00 so\'m to\'lov o\'chirildi', '2026-09-02 12:10:42'),
(191, 8, 'login', 'user', 8, 'IP: 90.156.194.93', '2026-09-02 12:10:54'),
(192, 13, 'create', 'client_pipeline_card', 3, 'Mohinur Muhammadkarimova: Anastasiya kartasi ochildi', '2026-09-02 12:12:00'),
(193, 13, 'update', 'client_pipeline_card', 3, 'Mohinur Muhammadkarimova: Anastasiya -> Taklif yuborish kutilmoqda', '2026-09-02 12:18:19'),
(194, 13, 'update', 'client_pipeline_card', 3, 'Mohinur Muhammadkarimova: Anastasiya -> Taklifni qabul qilish kutilmoqda', '2026-09-02 12:18:25'),
(195, 13, 'update', 'client_pipeline_card', 3, 'Mohinur Muhammadkarimova: Anastasiya -> Muvaffaqiyatli', '2026-09-02 12:18:32'),
(196, 13, 'create', 'client_pipeline_card', 4, 'Mohinur Muhammadkarimova: Shaxzodjon kartasi ochildi', '2026-09-02 12:19:25'),
(197, 13, 'update', 'client_pipeline_card', 4, 'Mohinur Muhammadkarimova: Shaxzodjon -> Taklif yuborish kutilmoqda', '2026-09-02 12:20:22'),
(198, 13, 'update', 'client_pipeline_card', 4, 'Mohinur Muhammadkarimova: Shaxzodjon -> Taklifni qabul qilish kutilmoqda', '2026-09-02 12:20:27'),
(199, 13, 'create', 'client', 12, 'Bekzod Pulatov (pipeline orqali)', '2026-09-02 14:17:21'),
(200, 13, 'create', 'client_pipeline_card', 5, 'Mohinur Muhammadkarimova: Bekzod Pulatov kartasi ochildi', '2026-09-02 14:17:21'),
(201, 13, 'update', 'client_pipeline_card', 5, 'Mohinur Muhammadkarimova: Bekzod Pulatov -> Taklif yuborish kutilmoqda', '2026-09-02 14:17:57'),
(202, 13, 'update', 'client_pipeline_card', 5, 'Mohinur Muhammadkarimova: Bekzod Pulatov -> Taklifni qabul qilish kutilmoqda', '2026-09-02 14:18:35'),
(203, 13, 'create', 'client', 13, 'Muyassar (pipeline orqali)', '2026-09-02 14:56:35'),
(204, 13, 'create', 'client_pipeline_card', 6, 'Mohinur Muhammadkarimova: Muyassar kartasi ochildi', '2026-09-02 14:56:35'),
(205, 13, 'update', 'client_pipeline_card', 6, 'Mohinur Muhammadkarimova: Muyassar -> Taklif yuborish kutilmoqda', '2026-09-02 14:57:26'),
(206, 13, 'update', 'client_pipeline_card', 6, 'Mohinur Muhammadkarimova: Muyassar -> Taklifni qabul qilish kutilmoqda', '2026-09-02 14:57:28'),
(207, 14, 'create', 'client', 14, 'Shavkat (buyurtma orqali)', '2026-09-02 14:59:57'),
(208, 14, 'create', 'order', 7, 'B-2026-0007 yaratildi (1 qator)', '2026-09-02 14:59:57'),
(209, 14, 'status', 'order', 7, 'buyurtma yaratildi -> to\'lov qilish jarayonida', '2026-09-02 15:00:16'),
(210, 10, 'login', 'user', 10, 'IP: 90.156.194.93', '2026-09-02 15:00:27'),
(211, 10, 'create', 'client_pipeline_card', 7, 'Komila Ahmedova: Zoxidaka kartasi ochildi', '2026-09-02 15:04:25'),
(212, 10, 'delete', 'client_pipeline_card', 7, 'Komila Ahmedova: Zoxidaka kartasi o\'chirildi', '2026-09-02 15:05:27'),
(213, 10, 'create', 'order', 8, 'B-2026-0008 yaratildi (1 qator)', '2026-09-02 15:06:28'),
(214, 13, 'create', 'client', 15, 'Miraziz (pipeline orqali)', '2026-09-02 15:25:31'),
(215, 13, 'create', 'client_pipeline_card', 8, 'Mohinur Muhammadkarimova: Miraziz kartasi ochildi', '2026-09-02 15:25:31'),
(216, 13, 'update', 'client_pipeline_card', 8, 'Mohinur Muhammadkarimova: Miraziz -> Taklif yuborish kutilmoqda', '2026-09-02 15:25:39'),
(217, 13, 'update', 'client_pipeline_card', 8, 'Mohinur Muhammadkarimova: Miraziz -> Taklifni qabul qilish kutilmoqda', '2026-09-02 15:25:48'),
(218, 13, 'update', 'client_pipeline_card', 8, 'Mohinur Muhammadkarimova: Miraziz -> Muvaffaqiyatli', '2026-09-02 15:25:53'),
(219, 14, 'update', 'order', 7, 'B-2026-0007 tahrirlandi (1 qator)', '2026-09-02 15:27:42'),
(220, 13, 'create', 'client', 16, 'Azamat (pipeline orqali)', '2026-09-02 16:09:32'),
(221, 13, 'create', 'client_pipeline_card', 9, 'Mohinur Muhammadkarimova: Azamat kartasi ochildi', '2026-09-02 16:09:32'),
(222, 13, 'update', 'client_pipeline_card', 9, 'Mohinur Muhammadkarimova: Azamat -> Taklif yuborish kutilmoqda', '2026-09-02 16:09:40'),
(223, 13, 'update', 'client_pipeline_card', 9, 'Mohinur Muhammadkarimova: Azamat -> Taklifni qabul qilish kutilmoqda', '2026-09-02 16:09:47'),
(224, 13, 'update', 'client_pipeline_card', 4, 'Mohinur Muhammadkarimova: Shaxzodjon -> Muvaffaqiyatli', '2026-09-02 16:10:21'),
(225, 13, 'status', 'order', 4, 'buyurtma yaratildi -> to\'lov qilish jarayonida', '2026-09-02 16:10:40'),
(226, 13, 'login', 'user', 13, 'IP: 90.156.194.93', '2026-09-03 09:45:52'),
(227, 13, 'file_upload', 'order', 4, 'photo_2026-09-03_09-39-45.jpg', '2026-09-03 09:47:40'),
(228, 13, 'payment', 'order', 4, '130000.00 so\'m to\'lov', '2026-09-03 09:48:02'),
(229, 13, 'status', 'order', 4, 'to\'lov qilish jarayonida -> dizayn jarayonida', '2026-09-03 09:48:22'),
(230, 13, 'status', 'order', 4, 'dizayn jarayonida -> ishlab chiqarishda', '2026-09-03 09:52:29'),
(231, 13, 'status', 'order', 4, 'ishlab chiqarishda -> ishlab chiqarishda', '2026-09-03 09:52:30'),
(232, 10, 'create', 'client', 17, 'Jadvat (buyurtma orqali)', '2026-09-03 10:34:43'),
(233, 10, 'create', 'order', 9, 'B-2026-0009 yaratildi (1 qator)', '2026-09-03 10:34:43'),
(234, 13, 'create', 'client', 18, 'Malika (pipeline orqali)', '2026-09-03 10:47:06'),
(235, 13, 'create', 'client_pipeline_card', 10, 'Mohinur Muhammadkarimova: Malika kartasi ochildi', '2026-09-03 10:47:06'),
(236, 13, 'update', 'client_pipeline_card', 10, 'Mohinur Muhammadkarimova: Malika -> Taklif yuborish kutilmoqda', '2026-09-03 10:47:17'),
(237, 13, 'update', 'client_pipeline_card', 10, 'Mohinur Muhammadkarimova: Malika -> Taklifni qabul qilish kutilmoqda', '2026-09-03 10:47:20'),
(238, 10, 'create', 'client', 19, 'Андрей (buyurtma orqali)', '2026-09-03 11:21:09'),
(239, 10, 'create', 'order', 10, 'B-2026-0010 yaratildi (1 qator)', '2026-09-03 11:21:09'),
(240, 13, 'update', 'client_pipeline_card', 10, 'Mohinur Muhammadkarimova: Malika -> Bekor qilindi', '2026-09-03 11:23:12'),
(241, 10, 'payment', 'order', 8, '2800000.00 so\'m to\'lov', '2026-09-03 11:26:55'),
(242, 10, 'file_upload', 'order', 8, 'photo_2026-09-03_11-26-37.jpg', '2026-09-03 11:27:59'),
(243, 10, 'payment', 'order', 10, '200000.00 so\'m to\'lov', '2026-09-03 11:28:36'),
(244, 10, 'file_upload', 'order', 10, 'photo_2026-09-03_11-26-47.jpg', '2026-09-03 11:29:12'),
(245, 13, 'create', 'client', 20, 'Bahodir Yuldashev (pipeline orqali)', '2026-09-03 12:05:59'),
(246, 13, 'create', 'client_pipeline_card', 11, 'Mohinur Muhammadkarimova: Bahodir Yuldashev kartasi ochildi', '2026-09-03 12:05:59'),
(247, 13, 'update', 'client_pipeline_card', 11, 'Mohinur Muhammadkarimova: Bahodir Yuldashev -> Taklif yuborish kutilmoqda', '2026-09-03 12:06:08'),
(248, 13, 'update', 'client_pipeline_card', 11, 'Mohinur Muhammadkarimova: Bahodir Yuldashev -> Taklifni qabul qilish kutilmoqda', '2026-09-03 12:06:10'),
(249, 13, 'update', 'client_pipeline_card', 11, 'Mohinur Muhammadkarimova: Bahodir Yuldashev -> Bekor qilindi', '2026-09-03 12:06:58'),
(250, 10, 'create', 'client_pipeline_card', 12, 'Komila Ahmedova: Андрей kartasi ochildi', '2026-09-03 12:17:27'),
(251, 10, 'update', 'client_pipeline_card', 12, 'Komila Ahmedova: Андрей -> Taklifni qabul qilish kutilmoqda', '2026-09-03 12:17:37'),
(252, 10, 'update', 'client_pipeline_card', 12, 'Komila Ahmedova: Андрей — izoh qo\'shildi', '2026-09-03 12:17:53'),
(253, 10, 'create', 'client_pipeline_card', 13, 'Komila Ahmedova: Jadvat kartasi ochildi', '2026-09-03 12:18:22'),
(254, 10, 'update', 'client_pipeline_card', 13, 'Komila Ahmedova: Jadvat -> Taklifni qabul qilish kutilmoqda', '2026-09-03 12:18:56'),
(255, 10, 'update', 'client_pipeline_card', 13, 'Komila Ahmedova: Jadvat — izoh qo\'shildi', '2026-09-03 12:19:20'),
(256, 10, 'delete', 'client_pipeline_card', 13, 'Komila Ahmedova: Jadvat kartasi o\'chirildi', '2026-09-03 12:19:44'),
(257, 10, 'create', 'client_pipeline_card', 14, 'Komila Ahmedova: Jadvat kartasi ochildi', '2026-09-03 12:21:38'),
(258, 10, 'update', 'client_pipeline_card', 14, 'Komila Ahmedova: Jadvat — izoh qo\'shildi', '2026-09-03 12:21:49'),
(259, 10, 'update', 'client_pipeline_card', 14, 'Komila Ahmedova: Jadvat -> Taklifni qabul qilish kutilmoqda', '2026-09-03 12:21:57'),
(260, 10, 'create', 'client_pipeline_card', 15, 'Komila Ahmedova: Zoxidaka kartasi ochildi', '2026-09-03 12:23:47'),
(261, 10, 'update', 'client_pipeline_card', 15, 'Komila Ahmedova: Zoxidaka — izoh qo\'shildi', '2026-09-03 12:23:57'),
(262, 10, 'update', 'client_pipeline_card', 15, 'Komila Ahmedova: Zoxidaka -> Taklifni qabul qilish kutilmoqda', '2026-09-03 12:24:00'),
(263, 14, 'create', 'client', 21, 'Abduvoxid', '2026-09-03 13:26:55'),
(264, 14, 'create', 'order', 11, 'B-2026-0011 yaratildi (2 qator)', '2026-09-03 13:36:25'),
(265, 14, 'create', 'order', 12, 'B-2026-0012 yaratildi (2 qator)', '2026-09-03 13:36:25'),
(266, 1, 'login', 'user', 1, 'IP: 90.156.194.93', '2026-09-03 14:13:38'),
(267, 1, 'delete', 'order', 11, 'B-2026-0011 o\'chirildi', '2026-09-03 14:13:52'),
(268, 8, 'login', 'user', 8, 'IP: 90.156.194.93', '2026-09-03 14:19:29'),
(269, 13, 'status', 'order', 4, 'ishlab chiqarishda -> yetkazish uchun tayyor', '2026-09-03 14:23:03'),
(270, 13, 'status', 'order', 5, 'ishlab chiqarishda -> yetkazish uchun tayyor', '2026-09-03 14:23:13'),
(271, 1, 'login', 'user', 1, 'IP: 185.213.229.8', '2026-09-03 14:23:48'),
(272, 10, 'update', 'client_pipeline_card', 12, 'Komila Ahmedova: Андрей -> Muvaffaqiyatli', '2026-09-03 15:11:19'),
(273, 9, 'login', 'user', 9, 'IP: 90.156.194.93', '2026-09-03 15:44:09'),
(274, 13, 'status', 'order', 4, 'yetkazish uchun tayyor -> maxsulot yetkazildi', '2026-09-03 16:20:44'),
(275, 13, 'file_upload', 'order', 4, 'photo_2026-09-03_15-35-00.jpg', '2026-09-03 16:21:30'),
(276, 13, 'payment', 'order', 4, '120000.00 so\'m to\'lov', '2026-09-03 16:21:38'),
(277, 13, 'status', 'order', 5, 'yetkazish uchun tayyor -> maxsulot yetkazildi', '2026-09-03 16:21:47'),
(278, 13, 'create', 'client', 22, 'Dilafruz Avazbekovna (pipeline orqali)', '2026-09-03 16:53:05'),
(279, 13, 'create', 'client_pipeline_card', 16, 'Mohinur Muhammadkarimova: Dilafruz Avazbekovna kartasi ochildi', '2026-09-03 16:53:05'),
(280, 13, 'update', 'client_pipeline_card', 16, 'Mohinur Muhammadkarimova: Dilafruz Avazbekovna -> Taklif yuborish kutilmoqda', '2026-09-03 16:53:10'),
(281, 13, 'create', 'order', 13, 'B-2026-0013 yaratildi (4 qator)', '2026-09-03 17:58:31'),
(282, 13, 'update', 'client_pipeline_card', 5, 'Mohinur Muhammadkarimova: Bekzod Pulatov -> Muvaffaqiyatli', '2026-09-03 17:59:15'),
(283, 13, 'create', 'order', 14, 'B-2026-0014 yaratildi (5 qator)', '2026-09-03 18:02:45'),
(284, 8, 'login', 'user', 8, 'IP: 83.221.187.17', '2026-09-03 22:49:06'),
(285, 10, 'login', 'user', 10, 'IP: 83.221.187.17', '2026-09-03 22:49:15');

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
  `deleted_at` datetime DEFAULT NULL,
  `company` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `client`
--

INSERT INTO `client` (`id`, `name`, `phone`, `address`, `notes`, `created_at`, `is_deleted`, `deleted_at`, `company`) VALUES
(1, 'Odil aka', '+998 93 595 00 91', 'Istiqlol 15', '', '2026-08-23 22:46:21', 0, NULL, 'None Mahalla uyushmasi'),
(2, 'Asad aka', '+99899 990 11 01', '', '', '2026-08-28 20:13:05', 0, NULL, 'Shaxar hokimiyat'),
(3, 'Sherzod aka', '+99897 143 88 88', '', '', '2026-08-30 20:59:36', 0, NULL, 'UzAirways'),
(4, 'Kamolliddin aka', '+99890 038 26 14', '', '', '2026-08-30 21:02:08', 0, NULL, 'UzAuto'),
(5, 'Orif aka', '+99893 535 11 10', '', '', '2026-08-30 21:02:39', 0, NULL, 'Xalq Banki'),
(6, 'safdsjhkj', '54656', NULL, NULL, '2026-09-01 11:22:46', 0, NULL, '545'),
(7, 'Zoxidaka', '+98811334354', '', '', '2026-09-02 10:41:42', 0, NULL, ''),
(8, 'Ulug\'bek muto', '+998 88 600 88 00', NULL, NULL, '2026-09-02 10:54:31', 0, NULL, 'Mutola'),
(9, 'Shaxzodjon', '+998959677010', NULL, NULL, '2026-09-02 11:55:41', 0, NULL, 'Target consulting'),
(10, 'Anastasiya', '+380665475066', NULL, NULL, '2026-09-02 11:59:06', 0, NULL, 'AvtoMaktab'),
(11, 'Ulug\'bek mutola', '+998902538011', NULL, NULL, '2026-09-02 12:02:18', 0, NULL, 'Mutola'),
(12, 'Bekzod Pulatov', '+998903240304', NULL, NULL, '2026-09-02 14:17:21', 0, NULL, 'noma\'lum'),
(13, 'Muyassar', '+998970179091', NULL, NULL, '2026-09-02 14:56:35', 0, NULL, 'Ark hospital klinika'),
(14, 'Shavkat', '907269697', NULL, NULL, '2026-09-02 14:59:57', 0, NULL, ''),
(15, 'Miraziz', '+998938909059', NULL, NULL, '2026-09-02 15:25:31', 0, NULL, 'noma\'lum'),
(16, 'Azamat', '+9989630807', NULL, NULL, '2026-09-02 16:09:32', 0, NULL, '\"NBU\" Xorazm viloyati'),
(17, 'Jadvat', '+998 93 900 00 10', NULL, NULL, '2026-09-03 10:34:43', 0, NULL, 'ONE NET'),
(18, 'Malika', '+998909171257', NULL, NULL, '2026-09-03 10:47:06', 0, NULL, 'noma\'lum'),
(19, 'Андрей', '+998903296950', NULL, NULL, '2026-09-03 11:21:09', 0, NULL, 'VIDCOM'),
(20, 'Bahodir Yuldashev', '+998994041212', NULL, NULL, '2026-09-03 12:05:59', 0, NULL, 'noma\'lum'),
(21, 'Abduvoxid', '+998946977999', 'Toshkent sh. Olmazor tumani', 'Yangi mijoz', '2026-09-03 13:26:55', 0, NULL, 'Samarqand Zig\'ir Osh'),
(22, 'Dilafruz Avazbekovna', 'noma\'lum', NULL, NULL, '2026-09-03 16:53:05', 0, NULL, 'Prof Med Service');

-- --------------------------------------------------------

--
-- Table structure for table `client_pipeline_card`
--

CREATE TABLE `client_pipeline_card` (
  `id` int NOT NULL,
  `manager_id` int NOT NULL,
  `client_id` int NOT NULL,
  `stage` varchar(30) NOT NULL,
  `proposal_filename` varchar(255) DEFAULT NULL,
  `proposal_original_name` varchar(255) DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `client_pipeline_card`
--

INSERT INTO `client_pipeline_card` (`id`, `manager_id`, `client_id`, `stage`, `proposal_filename`, `proposal_original_name`, `order_id`, `created_at`, `updated_at`, `created_by`) VALUES
(3, 13, 10, 'muvaffaqiyatli', NULL, NULL, NULL, '2026-09-02 12:12:00', '2026-09-02 12:18:32', 13),
(4, 13, 9, 'muvaffaqiyatli', NULL, NULL, NULL, '2026-09-02 12:19:25', '2026-09-02 16:10:21', 13),
(5, 13, 12, 'muvaffaqiyatli', NULL, NULL, 14, '2026-09-02 14:17:21', '2026-09-03 18:02:45', 13),
(6, 13, 13, 'taklif_yuborildi', NULL, NULL, NULL, '2026-09-02 14:56:35', '2026-09-02 14:57:28', 13),
(8, 13, 15, 'muvaffaqiyatli', NULL, NULL, 13, '2026-09-02 15:25:31', '2026-09-03 17:58:31', 13),
(9, 13, 16, 'taklif_yuborildi', NULL, NULL, NULL, '2026-09-02 16:09:32', '2026-09-02 16:09:47', 13),
(10, 13, 18, 'otkaz', NULL, NULL, NULL, '2026-09-03 10:47:06', '2026-09-03 11:23:12', 13),
(11, 13, 20, 'otkaz', NULL, NULL, NULL, '2026-09-03 12:05:59', '2026-09-03 12:06:58', 13),
(12, 10, 19, 'muvaffaqiyatli', NULL, NULL, NULL, '2026-09-03 12:17:27', '2026-09-03 15:11:19', 10),
(14, 10, 17, 'taklif_yuborildi', NULL, NULL, NULL, '2026-09-03 12:21:38', '2026-09-03 12:21:57', 10),
(15, 10, 7, 'taklif_yuborildi', NULL, NULL, NULL, '2026-09-03 12:23:47', '2026-09-03 12:24:00', 10),
(16, 13, 22, 'aloqada', NULL, NULL, NULL, '2026-09-03 16:53:05', '2026-09-03 16:53:10', 13);

-- --------------------------------------------------------

--
-- Table structure for table `client_pipeline_event`
--

CREATE TABLE `client_pipeline_event` (
  `id` int NOT NULL,
  `card_id` int NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `from_stage` varchar(30) DEFAULT NULL,
  `to_stage` varchar(30) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `client_pipeline_event`
--

INSERT INTO `client_pipeline_event` (`id`, `card_id`, `note`, `from_stage`, `to_stage`, `created_at`, `created_by`) VALUES
(13, 3, '', NULL, 'yangi', '2026-09-02 12:12:00', 13),
(14, 3, '', 'yangi', 'aloqada', '2026-09-02 12:18:19', 13),
(15, 3, '', 'aloqada', 'taklif_yuborildi', '2026-09-02 12:18:25', 13),
(16, 3, '', 'taklif_yuborildi', 'muvaffaqiyatli', '2026-09-02 12:18:32', 13),
(17, 4, '', NULL, 'yangi', '2026-09-02 12:19:25', 13),
(18, 4, '', 'yangi', 'aloqada', '2026-09-02 12:20:22', 13),
(19, 4, '', 'aloqada', 'taklif_yuborildi', '2026-09-02 12:20:27', 13),
(20, 5, '', NULL, 'yangi', '2026-09-02 14:17:21', 13),
(21, 5, '', 'yangi', 'aloqada', '2026-09-02 14:17:57', 13),
(22, 5, '', 'aloqada', 'taklif_yuborildi', '2026-09-02 14:18:35', 13),
(23, 6, '', NULL, 'yangi', '2026-09-02 14:56:35', 13),
(24, 6, '', 'yangi', 'aloqada', '2026-09-02 14:57:26', 13),
(25, 6, '', 'aloqada', 'taklif_yuborildi', '2026-09-02 14:57:28', 13),
(27, 8, '', NULL, 'yangi', '2026-09-02 15:25:31', 13),
(28, 8, '', 'yangi', 'aloqada', '2026-09-02 15:25:39', 13),
(29, 8, '', 'aloqada', 'taklif_yuborildi', '2026-09-02 15:25:48', 13),
(30, 8, '', 'taklif_yuborildi', 'muvaffaqiyatli', '2026-09-02 15:25:53', 13),
(31, 9, 'birinchi qo\'ng\'iroq qilindi', NULL, 'yangi', '2026-09-02 16:09:32', 13),
(32, 9, '', 'yangi', 'aloqada', '2026-09-02 16:09:40', 13),
(33, 9, '', 'aloqada', 'taklif_yuborildi', '2026-09-02 16:09:47', 13),
(34, 4, '', 'taklif_yuborildi', 'muvaffaqiyatli', '2026-09-02 16:10:21', 13),
(35, 10, '', NULL, 'yangi', '2026-09-03 10:47:06', 13),
(36, 10, '', 'yangi', 'aloqada', '2026-09-03 10:47:17', 13),
(37, 10, '', 'aloqada', 'taklif_yuborildi', '2026-09-03 10:47:20', 13),
(38, 10, 'zakaz tayyorlash vaqti tog\'ri kelmaganligi sababli bekor qilindi', 'taklif_yuborildi', 'otkaz', '2026-09-03 11:23:12', 13),
(39, 11, '', NULL, 'yangi', '2026-09-03 12:05:59', 13),
(40, 11, '', 'yangi', 'aloqada', '2026-09-03 12:06:08', 13),
(41, 11, '', 'aloqada', 'taklif_yuborildi', '2026-09-03 12:06:10', 13),
(42, 11, 'narx qimmat dedi, narx to\'g\'ri kelmadi', 'taklif_yuborildi', 'otkaz', '2026-09-03 12:06:58', 13),
(43, 12, '', NULL, 'yangi', '2026-09-03 12:17:27', 10),
(44, 12, '', 'yangi', 'taklif_yuborildi', '2026-09-03 12:17:37', 10),
(45, 12, 'ВИЗИТКИ 300 ГРАММ', 'taklif_yuborildi', 'taklif_yuborildi', '2026-09-03 12:17:53', 10),
(49, 14, '', NULL, 'yangi', '2026-09-03 12:21:38', 10),
(50, 14, 'НАБОР!!!', 'yangi', 'yangi', '2026-09-03 12:21:49', 10),
(51, 14, '', 'yangi', 'taklif_yuborildi', '2026-09-03 12:21:57', 10),
(52, 15, '', NULL, 'yangi', '2026-09-03 12:23:47', 10),
(53, 15, 'БИЛЕТЫ!', 'yangi', 'yangi', '2026-09-03 12:23:57', 10),
(54, 15, '', 'yangi', 'taklif_yuborildi', '2026-09-03 12:24:00', 10),
(55, 12, '', 'taklif_yuborildi', 'muvaffaqiyatli', '2026-09-03 15:11:19', 10),
(56, 16, '', NULL, 'yangi', '2026-09-03 16:53:05', 13),
(57, 16, '', 'yangi', 'aloqada', '2026-09-03 16:53:10', 13),
(58, 5, '', 'taklif_yuborildi', 'muvaffaqiyatli', '2026-09-03 17:59:15', 13);

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
-- Table structure for table `employee`
--

CREATE TABLE `employee` (
  `id` int NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `passport_filename` varchar(255) DEFAULT NULL,
  `passport_original_name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `birth_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `employee`
--

INSERT INTO `employee` (`id`, `full_name`, `phone`, `address`, `user_id`, `passport_filename`, `passport_original_name`, `is_active`, `note`, `created_at`, `created_by`, `birth_date`) VALUES
(1, 'Temur aka', '+54321321', '', NULL, NULL, NULL, 1, 'IShlab chiqarish xodimi', '2026-08-29 19:19:56', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employee_advance`
--

CREATE TABLE `employee_advance` (
  `id` int NOT NULL,
  `employee_id` int NOT NULL,
  `kind` varchar(20) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `paid_on` date NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `expense_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_salary`
--

CREATE TABLE `employee_salary` (
  `id` int NOT NULL,
  `employee_id` int NOT NULL,
  `year` int NOT NULL,
  `month` int NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
  `created_by` int DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `supplier_id` int DEFAULT NULL,
  `is_paid` tinyint(1) NOT NULL DEFAULT '1',
  `payment_method` varchar(20) DEFAULT NULL,
  `paid_via` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `expense`
--

INSERT INTO `expense` (`id`, `category`, `amount`, `description`, `date`, `created_at`, `created_by`, `order_id`, `supplier_id`, `is_paid`, `payment_method`, `paid_via`) VALUES
(1, 'xomashyo', 450000.00, 'Ombor kirimi: Konvert — 100 dona', '2026-08-28', '2026-08-28 20:19:47', 1, NULL, 1, 0, NULL, NULL);

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

--
-- Dumping data for table `login_attempt`
--

INSERT INTO `login_attempt` (`id`, `username`, `ip_address`, `created_at`) VALUES
(15, 'Abdurasulov Husniddin', '90.156.194.93', '2026-08-30 20:17:52');

-- --------------------------------------------------------

--
-- Table structure for table `manager_client_log`
--

CREATE TABLE `manager_client_log` (
  `id` int NOT NULL,
  `manager_id` int NOT NULL,
  `log_date` date NOT NULL,
  `status` varchar(30) NOT NULL,
  `client_id` int DEFAULT NULL,
  `client_name` varchar(150) DEFAULT NULL,
  `company_name` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `proposal_filename` varchar(255) DEFAULT NULL,
  `proposal_original_name` varchar(255) DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `manager_plan`
--

CREATE TABLE `manager_plan` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `year` int NOT NULL,
  `month` int NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `material`
--

CREATE TABLE `material` (
  `id` int NOT NULL,
  `name` varchar(120) NOT NULL,
  `unit` varchar(20) NOT NULL,
  `last_price` decimal(14,2) NOT NULL,
  `min_qty` decimal(14,3) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `location` varchar(120) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `material`
--

INSERT INTO `material` (`id`, `name`, `unit`, `last_price`, `min_qty`, `is_active`, `note`, `created_at`, `location`) VALUES
(1, 'Konvert', 'dona', 4500.00, 0.000, 1, NULL, '2026-08-28 20:19:47', NULL);

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
  `status` varchar(40) NOT NULL,
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
(1, 'B-2026-0001', 1, 'dfdsfdsf', 'dsfdsfsd', 1, 50000.00, 50000.00, 'buyurtma yaratildi', NULL, '2026-08-23 22:51:25', '2026-09-02 11:08:16', NULL, 1, 1, '2026-09-02 11:08:16', 1),
(2, 'B-2026-0002', 2, 'Buklet A4', '', 2, 0.00, 2400.00, 'maxsulot yetkazildi', '2026-08-30', '2026-08-28 20:14:03', '2026-08-30 20:58:00', 1, 1, 1, '2026-08-30 20:58:00', 1),
(3, 'B-2026-0003', 8, 'Buklet A4', '', 724, 0.00, 5905300.00, 'dizayn jarayonida', '2026-09-29', '2026-09-02 10:54:31', '2026-09-02 11:08:12', 10, 1, 1, '2026-09-02 11:08:12', 1),
(4, 'B-2026-0004', 9, 'logo', 'oddiy fontda bo\'lsin qandaydir maxsus nimadir keremas', 1, 250000.00, 250000.00, 'maxsulot yetkazildi', '2026-09-03', '2026-09-02 11:55:41', '2026-09-03 16:20:44', 13, 1, 0, NULL, NULL),
(5, 'B-2026-0005', 10, 'Plakat', '', 1, 250000.00, 250000.00, 'maxsulot yetkazildi', '2026-09-03', '2026-09-02 11:59:06', '2026-09-03 16:21:47', 13, 1, 0, NULL, NULL),
(6, 'B-2026-0006', 11, '3D logo', 'har doimgi kilient', 3, 0.00, 1300000.00, 'yetkazish uchun tayyor', '2026-09-02', '2026-09-02 12:02:18', '2026-09-02 12:07:23', 14, 1, 0, NULL, NULL),
(7, 'B-2026-0007', 14, 'Lenta', 'gul uchun lenta ertaga obetdan keyin tayyor boladi', 10, 80000.00, 800000.00, 'to\'lov qilish jarayonida', '2026-09-03', '2026-09-02 14:59:57', '2026-09-02 15:27:42', 14, 2, 0, NULL, NULL),
(8, 'B-2026-0008', 7, 'Bilet', '', 1000, 2800.00, 2800000.00, 'buyurtma yaratildi', '2026-09-04', '2026-09-02 15:06:28', '2026-09-02 15:06:28', 10, 1, 0, NULL, NULL),
(9, 'B-2026-0009', 17, 'Корпоративный набор', 'Набор который состоит из масссажера, зонтика и термоса', 10, 650000.00, 6500000.00, 'buyurtma yaratildi', '2026-09-05', '2026-09-03 10:34:43', '2026-09-03 10:34:43', 10, 1, 0, NULL, NULL),
(10, 'B-2026-0010', 19, 'Визитки', '300 грамм, цифровая печать, края круглые', 100, 2000.00, 200000.00, 'buyurtma yaratildi', '2026-09-04', '2026-09-03 11:21:09', '2026-09-03 11:21:09', 10, 1, 0, NULL, NULL),
(11, 'B-2026-0011', 21, 'Vizitka', '100ta Vizitka ertaga tayyor boladi \r\nStentni QR kodini tashab bergandan keyin boshlimiz', 130, 0.00, 950000.00, 'buyurtma yaratildi', '2026-09-07', '2026-09-03 13:36:25', '2026-09-03 14:13:52', 14, 1, 1, '2026-09-03 14:13:52', 1),
(12, 'B-2026-0012', 21, 'Vizitka', '100ta Vizitka ertaga tayyor boladi \r\nStentni QR kodini tashab bergandan keyin boshlimiz', 130, 0.00, 950000.00, 'buyurtma yaratildi', '2026-09-07', '2026-09-03 13:36:25', '2026-09-03 13:36:25', 14, 1, 0, NULL, NULL),
(13, 'B-2026-0013', 15, 'Banner', '', 5, 0.00, 1688700.00, 'buyurtma yaratildi', NULL, '2026-09-03 17:58:31', '2026-09-03 17:58:31', 13, 1, 0, NULL, NULL),
(14, 'B-2026-0014', 12, 'Бумажный пакет', '', 450, 0.00, 13499999.00, 'buyurtma yaratildi', NULL, '2026-09-03 18:02:45', '2026-09-03 18:02:45', 13, 1, 0, NULL, NULL);

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

--
-- Dumping data for table `order_file`
--

INSERT INTO `order_file` (`id`, `order_id`, `filename`, `original_name`, `size_bytes`, `created_at`, `created_by`) VALUES
(1, 5, '84cd01a643db49fea2a9438bd8ce5db3.jpg', 'photo_2026-09-02_12-04-02.jpg', 52164, '2026-09-02 12:07:15', 13),
(2, 4, 'd2dc80a1ebb54aa4ac24b6b878900818.jpg', 'photo_2026-09-03_09-39-45.jpg', 40814, '2026-09-03 09:47:40', 13),
(3, 8, 'c5d65c6a183147b684ad84c392b1aba8.jpg', 'photo_2026-09-03_11-26-37.jpg', 791468, '2026-09-03 11:27:59', 10),
(4, 10, '10eafb746caa487599836d170ff417b4.jpg', 'photo_2026-09-03_11-26-47.jpg', 47402, '2026-09-03 11:29:12', 10),
(5, 4, '03b75a4322a34e4e8ea399b9da213018.jpg', 'photo_2026-09-03_15-35-00.jpg', 40425, '2026-09-03 16:21:30', 13);

-- --------------------------------------------------------

--
-- Table structure for table `order_item`
--

CREATE TABLE `order_item` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `order_type` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(14,2) NOT NULL,
  `total_price` decimal(14,2) NOT NULL,
  `position` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_item`
--

INSERT INTO `order_item` (`id`, `order_id`, `order_type`, `description`, `quantity`, `unit_price`, `total_price`, `position`) VALUES
(1, 1, 'dfdsfdsf', 'dsfdsfsd', 1, 50000.00, 50000.00, 0),
(2, 2, 'Buklet A4', '', 1, 2000.00, 2000.00, 0),
(3, 2, 'Flayer', '', 1, 400.00, 400.00, 1),
(4, 3, 'Buklet A4', '200gr qog\'oz sifravoy pechatda', 1, 2500.00, 2500.00, 0),
(5, 3, 'Flayer', '', 111, 4000.00, 444000.00, 1),
(6, 3, 'Naklekya (stiker)', '', 511, 800.00, 408800.00, 2),
(7, 3, 'Plakat A2', '', 101, 50000.00, 5050000.00, 3),
(8, 4, 'logo', '30см х 12см; trafareti bo\'lsin', 1, 250000.00, 250000.00, 0),
(9, 5, 'Plakat', '120sm X 80sm; fomaks', 1, 250000.00, 250000.00, 0),
(10, 6, '3D logo', '60x60 bortma', 1, 600000.00, 600000.00, 0),
(11, 6, 'Pauk', '60x160sm', 2, 350000.00, 700000.00, 1),
(13, 8, 'Bilet', '300 gramm qogoz', 1000, 2800.00, 2800000.00, 0),
(14, 7, 'Lenta', '180x10', 10, 80000.00, 800000.00, 0),
(15, 9, 'Корпоративный набор', '', 10, 650000.00, 6500000.00, 0),
(16, 10, 'Визитки', '', 100, 2000.00, 200000.00, 0),
(17, 11, 'Vizitka', '9x5.5', 100, 2000.00, 200000.00, 0),
(18, 11, 'Stend', 'A4', 30, 25000.00, 750000.00, 1),
(19, 12, 'Vizitka', '9x5.5', 100, 2000.00, 200000.00, 0),
(20, 12, 'Stend', 'A4', 30, 25000.00, 750000.00, 1),
(21, 13, 'Banner', '3Mx0,65M; karkas bilan', 1, 253500.00, 253500.00, 0),
(22, 13, 'Banner', '1,75Mx2,40M; karkas bilan', 1, 546000.00, 546000.00, 1),
(23, 13, 'Banner', '1,20Mx3,20M; karkas bilan', 1, 499200.00, 499200.00, 2),
(24, 13, 'Banner', '1Mx1,5M; karkas bilan', 2, 195000.00, 390000.00, 3),
(25, 14, 'Бумажный пакет', '34х25х9; матовый', 100, 27000.00, 2700000.00, 0),
(26, 14, 'Календарь домик', '19х24х10; 13 лист', 50, 110000.00, 5500000.00, 1),
(27, 14, 'Ручка', 'пластик', 100, 4500.00, 450000.00, 2),
(28, 14, 'Папка', 'с кармашком', 100, 18500.00, 1850000.00, 3),
(29, 14, 'Блокнот', 'А5', 100, 29999.99, 2999999.00, 4);

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
(2, 'Banner', 'm²', 35000.00, 0, '2026-08-23 21:31:55'),
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
  `created_by` int DEFAULT NULL,
  `payment_method` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`id`, `order_id`, `amount`, `paid_on`, `note`, `created_at`, `created_by`, `payment_method`) VALUES
(3, 5, 130000.00, '2026-09-02', '', '2026-09-02 12:04:13', 13, 'Karta'),
(4, 6, 1300000.00, '2026-09-02', '100% TO\'LOV QILDI', '2026-09-02 12:05:56', 14, 'Dogovor Yatt Ergashev'),
(6, 5, 120000.00, '2026-09-02', '', '2026-09-02 12:07:31', 13, 'Karta'),
(7, 4, 130000.00, '2026-09-03', '', '2026-09-03 09:48:02', 13, 'Karta'),
(8, 8, 2800000.00, '2026-09-03', '', '2026-09-03 11:26:55', 10, 'Terminal'),
(9, 10, 200000.00, '2026-09-03', '', '2026-09-03 11:28:36', 10, 'Karta'),
(10, 4, 120000.00, '2026-09-03', '', '2026-09-03 16:21:38', 13, 'Karta');

-- --------------------------------------------------------

--
-- Table structure for table `stock_move`
--

CREATE TABLE `stock_move` (
  `id` int NOT NULL,
  `material_id` int NOT NULL,
  `kind` varchar(10) NOT NULL,
  `quantity` decimal(14,3) NOT NULL,
  `unit_price` decimal(14,2) NOT NULL,
  `moved_on` date NOT NULL,
  `order_id` int DEFAULT NULL,
  `expense_id` int DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `stock_move`
--

INSERT INTO `stock_move` (`id`, `material_id`, `kind`, `quantity`, `unit_price`, `moved_on`, `order_id`, `expense_id`, `note`, `created_at`, `created_by`) VALUES
(1, 1, 'kirim', 100.000, 4500.00, '2026-08-28', NULL, 1, '', '2026-08-28 20:19:47', 1);

-- --------------------------------------------------------

--
-- Table structure for table `supplier`
--

CREATE TABLE `supplier` (
  `id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `supplier`
--

INSERT INTO `supplier` (`id`, `name`, `phone`, `address`, `note`, `is_active`, `created_at`) VALUES
(1, 'Alzuben', '+998 97 757 80 13one', 'None', NULL, 1, '2026-08-28 20:19:47'),
(2, 'Effect Print MChJ', '+998 90 977 83 12', '', NULL, 1, '2026-08-30 20:37:27'),
(3, 'Reykachi aka', '+998 90 988 28 83', '', NULL, 1, '2026-08-30 20:38:41'),
(4, 'USN', '+998 77 203 77 94', '', NULL, 1, '2026-08-30 20:38:59'),
(5, 'Norbek aka Reklama', '+998 99 420 28 77', '', NULL, 1, '2026-08-30 20:39:18'),
(6, 'Deli kanstova', '+998 99 838 28 56', '', NULL, 1, '2026-08-30 20:39:42'),
(7, 'Verbattom OUT', '+998 99 107 21 05', '', NULL, 1, '2026-08-30 20:40:03'),
(8, 'Maruf aka reklama', '+998 99 087 57 87', '', NULL, 1, '2026-08-30 20:40:23'),
(9, 'DTF STAR', '+998 90 770 33 38', '', NULL, 1, '2026-08-30 20:40:42'),
(10, 'Marvan Kanstovar', '+998 99 777 03 51', '', NULL, 1, '2026-08-30 20:41:00'),
(11, 'Murodaka Kanstova', '+998 99 407 67 87', '', NULL, 1, '2026-08-30 20:41:23'),
(12, 'Diary kanstovar', '+998 99 109 88 22', '', NULL, 1, '2026-08-30 20:41:39'),
(13, 'Victus service mchj', '+998 90 974 56 36', '', NULL, 1, '2026-08-30 20:42:02'),
(14, 'Ramka berezia oloybozor', '+998 98 107 19 19', '', NULL, 1, '2026-08-30 20:42:29'),
(15, 'Avanta Trade MChJ', '+998 97 155 80 70', '', NULL, 1, '2026-08-30 20:42:49'),
(16, 'Fresh Print', '+998 77 311 00 99', '', NULL, 1, '2026-08-30 20:43:04'),
(17, 'Humo ART', '+998 99 099 44 11', '', NULL, 1, '2026-08-30 20:43:25'),
(18, 'Politex Design', '+998 99 882 43 77', '', NULL, 1, '2026-08-30 20:43:52'),
(19, 'Green Code Laser', '+998 93 590 23 25', '', NULL, 1, '2026-08-30 20:44:08'),
(20, 'NUR reklama magazin', '+998 91 163 44 22', '', NULL, 1, '2026-08-30 20:44:29'),
(21, 'NAR reklama magazin', '+998 88 130 35 75', '', NULL, 1, '2026-08-30 20:44:45'),
(22, 'Innavatsion Print', '+998 94 606 61 50', '', NULL, 1, '2026-08-30 20:45:06'),
(23, 'ColorPack MChJ', '+998 90 940 40 94', '', NULL, 1, '2026-08-30 20:45:22'),
(24, 'Shoxjaxon kanstovar', '+998 99 720 41 12', '', NULL, 1, '2026-08-30 20:46:10'),
(25, 'Premer Print MChH', '+998 93 000 02 28', '', NULL, 1, '2026-08-30 20:46:32'),
(26, 'KEDR Akmal aka Kanstovar', '+998 99 868 01 31', '', NULL, 1, '2026-08-30 20:46:52'),
(27, 'AliPrint MChJ', '+998 97 800 09 99', '', NULL, 1, '2026-08-30 20:47:10'),
(28, 'Gulnara opa Papka Kanstovar', '+998911343977', '', NULL, 1, '2026-08-30 20:47:48'),
(29, 'Javlon aka Xozmag', '+998 97 778 31 01', '', NULL, 1, '2026-08-30 20:48:08'),
(30, 'Dunyo Bayroqlari', '+998 97 135 04 06', '', NULL, 1, '2026-08-30 20:48:24'),
(31, 'ArialMax MCHJ', '+998 97 736 66 60', '', NULL, 1, '2026-08-30 20:48:47'),
(32, 'Tohir aka Sumka', '+998 99 170 38 18', '', NULL, 1, '2026-08-30 20:49:13'),
(33, 'Vadim aka Tisneniya', '+998 93 515 35 81', '', NULL, 1, '2026-08-30 20:49:29'),
(34, 'ArtCover', '+998 94 649 70 77', '', NULL, 1, '2026-08-30 20:49:50'),
(35, 'AutoCAD', '+998 95 199 19 75', '', NULL, 1, '2026-08-30 20:50:03'),
(36, 'Berezia G\'uncha', '+998 95 177 16 61', '', NULL, 1, '2026-08-30 20:50:21'),
(37, 'Status Shop', '+998 93 812 88 28', '', NULL, 1, '2026-08-30 20:50:43'),
(38, 'Lola Opa Textile', '+998 99 897 59 90', '', NULL, 1, '2026-08-30 20:51:04'),
(39, 'Oleg Klishe', '+998 90 185 49 24', '', NULL, 1, '2026-08-30 20:51:22'),
(40, 'O\'tkir aka Global Print', '+998 90 328 84 08', '', NULL, 1, '2026-08-30 20:51:42'),
(41, 'Abror Print', '+998 98 308 02 41', '', NULL, 1, '2026-08-30 20:51:56'),
(42, 'Temur Vibr lak', '+998 90 355 28 55', '', NULL, 1, '2026-08-30 20:52:16'),
(43, 'Basico', '+998 97 053 04 04', '', NULL, 1, '2026-08-30 20:52:31'),
(44, 'Anvar aka o\'rikzor termos', '+998 99 892 03 07', '', NULL, 1, '2026-08-30 20:52:56');

-- --------------------------------------------------------

--
-- Table structure for table `supplier_payment`
--

CREATE TABLE `supplier_payment` (
  `id` int NOT NULL,
  `supplier_id` int NOT NULL,
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
(1, 0, '', '', 1, 1, 1, NULL, '2026-08-28 11:54:14');

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
(1, 'admin', 'scrypt:32768:8:1$QBG7pECqQd1QgasO$0e288603d331bd559038a6f5a4c7016e086ad6f33006cbe18a419d50318ec3b5c7c1b8b9b51166940730636edeff385baa23395f67998e39e373374b95597b22', 'Administrator', 'admin', 1, '2026-08-23 21:31:55'),
(8, 'Zoxidjon', 'scrypt:32768:8:1$mcmQCWNRy12Pvcv9$028cfb1ef7cd2e2fb53f43f3ccce38d91095dbe755a030c877e22a5d3c5c66f794128713a942c326ea8e8956d6bdbae44cc9212d9065b3446e59d0a30a7ba70c', 'Zoxidjon Ergashev', 'xarajatchi', 1, '2026-08-29 21:11:35'),
(9, 'husniddin', 'scrypt:32768:8:1$f30o8AWaCFSF3a4s$95b5b2a67d77df9db55fe632b5315301d758900925318adcae43c728733dc587f221f9deebdb510e5ba65700663cb3274c1d268fc7c06ee035a41c165b50bc09', 'Husniddin Abdurasulov', 'boss', 1, '2026-08-29 21:12:07'),
(10, 'menejer1', 'scrypt:32768:8:1$est6ff8qcDwf5NU4$0dd771ba34e308bb4dc52dc5c7675cf85da302506cfcc56b250b829319e1177051620733ebc72df8bb4b7be63d884efd9879bb3a1060f668e3cc75697bfc4661', 'Komila Ahmedova', 'menejer', 1, '2026-08-29 21:12:41'),
(11, 'menejer2', 'scrypt:32768:8:1$dyieUhLosNYoLzRj$48588bfbc1d5c8a688459e2189dfe6ef21e0049d2d3d39d0537efbd64985d7f0284ac23faf3b6ee8fd745f494ca2eb94511fe55e5db30e89358e524650ef2e09', 'Vazira Nazarova', 'menejer', 1, '2026-08-29 21:13:04'),
(13, 'menejer3', 'scrypt:32768:8:1$h7HnbokBzGgqK2lF$3f1ea2a3e0432809968a5e0d1d56936edc2049a8587525e8e37119c0c35c8b90f94b9607fd186a9dcea73e004b08f2beadf41c75f06826563de6b92345dc2aa8', 'Mohinur Muhammadkarimova', 'menejer', 1, '2026-09-02 11:04:48'),
(14, 'menejer4', 'scrypt:32768:8:1$imvvKeQR6ExpinQG$692cfddd0c37b673461782fb8d7c47e0ea428153ba7b52b290e6072a347ec9c0d14d5bf1c555cee98118df2bae9fce364415e0093bf246021a1362edb4130bcf', 'Shaxlo Abdumajiyeva', 'menejer', 1, '2026-09-02 11:06:18');

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
-- Indexes for table `client_pipeline_card`
--
ALTER TABLE `client_pipeline_card`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `ix_client_pipeline_card_client_id` (`client_id`),
  ADD KEY `ix_client_pipeline_card_manager_id` (`manager_id`),
  ADD KEY `ix_client_pipeline_card_stage` (`stage`),
  ADD KEY `ix_client_pipeline_card_order_id` (`order_id`);

--
-- Indexes for table `client_pipeline_event`
--
ALTER TABLE `client_pipeline_event`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `ix_client_pipeline_event_created_at` (`created_at`),
  ADD KEY `ix_client_pipeline_event_card_id` (`card_id`);

--
-- Indexes for table `company_settings`
--
ALTER TABLE `company_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `employee`
--
ALTER TABLE `employee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `ix_employee_is_active` (`is_active`),
  ADD KEY `ix_employee_user_id` (`user_id`),
  ADD KEY `ix_employee_full_name` (`full_name`);

--
-- Indexes for table `employee_advance`
--
ALTER TABLE `employee_advance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `ix_employee_advance_employee_id` (`employee_id`),
  ADD KEY `ix_employee_advance_paid_on` (`paid_on`),
  ADD KEY `ix_employee_advance_expense_id` (`expense_id`),
  ADD KEY `ix_employee_advance_kind` (`kind`);

--
-- Indexes for table `employee_salary`
--
ALTER TABLE `employee_salary`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_employee_salary_period` (`employee_id`,`year`,`month`),
  ADD KEY `ix_employee_salary_employee_id` (`employee_id`);

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
-- Indexes for table `manager_client_log`
--
ALTER TABLE `manager_client_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `ix_manager_client_log_status` (`status`),
  ADD KEY `ix_manager_client_log_order_id` (`order_id`),
  ADD KEY `ix_manager_client_log_manager_id` (`manager_id`),
  ADD KEY `ix_manager_client_log_log_date` (`log_date`),
  ADD KEY `ix_manager_client_log_client_id` (`client_id`);

--
-- Indexes for table `manager_plan`
--
ALTER TABLE `manager_plan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_manager_plan_period` (`user_id`,`year`,`month`),
  ADD KEY `ix_manager_plan_user_id` (`user_id`);

--
-- Indexes for table `material`
--
ALTER TABLE `material`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_material_name` (`name`),
  ADD KEY `ix_material_is_active` (`is_active`);

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
-- Indexes for table `order_item`
--
ALTER TABLE `order_item`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_order_item_order_id` (`order_id`);

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
-- Indexes for table `stock_move`
--
ALTER TABLE `stock_move`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `ix_stock_move_order_id` (`order_id`),
  ADD KEY `ix_stock_move_expense_id` (`expense_id`),
  ADD KEY `ix_stock_move_kind` (`kind`),
  ADD KEY `ix_stock_move_material_id` (`material_id`),
  ADD KEY `ix_stock_move_moved_on` (`moved_on`);

--
-- Indexes for table `supplier`
--
ALTER TABLE `supplier`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_supplier_name` (`name`),
  ADD KEY `ix_supplier_is_active` (`is_active`);

--
-- Indexes for table `supplier_payment`
--
ALTER TABLE `supplier_payment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `ix_supplier_payment_paid_on` (`paid_on`),
  ADD KEY `ix_supplier_payment_supplier_id` (`supplier_id`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=286;

--
-- AUTO_INCREMENT for table `client`
--
ALTER TABLE `client`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `client_pipeline_card`
--
ALTER TABLE `client_pipeline_card`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `client_pipeline_event`
--
ALTER TABLE `client_pipeline_event`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT for table `company_settings`
--
ALTER TABLE `company_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `employee`
--
ALTER TABLE `employee`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `employee_advance`
--
ALTER TABLE `employee_advance`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_salary`
--
ALTER TABLE `employee_salary`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expense`
--
ALTER TABLE `expense`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `login_attempt`
--
ALTER TABLE `login_attempt`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `manager_client_log`
--
ALTER TABLE `manager_client_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `manager_plan`
--
ALTER TABLE `manager_plan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `material`
--
ALTER TABLE `material`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order`
--
ALTER TABLE `order`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `order_file`
--
ALTER TABLE `order_file`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `order_item`
--
ALTER TABLE `order_item`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `order_type`
--
ALTER TABLE `order_type`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `stock_move`
--
ALTER TABLE `stock_move`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `supplier`
--
ALTER TABLE `supplier`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `supplier_payment`
--
ALTER TABLE `supplier_payment`
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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

--
-- Constraints for table `client_pipeline_card`
--
ALTER TABLE `client_pipeline_card`
  ADD CONSTRAINT `client_pipeline_card_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `client_pipeline_card_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`),
  ADD CONSTRAINT `client_pipeline_card_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`),
  ADD CONSTRAINT `client_pipeline_card_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

--
-- Constraints for table `client_pipeline_event`
--
ALTER TABLE `client_pipeline_event`
  ADD CONSTRAINT `client_pipeline_event_ibfk_1` FOREIGN KEY (`card_id`) REFERENCES `client_pipeline_card` (`id`),
  ADD CONSTRAINT `client_pipeline_event_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

--
-- Constraints for table `employee`
--
ALTER TABLE `employee`
  ADD CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `employee_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

--
-- Constraints for table `employee_advance`
--
ALTER TABLE `employee_advance`
  ADD CONSTRAINT `employee_advance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`),
  ADD CONSTRAINT `employee_advance_ibfk_2` FOREIGN KEY (`expense_id`) REFERENCES `expense` (`id`),
  ADD CONSTRAINT `employee_advance_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

--
-- Constraints for table `employee_salary`
--
ALTER TABLE `employee_salary`
  ADD CONSTRAINT `employee_salary_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`);

--
-- Constraints for table `expense`
--
ALTER TABLE `expense`
  ADD CONSTRAINT `expense_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

--
-- Constraints for table `manager_client_log`
--
ALTER TABLE `manager_client_log`
  ADD CONSTRAINT `manager_client_log_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `manager_client_log_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`),
  ADD CONSTRAINT `manager_client_log_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`),
  ADD CONSTRAINT `manager_client_log_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

--
-- Constraints for table `manager_plan`
--
ALTER TABLE `manager_plan`
  ADD CONSTRAINT `manager_plan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

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
-- Constraints for table `order_item`
--
ALTER TABLE `order_item`
  ADD CONSTRAINT `order_item_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`);

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`),
  ADD CONSTRAINT `payment_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

--
-- Constraints for table `stock_move`
--
ALTER TABLE `stock_move`
  ADD CONSTRAINT `stock_move_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `material` (`id`),
  ADD CONSTRAINT `stock_move_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`),
  ADD CONSTRAINT `stock_move_ibfk_3` FOREIGN KEY (`expense_id`) REFERENCES `expense` (`id`),
  ADD CONSTRAINT `stock_move_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

--
-- Constraints for table `supplier_payment`
--
ALTER TABLE `supplier_payment`
  ADD CONSTRAINT `supplier_payment_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`id`),
  ADD CONSTRAINT `supplier_payment_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
