-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 06, 2025 at 08:52 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ledgerly`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('asset','liability','equity','income','expense') NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `asset_items`
--

CREATE TABLE `asset_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `current_value` decimal(15,2) NOT NULL DEFAULT 0.00,
  `depreciation_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL,
  `sender_type` enum('visitor','admin','system') NOT NULL,
  `sender_name` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `message_type` enum('text','file','system','emoji') DEFAULT 'text',
  `file_path` varchar(500) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_queue`
--

CREATE TABLE `chat_queue` (
  `id` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL,
  `queue_position` int(11) NOT NULL,
  `estimated_wait_time` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_sessions`
--

CREATE TABLE `chat_sessions` (
  `id` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL,
  `visitor_name` varchar(255) DEFAULT NULL,
  `visitor_email` varchar(255) DEFAULT NULL,
  `visitor_phone` varchar(20) DEFAULT NULL,
  `visitor_ip` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `page_url` varchar(500) DEFAULT NULL,
  `status` enum('waiting','active','closed','abandoned') DEFAULT 'waiting',
  `assigned_admin` varchar(100) DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ended_at` timestamp NULL DEFAULT NULL,
  `last_activity` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chat_sessions`
--

INSERT INTO `chat_sessions` (`id`, `session_id`, `visitor_name`, `visitor_email`, `visitor_phone`, `visitor_ip`, `user_agent`, `page_url`, `status`, `assigned_admin`, `priority`, `started_at`, `ended_at`, `last_activity`) VALUES
(1, 'cs_68ec193ea8ac6_1760303422', 'yungtee5333@gmail.com', 'yungtee5333@gmail.com', NULL, NULL, NULL, NULL, 'closed', 'superadmin', 'medium', '2025-10-12 21:10:22', '2025-10-12 21:12:12', '2025-10-12 21:12:12');

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `tax_number` varchar(100) DEFAULT NULL,
  `registration_number` varchar(100) DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `business_type` varchar(100) DEFAULT NULL,
  `established_date` date DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'Nigeria',
  `currency` char(3) NOT NULL DEFAULT 'NGN',
  `tax_rate` decimal(5,2) DEFAULT 7.50,
  `logo_path` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `account_name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `subscription_plan` enum('free','starter','professional','enterprise') DEFAULT 'free',
  `subscription_status` enum('trial','active','expired','cancelled') DEFAULT 'trial',
  `subscription_amount` decimal(10,2) DEFAULT 0.00,
  `subscription_start_date` date DEFAULT NULL,
  `subscription_end_date` date DEFAULT NULL,
  `billing_cycle` enum('monthly','yearly') DEFAULT 'monthly',
  `last_payment_date` date DEFAULT NULL,
  `next_billing_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `email`, `phone`, `website`, `tax_number`, `registration_number`, `billing_address`, `business_type`, `established_date`, `slug`, `address`, `city`, `state`, `country`, `currency`, `tax_rate`, `logo_path`, `bank_name`, `account_number`, `account_name`, `is_active`, `created_at`, `updated_at`, `subscription_plan`, `subscription_status`, `subscription_amount`, `subscription_start_date`, `subscription_end_date`, `billing_cycle`, `last_payment_date`, `next_billing_date`) VALUES
(32, 'TechCorp Ltd', 'admin@techcorp.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Nigeria', 'NGN', 7.50, NULL, NULL, NULL, NULL, 1, '2025-10-29 13:29:36', NULL, 'free', 'trial', 0.00, NULL, NULL, 'monthly', NULL, NULL),
(33, 'Business Solutions Inc', 'info@bizsolve.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Nigeria', 'NGN', 7.50, NULL, NULL, NULL, NULL, 1, '2025-10-29 13:29:36', NULL, 'free', 'trial', 0.00, NULL, NULL, 'monthly', NULL, NULL),
(34, 'Digital Innovations', 'contact@diginnovate.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Nigeria', 'NGN', 7.50, NULL, NULL, NULL, NULL, 1, '2025-10-29 13:29:36', NULL, 'free', 'trial', 0.00, NULL, NULL, 'monthly', NULL, NULL),
(35, 'Enterprise Systems', 'hello@entsys.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Nigeria', 'NGN', 7.50, NULL, NULL, NULL, NULL, 1, '2025-10-29 13:29:36', NULL, 'free', 'trial', 0.00, NULL, NULL, 'monthly', NULL, NULL),
(36, 'StartupCo', 'team@startupco.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Nigeria', 'NGN', 7.50, NULL, NULL, NULL, NULL, 1, '2025-10-29 13:29:36', NULL, 'free', 'trial', 0.00, NULL, NULL, 'monthly', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `company_settings`
--

CREATE TABLE `company_settings` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','number','integer','boolean','json') DEFAULT 'string',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `company_settings`
--

INSERT INTO `company_settings` (`id`, `company_id`, `setting_key`, `setting_value`, `setting_type`, `created_at`, `updated_at`) VALUES
(31, 29, 'receipt_template', '{\"prefix\":\"REC\",\"nextNumber\":1,\"storeName\":\"\",\"storePhone\":\"\",\"storeEmail\":\"\",\"storeAddress\":\"\",\"footerMessage\":\"Thank you for your business!\",\"templateStyle\":\"compact\",\"templateColor\":\"#667eea\",\"currencyPosition\":\"before\",\"defaultPaymentMethod\":\"cash\",\"showLogo\":true,\"showQR\":true,\"showTax\":true,\"showChange\":true}', 'json', '2025-10-27 23:02:49', '2025-10-27 23:02:49'),
(32, 30, 'receipt_template', '{\"prefix\":\"REC\",\"nextNumber\":1,\"storeName\":\"\",\"storePhone\":\"\",\"storeEmail\":\"\",\"storeAddress\":\"\",\"footerMessage\":\"Thank you for your business!\",\"templateStyle\":\"compact\",\"templateColor\":\"#667eea\",\"currencyPosition\":\"before\",\"defaultPaymentMethod\":\"cash\",\"showLogo\":true,\"showQR\":true,\"showTax\":true,\"showChange\":true}', 'json', '2025-10-27 23:28:27', '2025-10-27 23:28:27'),
(33, 31, 'receipt_template', '{\"prefix\":\"REC\",\"nextNumber\":1,\"storeName\":\"\",\"storePhone\":\"\",\"storeEmail\":\"\",\"storeAddress\":\"\",\"footerMessage\":\"Thank you for your business!\",\"templateStyle\":\"compact\",\"templateColor\":\"#667eea\",\"currencyPosition\":\"before\",\"defaultPaymentMethod\":\"cash\",\"showLogo\":true,\"showQR\":true,\"showTax\":true,\"showChange\":true}', 'json', '2025-10-27 23:56:16', '2025-10-27 23:56:16');

-- --------------------------------------------------------

--
-- Table structure for table `company_users`
--

CREATE TABLE `company_users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role` enum('owner','admin','accountant','cashier') NOT NULL DEFAULT 'cashier',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `complaints`
--

CREATE TABLE `complaints` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
  `assigned_to` varchar(100) DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `complaint_attachments`
--

CREATE TABLE `complaint_attachments` (
  `id` int(11) NOT NULL,
  `complaint_id` int(11) NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `complaint_responses`
--

CREATE TABLE `complaint_responses` (
  `id` int(11) NOT NULL,
  `complaint_id` int(11) NOT NULL,
  `responder_type` enum('admin','user') NOT NULL,
  `responder_name` varchar(255) NOT NULL,
  `response` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `participants` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `shipping_address` text DEFAULT NULL,
  `customer_type` enum('individual','business') DEFAULT 'individual',
  `tax_number` varchar(100) DEFAULT NULL,
  `payment_terms` varchar(100) DEFAULT 'Net 30',
  `credit_limit` decimal(15,2) DEFAULT 0.00,
  `balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `db_performance`
--

CREATE TABLE `db_performance` (
  `id` int(11) NOT NULL,
  `query_type` varchar(50) DEFAULT NULL,
  `execution_time` decimal(8,4) DEFAULT NULL,
  `affected_rows` int(11) DEFAULT NULL,
  `query_hash` varchar(64) DEFAULT NULL,
  `database_name` varchar(100) DEFAULT NULL,
  `table_name` varchar(100) DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `error_logs`
--

CREATE TABLE `error_logs` (
  `id` int(11) NOT NULL,
  `error_level` enum('debug','info','warning','error','critical') DEFAULT 'error',
  `error_code` varchar(50) DEFAULT NULL,
  `error_message` text NOT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `line_number` int(11) DEFAULT NULL,
  `stack_trace` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `request_url` varchar(500) DEFAULT NULL,
  `request_method` varchar(10) DEFAULT NULL,
  `occurred_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `reference` varchar(255) NOT NULL DEFAULT '',
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `category` varchar(255) NOT NULL,
  `payee_name` varchar(255) NOT NULL DEFAULT '',
  `description` text DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `expense_date` date NOT NULL,
  `payment_method` enum('cash','bank','card','cheque') DEFAULT 'cash',
  `receipt_number` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feature_toggles`
--

CREATE TABLE `feature_toggles` (
  `id` int(11) NOT NULL,
  `feature_name` varchar(100) NOT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `description` text DEFAULT NULL,
  `target_audience` enum('all','premium_users','beta_users','admins_only') DEFAULT 'all',
  `rollout_percentage` int(11) DEFAULT 100,
  `environment` enum('development','staging','production','all') DEFAULT 'all',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feature_usage`
--

CREATE TABLE `feature_usage` (
  `id` int(11) NOT NULL,
  `feature_name` varchar(100) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `usage_count` int(11) DEFAULT 1,
  `first_used_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_used_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `global_messages`
--

CREATE TABLE `global_messages` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `message` text NOT NULL,
  `message_type` enum('info','success','warning','error','announcement') DEFAULT 'info',
  `target_audience` enum('all','companies','users','admins') DEFAULT 'all',
  `is_active` tinyint(1) DEFAULT 1,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_sequences`
--

CREATE TABLE `invoice_sequences` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `year` year(4) NOT NULL,
  `next_number` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoice_sequences`
--

INSERT INTO `invoice_sequences` (`id`, `company_id`, `year`, `next_number`, `created_at`, `updated_at`) VALUES
(7, 29, '2025', 2, '2025-10-27 23:05:10', '2025-10-27 23:05:38'),
(8, 30, '2025', 2, '2025-10-27 23:30:38', '2025-10-27 23:31:10'),
(9, 31, '2025', 2, '2025-10-27 23:57:47', '2025-10-27 23:58:18');

-- --------------------------------------------------------

--
-- Table structure for table `journal_entries`
--

CREATE TABLE `journal_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `reference_type` varchar(255) DEFAULT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `narration` text DEFAULT NULL,
  `is_posted` tinyint(1) DEFAULT 1,
  `total_amount` decimal(15,2) DEFAULT 0.00,
  `entry_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `journal_lines`
--

CREATE TABLE `journal_lines` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `journal_id` bigint(20) UNSIGNED NOT NULL,
  `account_id` bigint(20) UNSIGNED NOT NULL,
  `debit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `credit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `newsletter_subscriptions`
--

CREATE TABLE `newsletter_subscriptions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `subscribed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `status` enum('active','unsubscribed','bounced') DEFAULT 'active',
  `source_page` varchar(255) DEFAULT 'landing_page',
  `referrer` varchar(500) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `newsletter_subscriptions`
--

INSERT INTO `newsletter_subscriptions` (`id`, `email`, `subscribed_at`, `ip_address`, `user_agent`, `status`, `source_page`, `referrer`, `country`, `city`, `notes`) VALUES
(1, 'yungtee533@gmail.com', '2025-10-10 16:32:32', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'active', 'landing_page', 'http://localhost/Firmaflow/landing.php', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `notification_delivery`
--

CREATE TABLE `notification_delivery` (
  `id` int(11) NOT NULL,
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `delivery_method` enum('web','email','sms','push') DEFAULT 'web',
  `delivery_status` enum('pending','sent','delivered','read','failed') DEFAULT 'pending',
  `read_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `otp_verification`
--

CREATE TABLE `otp_verification` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `otp_code` varchar(6) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 0,
  `attempts` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `otp_verification`
--

INSERT INTO `otp_verification` (`id`, `email`, `otp_code`, `first_name`, `last_name`, `company_name`, `phone`, `password_hash`, `created_at`, `expires_at`, `verified`, `attempts`) VALUES
(3, 'firmaflow2025@gmail.com', '629537', 'Support', 'Team', 'Firmaflow leger', '09078363161', '$2y$10$Spe3ijEbnKFciKoAJPTBj.HfUPD2xVhMLm/88ST/NrHqMnwuk0InS', '2025-10-27 22:59:50', '2025-10-27 23:14:50', 1, 0),
(4, 'firmaflow2025@gmail.com', '760492', 'Support', 'Team', 'Firmaflow leger', '09078363161', '$2y$10$f2hK9T2.mxiq.CSf3FetmOjm2CyIw63b5ALuigP2gNblE95Jf0EN.', '2025-10-27 23:26:22', '2025-10-27 23:41:22', 1, 0),
(5, 'firmaflow2025@gmail.com', '599492', 'Support', 'Team', 'Firmaflow leger', '09078363161', '$2y$10$FpIldmNVzMH4SkZ1wt0zQOW.NzktzCJeG1L9XfS2oVwbxJIcTi97C', '2025-10-27 23:54:02', '2025-10-28 00:09:02', 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_logs`
--

CREATE TABLE `password_reset_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `action` enum('request','verify','reset','cleanup') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `success` tinyint(1) NOT NULL DEFAULT 0,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(6) NOT NULL COMMENT 'OTP Code (6 digits)',
  `expires_at` datetime NOT NULL COMMENT 'Token expiration time (15 minutes from creation)',
  `is_used` tinyint(1) DEFAULT 0 COMMENT 'Whether the token has been used',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `used_at` timestamp NULL DEFAULT NULL COMMENT 'When the token was used',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP address of requester',
  `user_agent` text DEFAULT NULL COMMENT 'Browser/device info'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('received','sent') NOT NULL COMMENT 'received = from customer, sent = to supplier',
  `party_type` enum('customer','supplier') NOT NULL,
  `party_id` bigint(20) UNSIGNED NOT NULL COMMENT 'customer_id or supplier_id',
  `reference` varchar(255) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `method` enum('cash','bank_transfer','cheque','card','mobile_money') NOT NULL DEFAULT 'cash',
  `payment_date` date NOT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'completed',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `receipt_path` varchar(255) DEFAULT NULL COMMENT 'Path to uploaded receipt file (optional)',
  `invoice_total` decimal(15,2) DEFAULT 0.00,
  `balance_before` decimal(15,2) DEFAULT 0.00,
  `balance_after` decimal(15,2) DEFAULT 0.00,
  `invoice_number` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_items`
--

CREATE TABLE `payment_items` (
  `id` int(11) NOT NULL,
  `payment_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 1.00,
  `unit_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_items`
--

INSERT INTO `payment_items` (`id`, `payment_id`, `company_id`, `product_name`, `description`, `quantity`, `unit_price`, `total_price`, `created_at`) VALUES
(21, 32, 29, 'car', '            car          ', 2.00, 15000.00, 30000.00, '2025-10-27 23:06:21'),
(22, 34, 30, 'car', '            car          ', 1.00, 15000.00, 15000.00, '2025-10-27 23:32:05'),
(23, 35, 30, 'car', '            car          ', 1.00, 15000.00, 15000.00, '2025-10-27 23:32:42'),
(24, 37, 31, 'car', '            car          ', 1.00, 15000.00, 15000.00, '2025-10-27 23:59:08');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `sku` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `unit` varchar(255) NOT NULL DEFAULT 'pcs',
  `cost_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `selling_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `track_inventory` tinyint(1) NOT NULL DEFAULT 1,
  `stock_quantity` decimal(15,2) NOT NULL DEFAULT 0.00,
  `reorder_level` decimal(15,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `default_tax_rate_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_bills`
--

CREATE TABLE `purchase_bills` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `bill_no` varchar(255) DEFAULT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `supplier_id` bigint(20) UNSIGNED DEFAULT NULL,
  `bill_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_rate_id` int(11) DEFAULT NULL,
  `total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount_paid` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','received','paid','partially_paid','cancelled') DEFAULT 'draft',
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_lines`
--

CREATE TABLE `purchase_lines` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `purchase_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` text DEFAULT NULL,
  `quantity` decimal(15,2) NOT NULL,
  `unit_cost` decimal(15,2) NOT NULL,
  `line_total` decimal(15,2) NOT NULL,
  `tax_rate_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `revenue_analytics`
--

CREATE TABLE `revenue_analytics` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `subscription_plan` varchar(50) DEFAULT NULL,
  `new_subscriptions` int(11) DEFAULT 0,
  `renewed_subscriptions` int(11) DEFAULT 0,
  `cancelled_subscriptions` int(11) DEFAULT 0,
  `total_revenue` decimal(12,2) DEFAULT 0.00,
  `recurring_revenue` decimal(12,2) DEFAULT 0.00,
  `one_time_revenue` decimal(12,2) DEFAULT 0.00,
  `currency` varchar(3) DEFAULT 'USD',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_status` enum('paid','pending','partial','unpaid','invoiced','cancelled') DEFAULT 'paid',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `company_id`, `customer_id`, `user_id`, `total_amount`, `payment_status`, `created_at`, `updated_at`) VALUES
(5, 30, 28, 33, 14000.00, 'pending', '2025-10-27 23:31:10', '2025-10-27 23:31:10'),
(6, 31, 29, 34, 14000.00, 'pending', '2025-10-27 23:58:18', '2025-10-27 23:58:18');

-- --------------------------------------------------------

--
-- Table structure for table `sales_invoices`
--

CREATE TABLE `sales_invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `invoice_no` varchar(255) NOT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `customer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` enum('draft','sent','paid','partially_paid','cancelled') NOT NULL DEFAULT 'draft',
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(15,2) DEFAULT 0.00,
  `discount_type` enum('fixed','percent') DEFAULT 'fixed',
  `discount_value` decimal(15,2) DEFAULT 0.00,
  `tax_rate_id` int(11) DEFAULT NULL,
  `total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount_paid` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_invoice_lines`
--

CREATE TABLE `sales_invoice_lines` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `invoice_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` text DEFAULT NULL,
  `quantity` decimal(15,2) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `cost_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_rate_id` int(11) DEFAULT NULL,
  `line_total` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff_accounts`
--

CREATE TABLE `staff_accounts` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('support','admin','manager','superadmin') NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `staff_accounts`
--

INSERT INTO `staff_accounts` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `department`, `permissions`, `is_active`, `last_login`, `created_at`, `updated_at`, `created_by`) VALUES
(3, 'superadmin', 'yungtee5333@gmail.com', '$2y$10$TBc1uJn47VkCPcW2KYe/Vuve80Vj1gQM7Cg4X2CW2z3hiAdpu6h2i', 'Benjamin Ndiyo', 'admin', 'System Administration', NULL, 1, '2025-10-29 12:13:54', '2025-10-29 12:10:03', '2025-10-29 12:13:54', '1');

-- --------------------------------------------------------

--
-- Table structure for table `staff_members`
--

CREATE TABLE `staff_members` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'staff',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `permissions` text NOT NULL,
  `created_by` int(11) NOT NULL DEFAULT 1 COMMENT 'ID of superadmin who created this staff',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff_otps`
--

CREATE TABLE `staff_otps` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff_sessions`
--

CREATE TABLE `staff_sessions` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_transactions`
--

CREATE TABLE `stock_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `change_qty` decimal(15,2) NOT NULL,
  `type` enum('purchase','sale','adjustment','transfer') NOT NULL,
  `reference_type` varchar(255) DEFAULT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `transaction_type` varchar(50) NOT NULL DEFAULT 'manual'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_payments`
--

CREATE TABLE `subscription_payments` (
  `id` bigint(20) NOT NULL,
  `company_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `transaction_id` varchar(255) NOT NULL,
  `tx_ref` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'NGN',
  `status` varchar(50) NOT NULL,
  `payment_method` varchar(100) DEFAULT NULL,
  `plan_type` varchar(50) NOT NULL,
  `billing_type` enum('monthly','yearly') DEFAULT 'monthly',
  `subscription_start` datetime NOT NULL,
  `subscription_end` datetime NOT NULL,
  `flutterwave_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_payments`
--

INSERT INTO `subscription_payments` (`id`, `company_id`, `user_id`, `transaction_id`, `tx_ref`, `amount`, `currency`, `status`, `payment_method`, `plan_type`, `billing_type`, `subscription_start`, `subscription_end`, `flutterwave_data`, `created_at`, `updated_at`) VALUES
(1, 32, 1, 'TXN_69021490e7df6', 'REF_69021490e8020', 25000.00, 'NGN', 'completed', 'card', 'basic', 'monthly', '2025-10-01 00:00:00', '2025-11-01 00:00:00', NULL, '2025-10-01 13:08:48', '2025-10-29 13:30:53'),
(2, 33, 2, 'TXN_69021490ee522', 'REF_69021490ee52c', 50000.00, 'NGN', 'completed', 'card', 'standard', 'monthly', '2025-10-03 00:00:00', '2025-11-03 00:00:00', NULL, '2025-10-03 09:55:25', '2025-10-29 13:30:53'),
(3, 34, 3, 'TXN_69021490f1bee', 'REF_69021490f1bf8', 100000.00, 'NGN', 'completed', 'card', 'premium', 'monthly', '2025-10-05 00:00:00', '2025-11-05 00:00:00', NULL, '2025-10-05 21:33:35', '2025-10-29 13:30:53'),
(4, 35, 4, 'TXN_69021491034f6', 'REF_69021491034fc', 500000.00, 'NGN', 'completed', 'card', 'enterprise', 'yearly', '2025-10-07 00:00:00', '2026-10-07 00:00:00', NULL, '2025-10-07 06:30:07', '2025-10-29 13:30:53'),
(5, 36, 5, 'TXN_690214910425f', 'REF_6902149104264', 25000.00, 'NGN', 'pending', 'card', 'basic', 'monthly', '2025-10-10 00:00:00', '2025-11-10 00:00:00', NULL, '2025-10-10 10:39:12', '2025-10-29 13:30:53'),
(6, 32, 1, 'TXN_6902149105051', 'REF_6902149105055', 50000.00, 'NGN', 'failed', 'card', 'standard', 'monthly', '2025-10-12 00:00:00', '2025-11-12 00:00:00', NULL, '2025-10-12 02:10:52', '2025-10-29 13:30:53'),
(7, 33, 1, 'TXN_6902149105b6f', 'REF_6902149105b73', 25000.00, 'NGN', 'completed', 'card', 'basic', 'monthly', '2025-09-01 00:00:00', '2025-10-01 00:00:00', NULL, '2025-09-01 15:03:12', '2025-10-29 13:30:53'),
(8, 34, 2, 'TXN_690214910655d', 'REF_6902149106561', 50000.00, 'NGN', 'completed', 'card', 'standard', 'monthly', '2025-09-03 00:00:00', '2025-10-03 00:00:00', NULL, '2025-09-03 05:10:41', '2025-10-29 13:30:53'),
(9, 35, 3, 'TXN_6902149107310', 'REF_6902149107315', 100000.00, 'NGN', 'completed', 'card', 'premium', 'monthly', '2025-09-05 00:00:00', '2025-10-05 00:00:00', NULL, '2025-09-05 07:44:45', '2025-10-29 13:30:53'),
(10, 36, 4, 'TXN_6902149108124', 'REF_690214910812a', 300000.00, 'NGN', 'completed', 'card', 'premium', 'yearly', '2025-08-15 00:00:00', '2026-08-15 00:00:00', NULL, '2025-08-15 21:31:29', '2025-10-29 13:30:53'),
(11, 32, 5, 'TXN_6902149108a50', 'REF_6902149108a54', 25000.00, 'NGN', 'completed', 'card', 'basic', 'monthly', '2025-08-20 00:00:00', '2025-09-20 00:00:00', NULL, '2025-08-20 04:08:07', '2025-10-29 13:30:53'),
(12, 33, 1, 'TXN_69021491093d5', 'REF_69021491093d9', 25000.00, 'NGN', 'completed', 'card', 'basic', 'monthly', '2025-07-01 00:00:00', '2025-08-01 00:00:00', NULL, '2025-07-01 05:59:26', '2025-10-29 13:30:53'),
(13, 34, 2, 'TXN_6902149109e6c', 'REF_6902149109e70', 50000.00, 'NGN', 'completed', 'card', 'standard', 'monthly', '2025-07-15 00:00:00', '2025-08-15 00:00:00', NULL, '2025-07-15 20:55:56', '2025-10-29 13:30:53');

-- --------------------------------------------------------

--
-- Table structure for table `superadmin_logs`
--

CREATE TABLE `superadmin_logs` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `action` varchar(100) NOT NULL,
  `target_type` varchar(50) DEFAULT NULL,
  `target_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `superadmin_logs`
--

INSERT INTO `superadmin_logs` (`id`, `username`, `action`, `target_type`, `target_id`, `details`, `ip_address`, `user_agent`, `created_at`) VALUES
(5, 'superadmin', 'account_created', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 11:22:35'),
(6, 'superadmin', 'SUPERADMIN_CREATED', NULL, NULL, 'Super admin account created', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 11:29:53'),
(7, 'yungtee5333@gmail.com', 'OTP_REQUESTED', NULL, NULL, 'OTP sent to email', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 11:35:45'),
(8, 'superadmin', 'OTP_LOGIN_SUCCESS', NULL, NULL, 'Successfully logged in with OTP', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 11:36:29'),
(9, 'superadmin', 'logout', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 11:37:07'),
(10, 'yungtee5333@gmail.com', 'OTP_REQUESTED', NULL, NULL, 'OTP sent to email', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 11:37:35'),
(11, 'yungtee5333@gmail.com', 'OTP_REQUESTED', NULL, NULL, 'OTP sent to email', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 11:37:39'),
(12, 'superadmin', 'OTP_LOGIN_SUCCESS', NULL, NULL, 'Successfully logged in with OTP', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 11:39:35'),
(13, 'superadmin', 'logout', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 11:39:59'),
(14, 'superadmin', 'SUPERADMIN_CREATED', NULL, NULL, 'Super admin account created', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 11:41:18'),
(15, 'yungtee5333@gmail.com', 'OTP_REQUESTED', NULL, NULL, 'OTP sent to email', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 11:41:36'),
(16, 'superadmin', 'OTP_LOGIN_SUCCESS', NULL, NULL, 'Successfully logged in with OTP', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 11:42:05'),
(17, 'superadmin', 'logout', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 11:43:04'),
(18, 'superadmin', 'otp_requested', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 12:12:30'),
(19, 'superadmin', 'login_success', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 12:13:54'),
(20, 'superadmin', 'logout', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-10-29 23:43:38');

-- --------------------------------------------------------

--
-- Table structure for table `superadmin_otps`
--

CREATE TABLE `superadmin_otps` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `otp_code` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `superadmin_otps`
--

INSERT INTO `superadmin_otps` (`id`, `user_id`, `email`, `otp_code`, `expires_at`, `used`, `created_at`) VALUES
(1, 3, 'yungtee5333@gmail.com', '137323', '2025-10-29 13:27:26', 1, '2025-10-29 12:12:26');

-- --------------------------------------------------------

--
-- Table structure for table `super_admins`
--

CREATE TABLE `super_admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `role` enum('superadmin','support','manager','analyst') DEFAULT 'superadmin',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `super_admins`
--

INSERT INTO `super_admins` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `role`, `is_active`, `created_at`) VALUES
(2, 'superadmin', 'yungtee5333@gmail.com', '$2y$10$qfwr89SRLOi1Pyc.dtIcNumHCH6Hj37bZNa0E65ZtQMwKWj6jJ86O', 'Benjamin', 'Ndiyo', 'superadmin', 1, '2025-10-29 11:22:35');

-- --------------------------------------------------------

--
-- Table structure for table `super_admin_otps`
--

CREATE TABLE `super_admin_otps` (
  `id` int(11) NOT NULL,
  `super_admin_id` int(11) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `tax_number` varchar(100) DEFAULT '',
  `contact_person` varchar(255) DEFAULT '',
  `payment_terms` varchar(100) DEFAULT 'Net 30',
  `balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_metrics`
--

CREATE TABLE `system_metrics` (
  `id` int(11) NOT NULL,
  `metric_type` enum('cpu','memory','disk','database','response_time','error_rate') NOT NULL,
  `metric_name` varchar(100) NOT NULL,
  `metric_value` decimal(10,4) NOT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `server_name` varchar(100) DEFAULT 'main',
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_notifications`
--

CREATE TABLE `system_notifications` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `notification_type` enum('info','warning','success','error','maintenance') DEFAULT 'info',
  `target_audience` enum('all','companies','specific_users','admins') DEFAULT 'all',
  `target_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `show_until` datetime DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `action_url` varchar(500) DEFAULT NULL,
  `action_text` varchar(100) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `category` varchar(50) DEFAULT 'general',
  `description` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `color` varchar(7) DEFAULT '#2563eb',
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tax_rates`
--

CREATE TABLE `tax_rates` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `rate` decimal(5,2) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `template_settings`
--

CREATE TABLE `template_settings` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `template_type` enum('invoice','receipt','report') NOT NULL,
  `template_name` varchar(100) NOT NULL,
  `template_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `role` enum('admin','manager','user') DEFAULT 'user',
  `avatar` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `subscription_plan` enum('free','starter','professional','enterprise') DEFAULT 'free',
  `billing_type` enum('monthly','yearly') DEFAULT 'monthly',
  `subscription_status` enum('trial','active','expired','cancelled') DEFAULT 'trial',
  `trial_start_date` datetime DEFAULT NULL,
  `trial_end_date` datetime DEFAULT NULL,
  `subscription_start_date` datetime DEFAULT NULL,
  `subscription_end_date` datetime DEFAULT NULL,
  `last_payment_date` datetime DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `company_id`, `name`, `first_name`, `last_name`, `email`, `email_verified_at`, `phone`, `role`, `avatar`, `is_active`, `last_login`, `password`, `remember_token`, `created_at`, `updated_at`, `subscription_plan`, `billing_type`, `subscription_status`, `trial_start_date`, `trial_end_date`, `subscription_start_date`, `subscription_end_date`, `last_payment_date`, `payment_reference`) VALUES
(34, NULL, '', 'Support', 'Team', 'firmaflow2025@gmail.com', NULL, '09078363161', 'admin', NULL, 1, NULL, '$2y$10$FpIldmNVzMH4SkZ1wt0zQOW.NzktzCJeG1L9XfS2oVwbxJIcTi97C', NULL, '2025-10-27 23:54:41', NULL, 'enterprise', 'monthly', 'active', '2025-10-28 00:54:41', '2025-11-11 00:54:41', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_activity`
--

CREATE TABLE `user_activity` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `action_type` varchar(100) NOT NULL,
  `action_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `page_url` varchar(500) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `session_duration` int(11) DEFAULT NULL,
  `occurred_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_online_status`
--

CREATE TABLE `user_online_status` (
  `user_id` int(11) NOT NULL,
  `is_online` tinyint(1) DEFAULT 0,
  `last_seen` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_online_status`
--

INSERT INTO `user_online_status` (`user_id`, `is_online`, `last_seen`) VALUES
(32, 0, '2025-10-27 23:14:37'),
(33, 1, '2025-10-27 23:39:14'),
(34, 1, '2025-10-28 00:04:58');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `accounts_company_id_foreign` (`company_id`),
  ADD KEY `accounts_parent_id_foreign` (`parent_id`);

--
-- Indexes for table `asset_items`
--
ALTER TABLE `asset_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `asset_items_company_id_foreign` (`company_id`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_id` (`session_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_sender_type` (`sender_type`);

--
-- Indexes for table `chat_queue`
--
ALTER TABLE `chat_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_id` (`session_id`),
  ADD KEY `idx_queue_position` (`queue_position`);

--
-- Indexes for table `chat_sessions`
--
ALTER TABLE `chat_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_id` (`session_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_session_id` (`session_id`),
  ADD KEY `idx_assigned_admin` (`assigned_admin`),
  ADD KEY `idx_last_activity` (`last_activity`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `companies_slug_unique` (`slug`),
  ADD KEY `idx_companies_bank_info` (`bank_name`,`account_number`),
  ADD KEY `idx_companies_subscription` (`subscription_status`,`subscription_plan`);

--
-- Indexes for table `company_settings`
--
ALTER TABLE `company_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_company_setting` (`company_id`,`setting_key`),
  ADD KEY `idx_company_id` (`company_id`);

--
-- Indexes for table `company_users`
--
ALTER TABLE `company_users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_users_company_id_foreign` (`company_id`),
  ADD KEY `company_users_user_id_foreign` (`user_id`);

--
-- Indexes for table `complaints`
--
ALTER TABLE `complaints`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `complaint_attachments`
--
ALTER TABLE `complaint_attachments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `complaint_responses`
--
ALTER TABLE `complaint_responses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customers_company_id_foreign` (`company_id`);

--
-- Indexes for table `db_performance`
--
ALTER TABLE `db_performance`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `error_logs`
--
ALTER TABLE `error_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expenses_company_id_foreign` (`company_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `feature_toggles`
--
ALTER TABLE `feature_toggles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_feature_name` (`feature_name`);

--
-- Indexes for table `feature_usage`
--
ALTER TABLE `feature_usage`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `global_messages`
--
ALTER TABLE `global_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `invoice_sequences`
--
ALTER TABLE `invoice_sequences`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `journal_entries_company_id_foreign` (`company_id`);

--
-- Indexes for table `journal_lines`
--
ALTER TABLE `journal_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `journal_lines_journal_id_foreign` (`journal_id`),
  ADD KEY `journal_lines_account_id_foreign` (`account_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `newsletter_subscriptions`
--
ALTER TABLE `newsletter_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_email` (`email`),
  ADD KEY `idx_subscribed_at` (`subscribed_at`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_source_page` (`source_page`);

--
-- Indexes for table `notification_delivery`
--
ALTER TABLE `notification_delivery`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `otp_verification`
--
ALTER TABLE `otp_verification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_otp_code` (`otp_code`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD KEY `password_resets_email_index` (`email`);

--
-- Indexes for table `password_reset_logs`
--
ALTER TABLE `password_reset_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email_action` (`email`,`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email_token` (`email`,`token`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_cleanup` (`expires_at`,`is_used`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payments_company_id_foreign` (`company_id`);

--
-- Indexes for table `payment_items`
--
ALTER TABLE `payment_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_payment_id` (`payment_id`),
  ADD KEY `idx_company_id` (`company_id`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `products_company_id_foreign` (`company_id`);

--
-- Indexes for table `purchase_bills`
--
ALTER TABLE `purchase_bills`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_bills_company_id_foreign` (`company_id`),
  ADD KEY `purchase_bills_supplier_id_foreign` (`supplier_id`),
  ADD KEY `purchase_bills_created_by_foreign` (`created_by`),
  ADD KEY `idx_bill_date` (`bill_date`);

--
-- Indexes for table `purchase_lines`
--
ALTER TABLE `purchase_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_lines_purchase_id_foreign` (`purchase_id`),
  ADD KEY `purchase_lines_product_id_foreign` (`product_id`);

--
-- Indexes for table `revenue_analytics`
--
ALTER TABLE `revenue_analytics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_date_plan` (`date`,`subscription_plan`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_subscription_plan` (`subscription_plan`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sales_invoices`
--
ALTER TABLE `sales_invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sales_invoices_company_id_foreign` (`company_id`),
  ADD KEY `sales_invoices_customer_id_foreign` (`customer_id`),
  ADD KEY `sales_invoices_created_by_foreign` (`created_by`),
  ADD KEY `idx_invoice_date` (`invoice_date`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `sales_invoice_lines`
--
ALTER TABLE `sales_invoice_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sales_invoice_lines_invoice_id_foreign` (`invoice_id`),
  ADD KEY `sales_invoice_lines_product_id_foreign` (`product_id`);

--
-- Indexes for table `staff_accounts`
--
ALTER TABLE `staff_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `username_2` (`username`),
  ADD KEY `email_2` (`email`),
  ADD KEY `role` (`role`),
  ADD KEY `is_active` (`is_active`);

--
-- Indexes for table `staff_members`
--
ALTER TABLE `staff_members`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `staff_otps`
--
ALTER TABLE `staff_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `staff_sessions`
--
ALTER TABLE `staff_sessions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_transactions_company_id_foreign` (`company_id`),
  ADD KEY `stock_transactions_product_id_foreign` (`product_id`);

--
-- Indexes for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `superadmin_logs`
--
ALTER TABLE `superadmin_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `superadmin_otps`
--
ALTER TABLE `superadmin_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_otp_code` (`otp_code`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `super_admins`
--
ALTER TABLE `super_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `super_admin_otps`
--
ALTER TABLE `super_admin_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `super_admin_id` (`super_admin_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `suppliers_company_id_foreign` (`company_id`);

--
-- Indexes for table `system_metrics`
--
ALTER TABLE `system_metrics`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_notifications`
--
ALTER TABLE `system_notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_setting_key` (`setting_key`);

--
-- Indexes for table `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tax_rates`
--
ALTER TABLE `tax_rates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `template_settings`
--
ALTER TABLE `template_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_company_id_foreign` (`company_id`),
  ADD KEY `idx_users_subscription` (`subscription_status`,`subscription_plan`);

--
-- Indexes for table `user_activity`
--
ALTER TABLE `user_activity`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_online_status`
--
ALTER TABLE `user_online_status`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=379;

--
-- AUTO_INCREMENT for table `asset_items`
--
ALTER TABLE `asset_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `chat_queue`
--
ALTER TABLE `chat_queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `chat_sessions`
--
ALTER TABLE `chat_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `company_settings`
--
ALTER TABLE `company_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `company_users`
--
ALTER TABLE `company_users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `complaints`
--
ALTER TABLE `complaints`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `complaint_attachments`
--
ALTER TABLE `complaint_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `complaint_responses`
--
ALTER TABLE `complaint_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `db_performance`
--
ALTER TABLE `db_performance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `error_logs`
--
ALTER TABLE `error_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feature_toggles`
--
ALTER TABLE `feature_toggles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feature_usage`
--
ALTER TABLE `feature_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `global_messages`
--
ALTER TABLE `global_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `invoice_sequences`
--
ALTER TABLE `invoice_sequences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `journal_entries`
--
ALTER TABLE `journal_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=158;

--
-- AUTO_INCREMENT for table `journal_lines`
--
ALTER TABLE `journal_lines`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=315;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `newsletter_subscriptions`
--
ALTER TABLE `newsletter_subscriptions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notification_delivery`
--
ALTER TABLE `notification_delivery`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `otp_verification`
--
ALTER TABLE `otp_verification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `password_reset_logs`
--
ALTER TABLE `password_reset_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `payment_items`
--
ALTER TABLE `payment_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `purchase_bills`
--
ALTER TABLE `purchase_bills`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `purchase_lines`
--
ALTER TABLE `purchase_lines`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `revenue_analytics`
--
ALTER TABLE `revenue_analytics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `sales_invoices`
--
ALTER TABLE `sales_invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `sales_invoice_lines`
--
ALTER TABLE `sales_invoice_lines`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `staff_accounts`
--
ALTER TABLE `staff_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `staff_members`
--
ALTER TABLE `staff_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff_otps`
--
ALTER TABLE `staff_otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `staff_sessions`
--
ALTER TABLE `staff_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `superadmin_logs`
--
ALTER TABLE `superadmin_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `superadmin_otps`
--
ALTER TABLE `superadmin_otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `super_admins`
--
ALTER TABLE `super_admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `super_admin_otps`
--
ALTER TABLE `super_admin_otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `system_metrics`
--
ALTER TABLE `system_metrics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_notifications`
--
ALTER TABLE `system_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tax_rates`
--
ALTER TABLE `tax_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `template_settings`
--
ALTER TABLE `template_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `user_activity`
--
ALTER TABLE `user_activity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `accounts_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `accounts_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `asset_items`
--
ALTER TABLE `asset_items`
  ADD CONSTRAINT `asset_items_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `company_users`
--
ALTER TABLE `company_users`
  ADD CONSTRAINT `company_users_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `company_users_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD CONSTRAINT `journal_entries_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `journal_lines`
--
ALTER TABLE `journal_lines`
  ADD CONSTRAINT `journal_lines_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `journal_lines_journal_id_foreign` FOREIGN KEY (`journal_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchase_bills`
--
ALTER TABLE `purchase_bills`
  ADD CONSTRAINT `purchase_bills_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_bills_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_bills_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `purchase_lines`
--
ALTER TABLE `purchase_lines`
  ADD CONSTRAINT `purchase_lines_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_lines_purchase_id_foreign` FOREIGN KEY (`purchase_id`) REFERENCES `purchase_bills` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sales_invoices`
--
ALTER TABLE `sales_invoices`
  ADD CONSTRAINT `sales_invoices_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sales_invoices_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `sales_invoices_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sales_invoice_lines`
--
ALTER TABLE `sales_invoice_lines`
  ADD CONSTRAINT `sales_invoice_lines_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `sales_invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sales_invoice_lines_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `staff_otps`
--
ALTER TABLE `staff_otps`
  ADD CONSTRAINT `staff_otps_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff_accounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  ADD CONSTRAINT `stock_transactions_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_transactions_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `super_admin_otps`
--
ALTER TABLE `super_admin_otps`
  ADD CONSTRAINT `super_admin_otps_ibfk_1` FOREIGN KEY (`super_admin_id`) REFERENCES `super_admins` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD CONSTRAINT `suppliers_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
