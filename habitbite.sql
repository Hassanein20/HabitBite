-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 30, 2025 at 09:58 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `habitbite`
--

-- --------------------------------------------------------

--
-- Table structure for table `consumed_foods`
--

CREATE TABLE `consumed_foods` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `food_id` varchar(50) NOT NULL,
  `food_name` varchar(255) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `calories` decimal(10,2) NOT NULL,
  `protein` decimal(10,2) NOT NULL,
  `carbs` decimal(10,2) NOT NULL,
  `fats` decimal(10,2) NOT NULL,
  `entry_date` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `consumed_foods`
--

INSERT INTO `consumed_foods` (`id`, `user_id`, `food_id`, `food_name`, `quantity`, `calories`, `protein`, `carbs`, `fats`, `entry_date`, `created_at`, `updated_at`) VALUES
(5, 10, '2733475', 'Tyson Uncooked Homestyle Popcorn Chicken Bites Chicken Chunks', 148.00, 358.85, 23.38, 23.38, 19.09, '2025-05-15 01:59:17', '2025-05-15 01:59:17', '2025-05-15 01:59:17'),
(10, 18, '2732555', 'Pillsbury Apple Cinnamon Bread Batter', 100.00, 364.58, 3.57, 55.40, 14.30, '2025-05-15 08:23:38', '2025-05-15 08:23:38', '2025-05-15 08:23:38'),
(15, 10, '2012128', 'BANANA', 125.00, 335.81, 15.63, 50.75, 7.81, '2025-05-16 15:00:00', '2025-05-16 01:38:27', '2025-05-16 01:38:27'),
(16, 10, '454004', 'APPLE', 120.00, 75.66, 0.01, 17.16, 0.78, '2025-05-16 15:00:00', '2025-05-16 01:38:59', '2025-05-16 01:38:59'),
(17, 10, '2442262', 'STRAWBERRY', 78.00, 68.80, 0.66, 16.54, 0.01, '2025-05-16 15:00:00', '2025-05-16 02:16:58', '2025-05-16 02:16:58'),
(22, 10, '2646170', 'Chicken, breast, boneless, skinless, raw', 125.00, 134.21, 28.13, 0.01, 2.41, '2025-05-16 14:22:02', '2025-05-16 14:22:02', '2025-05-16 14:22:02'),
(23, 10, '2680464', 'MANGO', 80.00, 280.00, 2.00, 68.00, 0.01, '2025-05-16 14:25:00', '2025-05-16 14:24:59', '2025-05-16 14:24:59'),
(24, 11, '2705849', 'Beef, stew meat', 200.00, 503.42, 56.78, 0.01, 30.70, '2025-05-16 14:47:19', '2025-05-16 14:47:19', '2025-05-16 14:47:19'),
(25, 11, '2440097', 'WHITE RICE', 200.00, 675.76, 13.34, 155.60, 0.01, '2025-05-16 14:48:27', '2025-05-16 14:48:27', '2025-05-16 14:48:27'),
(26, 10, '2709719', 'Tomatoes, raw', 200.00, 44.46, 1.64, 8.08, 0.62, '2025-05-16 16:53:15', '2025-05-16 16:53:14', '2025-05-16 16:53:14'),
(30, 10, '2038064', 'CHICKEN', 148.00, 150.53, 31.67, 0.01, 2.65, '2025-05-18 22:06:02', '2025-05-18 22:06:02', '2025-05-18 22:06:02'),
(31, 10, '2012128', 'BANANA', 100.00, 268.65, 12.50, 40.60, 6.25, '2025-05-18 22:33:21', '2025-05-18 22:33:21', '2025-05-18 22:33:21'),
(32, 10, '2012128', 'BANANA', 100.00, 268.65, 12.50, 40.60, 6.25, '2025-05-20 08:14:10', '2025-05-20 08:14:09', '2025-05-20 08:14:09'),
(36, 11, '454004', 'APPLE', 100.00, 63.05, 0.01, 14.30, 0.65, '2025-05-21 02:51:16', '2025-05-21 02:51:15', '2025-05-21 02:51:15'),
(37, 10, '454004', 'APPLE', 100.00, 63.05, 0.01, 14.30, 0.65, '2025-05-21 03:02:54', '2025-05-21 03:02:54', '2025-05-21 03:02:54'),
(38, 10, '2038064', 'CHICKEN', 100.00, 101.71, 21.40, 0.01, 1.79, '2025-05-21 17:51:10', '2025-05-21 17:51:09', '2025-05-21 17:51:09'),
(39, 11, '2012128', 'BANANA', 100.00, 268.65, 12.50, 40.60, 6.25, '2025-05-21 23:51:23', '2025-05-21 23:51:23', '2025-05-21 23:51:23'),
(40, 10, '454004', 'APPLE', 100.00, 63.05, 0.01, 14.30, 0.65, '2025-05-22 00:16:00', '2025-05-22 00:15:59', '2025-05-22 00:15:59'),
(41, 10, '2038064', 'CHICKEN', 100.00, 101.71, 21.40, 0.01, 1.79, '2025-05-22 03:07:36', '2025-05-22 03:07:35', '2025-05-22 03:07:35'),
(42, 10, '2442262', 'STRAWBERRY', 100.00, 88.20, 0.85, 21.20, 0.01, '2025-05-22 03:08:03', '2025-05-22 03:08:03', '2025-05-22 03:08:03'),
(44, 10, '2680464', 'MANGO', 100.00, 350.00, 2.50, 85.00, 0.01, '2025-05-22 14:50:42', '2025-05-22 14:50:42', '2025-05-22 14:50:42'),
(45, 10, '1852991', 'CHI-CHI\'S, DICED GREEN CHILIES', 100.00, 13.32, 0.01, 3.33, 0.01, '2025-05-23 00:14:21', '2025-05-23 00:14:20', '2025-05-23 00:14:20'),
(46, 10, '2038064', 'CHICKEN', 100.00, 101.71, 21.40, 0.01, 1.79, '2025-05-24 12:26:45', '2025-05-24 12:26:45', '2025-05-24 12:26:45'),
(47, 10, '2012128', 'BANANA', 100.00, 268.65, 12.50, 40.60, 6.25, '2025-05-25 21:55:58', '2025-05-25 21:55:58', '2025-05-25 21:55:58'),
(48, 10, '1852991', 'CHI-CHI\'S, DICED GREEN CHILIES', 100.00, 13.32, 0.01, 3.33, 0.01, '2025-05-25 22:58:02', '2025-05-25 22:58:01', '2025-05-25 22:58:01'),
(49, 10, '2038064', 'CHICKEN', 100.00, 101.71, 21.40, 0.01, 1.79, '2025-05-28 00:34:11', '2025-05-28 00:34:11', '2025-05-28 00:34:11'),
(50, 10, '2012128', 'BANANA', 100.00, 268.65, 12.50, 40.60, 6.25, '2025-05-28 23:52:31', '2025-05-28 23:52:30', '2025-05-28 23:52:30'),
(52, 27, '2124902', 'APPLE', 100.00, 57.64, 0.41, 14.00, 0.01, '2025-05-29 10:20:47', '2025-05-29 10:20:47', '2025-05-29 10:20:47'),
(53, 27, '2012128', 'BANANA', 100.00, 268.65, 12.50, 40.60, 6.25, '2025-05-29 10:22:20', '2025-05-29 10:22:20', '2025-05-29 10:22:20'),
(55, 27, '579242', 'MEAT', 100.00, 176.00, 17.90, 0.01, 11.60, '2025-05-29 10:24:47', '2025-05-29 10:24:47', '2025-05-29 10:24:47'),
(56, 27, '2089273', 'WHITE BREAD', 100.00, 283.46, 3.39, 40.70, 11.90, '2025-05-29 10:25:15', '2025-05-29 10:25:14', '2025-05-29 10:25:14'),
(57, 27, '2710186', 'Olive oil', 100.00, 900.00, 0.01, 0.01, 100.00, '2025-05-29 10:25:47', '2025-05-29 10:25:46', '2025-05-29 10:25:46'),
(58, 27, '2029648', 'CHICKEN', 100.00, 159.88, 6.67, 33.30, 0.01, '2025-05-29 10:27:43', '2025-05-29 10:27:42', '2025-05-29 10:27:42'),
(59, 27, '2706293', 'Fish, sardines, canned', 100.00, 201.53, 24.62, 0.01, 11.45, '2025-05-29 10:28:12', '2025-05-29 10:28:11', '2025-05-29 10:28:11'),
(60, 27, '2442994', 'SARDINES', 100.00, 208.70, 23.60, 0.01, 12.70, '2025-05-29 10:28:46', '2025-05-29 10:28:45', '2025-05-29 10:28:45'),
(62, 10, '2038064', 'CHICKEN', 100.00, 101.71, 21.40, 0.01, 1.79, '2025-05-30 15:56:31', '2025-05-30 15:56:30', '2025-05-30 15:56:30'),
(63, 11, '2395464', 'CHICK SEITAN IN CHUNKS, CHICK', 100.00, 162.32, 26.30, 12.30, 0.88, '2025-05-30 16:47:51', '2025-05-30 16:47:51', '2025-05-30 16:47:51'),
(65, 10, '2466144', 'BEEF', 100.00, 170.70, 16.80, 0.01, 11.50, '2025-05-30 18:10:58', '2025-05-30 18:10:58', '2025-05-30 18:10:58');

-- --------------------------------------------------------

--
-- Table structure for table `daily_entries`
--

CREATE TABLE `daily_entries` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `entry_date` date NOT NULL,
  `total_calories` int(11) NOT NULL,
  `total_protein` decimal(5,2) DEFAULT NULL,
  `total_carbs` decimal(5,2) DEFAULT NULL,
  `total_fats` decimal(5,2) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `daily_entries`
--

INSERT INTO `daily_entries` (`id`, `user_id`, `entry_date`, `total_calories`, `total_protein`, `total_carbs`, `total_fats`, `notes`) VALUES
(1, 10, '2025-05-14', 3000, 200.00, 300.00, 50.00, NULL),
(2, 10, '2025-05-16', 939, 48.07, 160.54, 11.64, NULL),
(3, 10, '2025-05-15', 2500, 150.00, 200.00, 80.00, NULL),
(4, 10, '2025-05-17', 0, 0.00, 0.00, 0.00, NULL),
(6, 10, '2025-05-18', 419, 44.17, 40.61, 8.90, NULL),
(9, 11, '2025-05-20', 0, 0.00, 0.00, 0.00, NULL),
(10, 10, '2025-05-21', 165, 21.41, 14.31, 2.44, NULL),
(11, 11, '2025-05-21', 332, 12.51, 54.90, 6.90, NULL),
(12, 10, '2025-05-22', 603, 24.76, 120.51, 2.46, NULL),
(14, 10, '2025-05-24', 102, 21.40, 0.01, 1.79, NULL),
(15, 10, '2025-05-25', 282, 12.51, 43.93, 6.26, NULL),
(16, 10, '2025-05-27', 0, 0.00, 0.00, 0.00, NULL),
(17, 10, '2025-05-28', 370, 33.90, 40.61, 8.04, NULL),
(19, 27, '2025-05-29', 2256, 89.10, 128.64, 153.92, NULL),
(21, 10, '2025-05-30', 272, 38.20, 0.02, 13.29, NULL),
(22, 11, '2025-05-30', 162, 26.30, 12.30, 0.88, NULL),
(23, 10, '2025-05-29', 1500, 200.00, 100.00, 75.00, NULL),
(24, 3, '2025-05-29', 2000, 150.00, 200.00, 80.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `birthdate` date NOT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `height` decimal(5,2) NOT NULL,
  `weight` decimal(5,2) NOT NULL,
  `goal_type` enum('lose','gain','maintain') NOT NULL,
  `activity_level` enum('sedentary','light','moderate','active','very_active') NOT NULL,
  `daily_calorie_goal` int(11) NOT NULL DEFAULT 2000 COMMENT 'Default value will be calculated during registration',
  `role` enum('admin','dietitian','user') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `username`, `password_hash`, `full_name`, `birthdate`, `gender`, `height`, `weight`, `goal_type`, `activity_level`, `daily_calorie_goal`, `role`, `created_at`, `updated_at`) VALUES
(1, 'emily.carter@example.com', 'emily_fitness92', '$2a$10$N9qo8uLOickgx3ZMRM7xEe6h6u/K7fB8Z4zJf7Q7JwYb5t7Q1Z/v2', 'Emily Carter', '1992-08-15', 'female', 167.60, 78.40, 'lose', 'light', 1850, 'user', '2025-04-27 19:38:52', '2025-05-01 21:40:01'),
(2, 'michael.gonzalez@example.com', 'mikegains', '$2a$10$N9qo8uLOickgx3ZMRM7xEe6h6u/K7fB8Z4zJf7Q7JwYb5t7Q1Z/v2', 'Michael Gonzalez', '1988-11-03', 'male', 182.90, 88.50, 'gain', 'very_active', 3200, 'user', '2025-04-27 19:38:52', '2025-05-01 21:40:37'),
(3, 'alex.nguyen@example.com', 'alex_wellness', '$2a$10$N9qo8uLOickgx3ZMRM7xEe6h6u/K7fB8Z4zJf7Q7JwYb5t7Q1Z/v2', 'Alex Nguyen', '1999-02-28', 'other', 175.30, 68.00, 'maintain', 'moderate', 2400, 'user', '2025-04-27 19:38:52', '2025-05-01 21:40:37'),
(4, 'dr.nutrition@example.com', 'dr_wellness', '$2a$10$N9qo8uLOickgx3ZMRM7xEe6h6u/K7fB8Z4zJf7Q7JwYb5t7Q1Z/v2', 'Sarah Thompson', '1985-04-12', 'female', 170.20, 62.10, 'maintain', 'active', 2000, 'dietitian', '2025-04-27 19:38:52', '2025-05-01 21:40:37'),
(5, 'admin.calorietrack@example.com', 'sysadmin_ctl', '$2a$10$N9qo8uLOickgx3ZMRM7xEe6h6u/K7fB8Z4zJf7Q7JwYb5t7Q1Z/v2', 'Robert Chen', '1990-07-22', 'male', 177.80, 81.60, 'maintain', 'moderate', 2000, 'admin', '2025-04-27 19:38:52', '2025-05-01 21:40:37'),
(10, 'Hassanein@gmail.com', 'Hassanein', '$2a$10$1jNT6WQaFM3Z7stNULF9W.d39UE062YpqFuA/bklflGGZAVUfiaJ.', 'Hassanein Sharaf Al Dein', '1992-10-09', 'male', 183.60, 83.00, 'maintain', 'moderate', 2067, 'user', '2025-05-08 18:57:55', '2025-05-29 05:03:16'),
(11, 'Ali@gmail.com', 'ali', '$2a$10$0LOvNgCOHCcJGCgFcY6bouf3iOu9U6UPdTPGoUxTjQHEa0FGF/Pl6', 'Ali Al Attar', '2009-11-14', 'male', 185.00, 75.00, 'gain', 'moderate', 3000, 'user', '2025-05-09 14:09:25', '2025-05-21 20:55:16'),
(12, 'test1@gmail.com', 'test1', '$2a$10$ReUmAWrIGZmuQbHj18ZUL.71TgsPIFXrAcOc5P50ojgzhujDakSRC', 'test test test', '2001-01-01', 'female', 100.00, 100.00, 'lose', 'moderate', 1583, 'user', '2025-05-10 09:19:27', '2025-05-10 09:19:27'),
(13, 'Hello@gmail.com', 'Hello', '$2a$10$Bvmi2Uk1d4ieaefKMDvys.1.Jk0duVHRTeqVGZj6YZRy0W9FuvsN2', 'Hello Hello Hello ', '2002-02-02', 'female', 140.00, 90.00, 'lose', 'light', 1561, 'user', '2025-05-10 09:28:51', '2025-05-10 09:28:51'),
(14, 'MR@gmail.com', 'mr1', '$2a$10$vgVOnAHhDPj8hjI5/RdsaOrt4D9H2omnRWi1Uuu.i.ov2m0GIBLka', 'Mr Mr Mr ', '2003-03-03', 'female', 150.00, 75.00, 'gain', 'moderate', 2695, 'user', '2025-05-10 09:34:43', '2025-05-10 09:34:43'),
(15, 'test2@gmail.com', 'test2', '$2a$10$1hc.TFXO/BxvchAKh6r2OOSCqWzpCDgiVS/bKXZ1ut2jhwUmpjMDS', 'test test test ', '2003-03-03', 'male', 190.00, 85.00, 'gain', 'light', 3157, 'user', '2025-05-10 09:39:29', '2025-05-10 09:39:29'),
(16, 'test4@gmail.com', 'test4', '$2a$10$MOMo7PXp97XKuVV47EOF3eDMToWSPovSi/CCVocLKlT60DMEVTj8W', 'test test test', '2005-04-05', 'male', 150.00, 50.00, 'gain', 'light', 2345, 'user', '2025-05-10 09:43:22', '2025-05-10 09:43:22'),
(17, 'test6@gmail.com', 'test6', '$2a$10$DQoW88XPBfGewSo5K995KeDqiHXBurthUdGzHl6MEm5a4cXnAV7UO', 'test test test', '2004-11-18', 'male', 168.90, 102.00, 'lose', 'active', 2907, 'user', '2025-05-10 09:48:30', '2025-05-10 09:48:30'),
(18, 'test100@gmail.com', 'User100', '$2a$10$VXeQke9fVCg3n8RMdSmgxuSxGIwwHDVors44FyKTuIn8mvx5G0kiG', 'User User', '1993-03-01', 'male', 185.00, 80.00, 'maintain', 'active', 3107, 'user', '2025-05-15 05:20:29', '2025-05-15 05:20:29'),
(19, 'test7@gmail.com', 'test7test', '$2a$10$a2dK6gMtN4IudL7tOxvFRehPo4aPTVIKCI5A1/mU/BMPkNFzTiOJ2', 'test test test', '2009-01-18', 'female', 170.00, 80.00, 'lose', 'active', 2297, 'user', '2025-05-15 06:58:36', '2025-05-15 06:58:36'),
(20, 'test8@gmail.com', 'test8', '$2a$10$68qdB6SVx4ltCIdErkSb8uoVJlIcc0R/uc.ByOx09V31eW54nfi1u', 'test test test ', '2005-11-07', 'female', 158.00, 61.00, 'lose', 'moderate', 1571, 'user', '2025-05-17 20:55:41', '2025-05-17 20:55:41'),
(21, 'test9@gmail.com', 'test9', '$2a$10$/sJUizuSTO5kjVa5VIOq0eSbCpqJYxYawrh13KvuvYww82MFmlnM.', 'test test test ', '2009-11-10', 'male', 145.00, 90.00, 'lose', 'light', 1880, 'user', '2025-05-18 22:11:58', '2025-05-18 22:11:58'),
(22, 'test10@gmail.com', 'test10', '$2a$10$2s0WJk8h2vJn5A.HDbLB9eWQoPwgCJG4T3XIwzPiZzHMfhW2d5mee', 'test test test ', '2009-03-19', 'male', 190.00, 90.00, 'lose', 'light', 2267, 'user', '2025-05-18 22:23:04', '2025-05-18 22:23:04'),
(23, 'test12@gmail.com', 'test12', '$2a$10$PwSU5zyQprGwXHfDd8f/yOagtgqiLcCduRZX.CNXvIBgZnw/.5B/y', 'test test test ', '1999-06-05', 'male', 190.00, 100.00, 'lose', 'moderate', 2696, 'user', '2025-05-20 19:21:57', '2025-05-20 19:21:57'),
(24, 'Admin@Admin.com', 'Admin', '$2a$10$oZy5/q7kmAmIm3Np1KmJcethDRL2a4FAIlTViMc0L2W8xsLg5/B.m', 'Admin ', '2000-01-09', 'male', 180.00, 80.00, 'maintain', 'moderate', 2797, 'admin', '2025-05-20 21:19:28', '2025-05-20 21:20:58'),
(25, 'Deititian@Deititian.com', 'Deititian', '$2a$10$29ZuEByTOebRxrTN/j9eHuW5m3gNapMrF5c425UE4txv52PRs/Exu', 'Dietitian', '2000-01-01', 'male', 180.00, 180.00, 'maintain', 'moderate', 4347, 'dietitian', '2025-05-20 21:23:24', '2025-05-20 21:32:47'),
(26, 'Example@Example.com', 'Example', '$2a$10$A7IR7ByJmrrukEXRmbYJbu47IkwPyQvhscl0d/2KWAOpfFhvh3.F2', 'Example Example Example', '2009-08-07', 'male', 180.00, 80.00, 'lose', 'moderate', 2367, 'user', '2025-05-22 08:39:13', '2025-05-22 08:40:04'),
(27, 'Ali987@liu.com', 'aliS', '$2a$10$3r43KjMNlsEAgGFDbN34KuJkR7TCN5rve5du0/vhN/jP8/POIMfFu', 'Ali Attar', '2003-06-01', 'male', 175.00, 75.00, 'maintain', 'light', 2390, 'user', '2025-05-29 06:11:40', '2025-05-29 06:13:41');

-- --------------------------------------------------------

--
-- Table structure for table `user_dietitian`
--

CREATE TABLE `user_dietitian` (
  `user_id` int(11) NOT NULL,
  `dietitian_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_dietitian`
--

INSERT INTO `user_dietitian` (`user_id`, `dietitian_id`, `assigned_at`) VALUES
(3, 25, '2025-05-22 11:45:24'),
(12, 25, '2025-05-22 11:46:10');

-- --------------------------------------------------------

--
-- Table structure for table `user_goals`
--

CREATE TABLE `user_goals` (
  `user_id` int(11) NOT NULL,
  `target_calories` int(11) NOT NULL,
  `target_protein` decimal(5,2) DEFAULT NULL,
  `target_carbs` decimal(5,2) DEFAULT NULL,
  `target_fats` decimal(5,2) DEFAULT NULL,
  `target_weight` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_goals`
--

INSERT INTO `user_goals` (`user_id`, `target_calories`, `target_protein`, `target_carbs`, `target_fats`, `target_weight`) VALUES
(10, 2067, 129.19, 258.38, 57.42, 87.00),
(11, 3000, 225.00, 337.50, 83.33, 80.00),
(20, 1571, 0.00, 0.00, 0.00, 61.00),
(21, 1880, 0.00, 0.00, 0.00, 90.00),
(22, 2267, 0.00, 0.00, 0.00, 90.00),
(23, 2696, 235.90, 202.20, 104.84, 100.00),
(24, 2797, 174.81, 349.63, 77.69, 80.00),
(25, 4347, 271.69, 543.38, 120.75, 180.00),
(26, 2367, 207.11, 177.53, 92.05, 75.00),
(27, 2390, 149.38, 298.75, 66.39, 70.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `consumed_foods`
--
ALTER TABLE `consumed_foods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_date` (`user_id`,`entry_date`);

--
-- Indexes for table `daily_entries`
--
ALTER TABLE `daily_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`entry_date`),
  ADD KEY `idx_entries_user_date` (`user_id`,`entry_date`),
  ADD KEY `user_id_2` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_users_email` (`email`);

--
-- Indexes for table `user_dietitian`
--
ALTER TABLE `user_dietitian`
  ADD PRIMARY KEY (`user_id`,`dietitian_id`),
  ADD KEY `dietitian_id` (`dietitian_id`);

--
-- Indexes for table `user_goals`
--
ALTER TABLE `user_goals`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `consumed_foods`
--
ALTER TABLE `consumed_foods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `daily_entries`
--
ALTER TABLE `daily_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `consumed_foods`
--
ALTER TABLE `consumed_foods`
  ADD CONSTRAINT `consumed_foods_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `daily_entries`
--
ALTER TABLE `daily_entries`
  ADD CONSTRAINT `daily_entries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_dietitian`
--
ALTER TABLE `user_dietitian`
  ADD CONSTRAINT `user_dietitian_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_dietitian_ibfk_2` FOREIGN KEY (`dietitian_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_goals`
--
ALTER TABLE `user_goals`
  ADD CONSTRAINT `user_goals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
