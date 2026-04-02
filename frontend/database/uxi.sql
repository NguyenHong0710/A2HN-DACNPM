-- phpMyvendor SQL Dump
-- version 5.2.1
-- https://www.phpmyvendor.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th3 10, 2026 lúc 04:33 AM
-- Phiên bản máy phục vụ: 11.4.3-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `uxi`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `vendor_notifications`
--

CREATE TABLE `vendor_notifications` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `target_group` enum('ALL','vendor','USER') NOT NULL DEFAULT 'ALL',
  `type` enum('GENERAL','PROMOTION','HOLIDAYS','SYSTEM') NOT NULL DEFAULT 'GENERAL',
  `status` enum('DRAFT','ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `vendor_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `end_time` datetime DEFAULT NULL,
  `cancel_reason` text DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','hidden') DEFAULT 'active',
  `display_order` int(11) DEFAULT 0,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `meta_keywords` varchar(255) DEFAULT NULL,
  `thumbnail` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--
INSERT INTO `categories` (`id`, `name`, `slug`, `parent_id`, `description`, `status`, `display_order`, `meta_title`, `meta_description`, `meta_keywords`, `thumbnail`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Nhẫn bạc', 'nhan-bac', NULL, 'Sản phẩm được làm từ bạc S925 mạ bạch kim.\r\nDù bạn kết hợp chiếc nhẫn xinh xắn này với trang phục nào đi nữa thì đây cũng là dấu ấn thật sự tuyệt vời cho bạn!', 'active', 1, NULL, NULL, NULL, NULL, '2026-03-02 06:51:52', '2026-03-22 02:29:38', NULL),
(2, 'Dây chuyền bạc', 'day-chuyen', NULL, 'Em nó được làm từ bạc 925 chuyên dụng , điểm nhấn bởi những viên đá Cubic Zirconia cao cấp và được chế tác hết sức tỉ mỉ bởi những nghệ nhân lành nghề. Cùng em nó ra ngoài và tỏa sáng thôi nào !!', 'active', 2, NULL, NULL, NULL, NULL, '2026-03-08 08:45:23', '2026-03-22 02:31:29', NULL),
(3, 'Bông tai bạc', 'bong-tai', NULL, 'Khoác lên mình thiết kế độc đáo với những mắt đá hình tròn tinh tế, mang đến vẻ đẹp kiêu kỳ, cá tính và sự trẻ trung cho cô nàng sở hữu. Đây cũng là món quà ý nghĩa mà phái mạnh có thể dành cho phái đẹp như thể hiện sự nâng niu, trân trọng, và bảo vệ người phụ nữ mình yêu.', 'active', 3, NULL, NULL, NULL, NULL, '2026-03-08 08:45:23', '2026-03-22 02:32:37', NULL),
(4, 'Lắc bạc', 'lac-bac', NULL, 'Chiếc lắc được làm từ bạc 925', 'active', 4, NULL, NULL, NULL, NULL, '2026-03-08 08:45:23', '2026-03-22 02:34:04', NULL),
(5, 'Trang sức đôi', 'trang-suc-doi', NULL, 'Trang sức đôi là sự lựa chọn tuyệt vời dành cho những cặp đôi đang yêu nhau như một món quà, kỷ vật theo các bạn đi cùng năm tháng, cùng tình yêu dài lâu', 'active', 5, NULL, NULL, NULL, NULL, '2026-03-08 08:45:23', '2026-03-22 02:35:24', NULL);

--
-- Cấu trúc bảng cho bảng `conversations`
--

CREATE TABLE `conversations` (
  `id` int(11) NOT NULL,
  `user_one` int(11) NOT NULL,
  `user_two` int(11) NOT NULL,
  `last_message` text DEFAULT NULL,
  `last_time` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `conversations`
--

INSERT INTO `conversations` (`id`, `user_one`, `user_two`, `last_message`, `last_time`, `created_at`) VALUES
(20, 6, 9, 'ditme', '2026-01-29 09:44:10', '2026-01-29 07:23:14'),
(21, 8, 6, '0', '2026-03-02 09:56:14', '2026-01-29 07:23:14'),
(22, 8, 26, 'a', '2026-03-05 05:00:35', '2026-03-05 05:00:35'),
(23, 8, 8, 'help', '2026-03-06 08:31:20', '2026-03-06 08:12:27'),
(24, 31, 8, 'okay', '2026-03-06 09:14:41', '2026-03-06 08:31:50');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message_text` text DEFAULT NULL,
  `media_url` text DEFAULT NULL,
  `message_type` enum('text','image','video') DEFAULT 'text',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `receiver_id`, `message_text`, `media_url`, `message_type`, `is_read`, `created_at`) VALUES
(1, 22, 8, 26, 'a', NULL, 'text', 1, '2026-03-05 05:00:35'),
(2, 23, 8, 8, '[CONTACT] Test User <test.user@example.com>: Xin chao tu form lien he', NULL, 'text', 0, '2026-03-06 08:12:27'),
(3, 23, 8, 8, 'lkjsdjhkf', NULL, 'text', 0, '2026-03-06 08:21:39'),
(4, 23, 8, 8, 'ljsdhgfjlasdhlfjads', NULL, 'text', 0, '2026-03-06 08:21:42'),
(5, 23, 8, 8, 'sfadj;klpfsdajl;kfasdjl;kfasdjkl;fasdjk;l', NULL, 'text', 0, '2026-03-06 08:21:48'),
(6, 23, 8, 8, 'dsf;lkj hjglj;kdsfhjgl;jdfsg', NULL, 'text', 0, '2026-03-06 08:21:54'),
(7, 23, 8, 8, 'help', NULL, 'text', 0, '2026-03-06 08:31:20'),
(8, 24, 31, 8, 'a', NULL, 'text', 1, '2026-03-06 08:31:50'),
(9, 24, 31, 8, '[CONTACT] Known User <huutinh582@gmail.com>: hello from known email', NULL, 'text', 1, '2026-03-06 08:57:31'),
(10, 24, 8, 31, 'aaa', NULL, 'text', 0, '2026-03-06 09:10:06'),
(11, 24, 8, 31, 'asdasdasd', NULL, 'text', 0, '2026-03-06 09:10:09'),
(12, 24, 8, 31, 'asd', NULL, 'text', 0, '2026-03-06 09:10:09'),
(13, 24, 8, 31, 'asd', NULL, 'text', 0, '2026-03-06 09:10:09'),
(14, 24, 8, 31, 'asd', NULL, 'text', 0, '2026-03-06 09:10:09'),
(15, 24, 8, 31, 'asd', NULL, 'text', 0, '2026-03-06 09:10:10'),
(16, 24, 31, 8, 'asdasd', NULL, 'text', 1, '2026-03-06 09:10:27'),
(17, 24, 8, 31, 'a', NULL, 'text', 0, '2026-03-06 09:14:39'),
(18, 24, 8, 31, 'okay', NULL, 'text', 0, '2026-03-06 09:14:41');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `message_attachments`
--

CREATE TABLE `message_attachments` (
  `id` int(11) NOT NULL,
  `message_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_code` varchar(20) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `vendor_id` int(11) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `payment_method` enum('Tiền mặt','Chuyển khoản') DEFAULT 'Tiền mặt',
  `payment_status` enum('Chờ thanh toán','Đã thanh toán','Hủy') DEFAULT 'Chờ thanh toán',
  `delivery_status` enum('Chờ lấy hàng','Đang giao hàng','Đã giao hàng','Đã hủy') DEFAULT 'Chờ lấy hàng',
  `shipping_address` text NOT NULL,
  `customer_phone` varchar(15) NOT NULL,
  `cancel_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `order_code`, `customer_id`, `customer_name`, `vendor_id`, `total_amount`, `payment_method`, `payment_status`, `delivery_status`, `shipping_address`, `customer_phone`, `cancel_reason`, `created_at`, `updated_at`) VALUES
(1, '#INV-001', 10, NULL, 6, 350000.00, 'Chuyển khoản', 'Đã thanh toán', 'Đã giao hàng', '123 Đường Lê Lợi, Đà Nẵng', '0905123456', NULL, '2026-01-28 07:42:51', '2026-01-28 08:56:57'),
(2, '#INV-002', 10, NULL, 6, 120000.00, 'Tiền mặt', 'Chờ thanh toán', 'Đã giao hàng', '456 Đường Hùng Vương, Quảng Nam', '0905123456', NULL, '2026-01-28 07:42:51', '2026-03-05 00:53:40'),
(3, '#INV-003', 10, NULL, 6, 500000.00, 'Tiền mặt', 'Hủy', 'Đã hủy', '789 Đường CMT8, TP.HCM', '0905123456', 'Khách hàng không còn nhu cầu mua nữa', '2026-01-28 07:42:51', '2026-01-28 07:42:51'),
(7, '#ORD-1772623718419', 34, NULL, 6, 100.00, 'Tiền mặt', 'Chờ thanh toán', 'Đã giao hàng', 'test', '012345', NULL, '2026-03-04 11:28:38', '2026-03-05 00:53:45'),
(8, '#ORD-1772623804753', 31, NULL, 6, 1107.00, 'Tiền mặt', 'Chờ thanh toán', 'Đang giao hàng', '123123', '012398123', NULL, '2026-03-04 11:30:04', '2026-03-05 00:53:48'),
(9, '#ORD-1772624008295', 35, NULL, 6, 100.00, 'Tiền mặt', 'Chờ thanh toán', 'Đã hủy', 'test', '012345', NULL, '2026-03-04 11:33:28', '2026-03-05 00:53:52'),
(10, '#ORD-1772697014929', 31, 'tinh', 6, 2583.00, 'Tiền mặt', 'Chờ thanh toán', 'Đang giao hàng', 'aaaaaa', '0398729285', NULL, '2026-03-05 07:50:14', '2026-03-08 09:50:55'),
(11, '#ORD-1772789829131', 9, 'E2E Customer', 6, 0.00, 'Tiền mặt', 'Chờ thanh toán', 'Chờ lấy hàng', '123 Test Street', '0900000000', NULL, '2026-03-06 09:37:09', '2026-03-06 09:37:09'),
(12, '#ORD-1772790264106', 31, 'tinh', 6, 491877.00, 'Chuyển khoản', 'Đã thanh toán', 'Đã giao hàng', 'aaaaaa', '0398729285', NULL, '2026-03-06 09:44:24', '2026-03-08 09:51:16'),
(13, '#ORD-1772790992027', 9, 'Stock Test', 6, 123.00, 'Tiền mặt', 'Chờ thanh toán', 'Đã giao hàng', 'Test Addr', '0900000000', NULL, '2026-03-06 09:56:32', '2026-03-08 09:51:14'),
(14, '#ORD-1772791014752', 9, 'Stock Test', 6, 123.00, 'Tiền mặt', 'Chờ thanh toán', 'Đã giao hàng', 'Test Addr', '0900000000', NULL, '2026-03-06 09:56:54', '2026-03-08 09:51:12'),
(15, '#ORD-1772963341107', 31, 'tinh', 41, 1118000.00, 'Tiền mặt', 'Chờ thanh toán', 'Đã giao hàng', 'aaaaaa', '0398729285', NULL, '2026-03-08 09:49:01', '2026-03-08 09:51:10'),
(16, '#ORD-1772963372172', 37, 'tinh', 41, 176000.00, 'Tiền mặt', 'Chờ thanh toán', 'Đã giao hàng', 'eslkrthghersdtfhglj;', '0398729285', NULL, '2026-03-08 09:49:32', '2026-03-08 09:51:08');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `unit`, `quantity`, `price`) VALUES
(1, 1, 101, 'Gạo ST25', 'kg', 5, 30000.00),
(2, 1, 102, 'Sầu riêng Ri6', 'kg', 2, 100000.00),
(3, 2, 103, 'Cà chua bi', 'Hộp', 4, 30000.00),
(4, 3, 104, 'Dâu tây Đà Lạt', 'Hộp', 2, 250000.00),
(5, 7, 6, '123', 'kg', 1, 100.00),
(6, 8, 6, '123', 'kg', 6, 123.00),
(7, 8, 7, '1234', 'kg', 3, 123.00),
(8, 9, 6, '123', 'kg', 1, 100.00),
(9, 10, 7, '1234', 'kg', 21, 123.00),
(10, 11, 6, '123', NULL, 1, 123.00),
(11, 12, 7, '1234', 'kg', 3999, 123.00),
(12, 13, 6, '123', 'kg', 1, 123.00),
(13, 14, 6, '123', 'kg', 1, 123.00),
(14, 15, 77, 'Quế thanh', 'gói', 8, 65000.00),
(15, 15, 74, 'Hành tím', 'kg', 8, 36000.00),
(16, 15, 75, 'Lá chanh', 'bó', 9, 18000.00),
(17, 15, 72, 'Nước chanh dây', 'chai', 4, 37000.00),
(18, 16, 47, 'Sả cây', 'bó', 8, 22000.00);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_tracking`
--

CREATE TABLE `order_tracking` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `status_title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `order_tracking`
--

INSERT INTO `order_tracking` (`id`, `order_id`, `status_title`, `description`, `created_at`) VALUES
(1, 1, 'vendor đã giao hàng', 'Đã lấy hàng từ Nông trại.', '2026-02-05 03:00:00'),
(2, 1, 'Đã nhập kho trung chuyển', 'Kho trung tâm TP.HCM', '2026-02-05 09:00:00'),
(3, 1, 'Đang giao hàng', 'Shipper đang trên đường giao đến bạn.', '2026-02-06 02:30:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payout_requests`
--

CREATE TABLE `payout_requests` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `balance_available` decimal(15,2) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `bank_name` varchar(100) NOT NULL,
  `bank_account` varchar(100) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `vendor_note` text DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `payout_requests`
--

INSERT INTO `payout_requests` (`id`, `code`, `vendor_id`, `balance_available`, `amount`, `bank_name`, `bank_account`, `status`, `notes`, `vendor_note`, `approved_by`, `approved_at`, `created_at`, `updated_at`, `deleted_at`) VALUES
(4, 'PAY-1001', 27, 15000000.00, 5000000.00, 'Vietcombank', '0123456789', 'approved', 'Yêu cầu rút định kỳ tuần 1 tháng 3.', NULL, NULL, '2026-03-08 09:50:47', '2026-03-01 01:30:00', '2026-03-08 09:50:47', NULL),
(5, 'PAY-1002', 28, 25000000.00, 15450000.00, 'MB Bank', '9876543210', 'approved', 'Rút doanh thu tháng 2.', NULL, NULL, NULL, '2026-02-28 08:00:00', '2026-03-02 08:30:01', NULL),
(6, 'PAY-1003', 27, 8000000.00, 8000000.00, 'Techcombank', '190333444555', 'pending', 'Rút toàn bộ số dư khả dụng.', NULL, NULL, NULL, '2026-03-02 02:15:00', '2026-03-02 08:30:01', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `price` decimal(15,2) NOT NULL,
  `stock` int(11) DEFAULT 0,
  `unit` varchar(50) DEFAULT NULL,
  `origin` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('Còn hàng','Hết hàng','Sắp có hàng') DEFAULT 'Còn hàng',
  `approval_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `is_banned` tinyint(1) DEFAULT 0,
  `ban_reason` text DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `products`
--

INSERT INTO `products` (`id`, `vendor_id`, `name`, `category`, `price`, `stock`, `unit`, `origin`, `description`, `status`, `approval_status`, `is_banned`, `ban_reason`, `images`, `created_at`, `updated_at`) VALUES
(6, 6, '123', 'Rau Củ', 123.00, 133, 'kg', '', '123', 'Còn hàng', 'approved', 0, NULL, '[\"http:\\/\\/localhost\\/nongsan-api\\/uploads\\/1769584644_0_Screenshot 2026-01-17 111936.png\",\"http:\\/\\/localhost\\/nongsan-api\\/uploads\\/1769584757_Screenshot 2026-01-16 212515.png\"]', '2026-01-28 07:17:24', '2026-03-06 09:56:54'),
(7, 6, '1234', 'Rau Củ', 123.00, 13, 'kg', '', '123', 'Còn hàng', 'approved', 0, NULL, '[\"http:\\/\\/localhost\\/nongsan-api\\/uploads\\/1769682242_0_Screenshot 2026-01-17 113751.png\"]', '2026-01-29 10:24:02', '2026-01-29 10:24:31'),
(8, 26, 'Test', 'Trái Cây', 149000.00, 9999, 'kg', 'Korean', 'asd\'l;asd\'l;asd\'l;asd\';lasd\';lasd\'l;asd\'l;asd;l\'asd\';lasd\';lasd\';lczx.m,czx.m,zcx.,mzxc.m,qweiowqeop[qew[opsdafkl;asfdsfda', 'Còn hàng', 'approved', 0, NULL, '[\"http:\\/\\/localhost\\/nongsan-api\\/uploads\\/1772793679_0.jpg\",\"http:\\/\\/localhost\\/nongsan-api\\/uploads\\/1772793679_1.jpg\",\"http:\\/\\/localhost\\/nongsan-api\\/uploads\\/1772793679_2.jpg\",\"http:\\/\\/localhost\\/nongsan-api\\/uploads\\/1772793679_3.jpg\",\"http:\\/\\/localhost\\/nongsan-api\\/uploads\\/1772793679_4.jpg\"]', '2026-03-06 10:41:19', '2026-03-07 06:51:46'),
(29, 41, 'Cà rốt Đà Lạt', 'Rau Củ', 32000.00, 180, 'kg', 'Đà Lạt', 'Ca rot gion ngon.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/rau-cu-ca-rot.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(30, 41, 'Cải thìa hữu cơ', 'Rau Củ', 28000.00, 150, 'kg', 'Lâm Đồng', 'Cai thia la xanh.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/rau-cu-cai-thia.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(31, 41, 'Bông cải xanh', 'Rau Củ', 45000.00, 120, 'kg', 'Đà Lạt', 'Bong cai tuoi ngon.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/rau-cu-bong-cai.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(32, 41, 'Khoai tây nông trại', 'Rau Củ', 26000.00, 220, 'kg', 'Đắk Nông', 'Khoai tay ruot vang.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/rau-cu-khoai-tay.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(33, 41, 'Táo đỏ New Zealand', 'Trái Cây', 98000.00, 90, 'kg', 'New Zealand', 'Tao do gion ngot.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/trai-cay-tao.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(34, 41, 'Cam vàng Ai Cập', 'Trái Cây', 76000.00, 110, 'kg', 'Ai Cập', 'Cam vang mong nuoc.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/trai-cay-cam.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(35, 41, 'Nho đen không hạt', 'Trái Cây', 125000.00, 70, 'kg', 'Úc', 'Nho den ngot dam.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/trai-cay-nho.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(36, 41, 'Dưa hấu đỏ Việt', 'Trái Cây', 30000.00, 140, 'kg', 'Long An', 'Dua hau do nhieu nuoc.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/trai-cay-dua-hau.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(37, 41, 'Gạo lứt hữu cơ', 'Ngũ Cốc', 52000.00, 200, 'kg', 'An Giang', 'Gao lut sach.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/ngu-coc-gao-lut.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(38, 41, 'Yến mạch cán', 'Ngũ Cốc', 88000.00, 95, 'hộp', 'Canada', 'Yen mach nguyen chat.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/ngu-coc-yen-mach.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(39, 41, 'Đậu đỏ hạt nhỏ', 'Ngũ Cốc', 48000.00, 130, 'kg', 'Đắk Lắk', 'Dau do bo duong.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/ngu-coc-dau-do.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(40, 41, 'Hạt chia loại 1', 'Ngũ Cốc', 115000.00, 85, 'gói', 'Peru', 'Hat chia giau omega 3.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/ngu-coc-hat-chia.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(41, 41, 'Nước cam ép nguyên chất', 'Đồ Uống Tự Nhiên', 39000.00, 160, 'chai', 'Đà Nẵng', 'Nuoc cam ep trong ngay.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/do-uong-nuoc-cam.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(42, 41, 'Sữa hạt hạnh nhân', 'Đồ Uống Tự Nhiên', 55000.00, 105, 'chai', 'TP.HCM', 'Sua hat thanh mat.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/do-uong-sua-hat.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(43, 41, 'Trà xanh mật ong', 'Đồ Uống Tự Nhiên', 42000.00, 125, 'chai', 'Bảo Lộc', 'Tra xanh diu nhe.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/do-uong-tra-xanh.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(44, 41, 'Nước detox dưa leo', 'Đồ Uống Tự Nhiên', 36000.00, 145, 'chai', 'Đà Nẵng', 'Detox mat lanh.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/do-uong-detox.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(45, 41, 'Tỏi cô đơn', 'Gia Vị', 34000.00, 175, 'kg', 'Lý Sơn', 'Toi mui thom dac trung.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/gia-vi-toi.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(46, 41, 'Gừng tươi', 'Gia Vị', 27000.00, 165, 'kg', 'Quảng Nam', 'Gung cay nong.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/gia-vi-gung.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:53:47'),
(47, 41, 'Sả cây', 'Gia Vị', 22000.00, 202, 'bó', 'Huế', 'Sa cay thom.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/gia-vi-sa.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 09:49:32'),
(48, 41, 'Ớt đỏ hữu cơ', 'Gia Vị', 31000.00, 190, 'kg', 'Quảng Ngãi', 'Ot do cay nong.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/gia-vi-ot.jpg\"]', '2026-03-08 08:53:47', '2026-03-08 08:54:02'),
(49, 41, 'Cải bó xôi', 'Rau Củ', 34000.00, 140, 'kg', 'Đà Lạt', 'La xanh non, phu hop lam salad.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/rau-cu-cai-bo-xoi.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(50, 41, 'Su hào', 'Rau Củ', 26000.00, 160, 'kg', 'Lâm Đồng', 'Su hao gion, ngot tu nhien.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/rau-cu-su-hao.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(51, 41, 'Củ dền', 'Rau Củ', 39000.00, 120, 'kg', 'Đà Lạt', 'Mau dep, nhieu chat chong oxy hoa.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/rau-cu-cu-den.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(52, 41, 'Bí đỏ', 'Rau Củ', 28000.00, 150, 'kg', 'Gia Lai', 'Bi do deo, ngon cho mon ham.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/rau-cu-bi-do.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(53, 41, 'Măng tây xanh', 'Rau Củ', 79000.00, 95, 'kg', 'Ninh Thuận', 'Mang tay gion, giau chat xo.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/rau-cu-mang-tay.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(54, 41, 'Bắp cải tím', 'Rau Củ', 32000.00, 130, 'kg', 'Đà Lạt', 'Bap cai tim ngon cho salad.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/rau-cu-bap-cai-tim.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(55, 41, 'Chuối già', 'Trái Cây', 29000.00, 180, 'kg', 'Bến Tre', 'Chuoi ngot dam, chin tu nhien.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/trai-cay-chuoi.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(56, 41, 'Xoài cát Hòa Lộc', 'Trái Cây', 85000.00, 100, 'kg', 'Tiền Giang', 'Xoai cat thom, it xo.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/trai-cay-xoai.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(57, 41, 'Bưởi da xanh', 'Trái Cây', 62000.00, 105, 'kg', 'Bến Tre', 'Buoi tep hong, vi ngot thanh.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/trai-cay-buoi.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(58, 41, 'Lê Nam Phi', 'Trái Cây', 92000.00, 80, 'kg', 'Nam Phi', 'Le gion, ngot mat.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/trai-cay-le.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(59, 41, 'Dứa mật', 'Trái Cây', 36000.00, 135, 'kg', 'Tiền Giang', 'Dua mat huong thom dam.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/trai-cay-dua.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(60, 41, 'Thanh long đỏ', 'Trái Cây', 54000.00, 120, 'kg', 'Bình Thuận', 'Thanh long ruot do ngot nhe.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/trai-cay-thanh-long.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(61, 41, 'Hạt quinoa', 'Ngũ Cốc', 148000.00, 70, 'gói', 'Peru', 'Ngu coc cao cap giau dam thuc vat.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/ngu-coc-quinoa.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(62, 41, 'Đậu xanh nguyên hạt', 'Ngũ Cốc', 42000.00, 150, 'kg', 'Đồng Tháp', 'Dau xanh ngon cho che va xoi.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/ngu-coc-dau-xanh.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(63, 41, 'Mè đen', 'Ngũ Cốc', 68000.00, 110, 'kg', 'Quảng Ngãi', 'Me den bo duong, dung lam sua hat.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/ngu-coc-me-den.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(64, 41, 'Hạt óc chó', 'Ngũ Cốc', 185000.00, 65, 'gói', 'Mỹ', 'Oc cho giau omega 3.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/ngu-coc-oc-cho.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(65, 41, 'Hạt điều rang mộc', 'Ngũ Cốc', 132000.00, 90, 'gói', 'Bình Phước', 'Hat dieu beo ngon, khong tam gia vi.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/ngu-coc-hat-dieu.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(66, 41, 'Ngô ngọt sấy', 'Ngũ Cốc', 58000.00, 115, 'gói', 'Sơn La', 'Ngo say gion, an vat lanh manh.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/ngu-coc-ngo-say.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(67, 41, 'Nước dừa tươi', 'Đồ Uống Tự Nhiên', 25000.00, 170, 'chai', 'Bến Tre', 'Nuoc dua thanh mat, bo sung khoang.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/do-uong-nuoc-dua.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(68, 41, 'Sữa đậu nành', 'Đồ Uống Tự Nhiên', 28000.00, 165, 'chai', 'TP.HCM', 'Sua dau nanh beo nhe, de uong.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/seed-products/do-uong-sua-dau-nanh.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 08:59:13'),
(69, 41, 'Trà atiso', 'Đồ Uống Tự Nhiên', 45000.00, 120, 'chai', 'Đà Lạt', 'Tra atiso thanh nhiet co the.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/curated-products/top10-tra-atiso.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 09:13:06'),
(70, 41, 'Nước ép táo', 'Đồ Uống Tự Nhiên', 41000.00, 130, 'chai', 'Đà Nẵng', 'Nuoc ep tao thom ngon, it duong.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/curated-products/top10-nuoc-ep-tao.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 09:13:06'),
(71, 41, 'Kombucha gừng', 'Đồ Uống Tự Nhiên', 62000.00, 90, 'chai', 'Hà Nội', 'Kombucha men tu nhien vi gung.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/curated-products/top10-kombucha-gung.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 09:13:06'),
(72, 41, 'Nước chanh dây', 'Đồ Uống Tự Nhiên', 37000.00, 136, 'chai', 'Gia Lai', 'Chanh day thom, chua ngot can bang.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/curated-products/top10-nuoc-chanh-day.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 09:49:01'),
(73, 41, 'Nghệ tươi', 'Gia Vị', 30000.00, 180, 'kg', 'Nghệ An', 'Nghe tuoi vang dam, mui thom.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/curated-products/top10-nghe-tuoi.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 09:13:06'),
(74, 41, 'Hành tím', 'Gia Vị', 36000.00, 167, 'kg', 'Sóc Trăng', 'Hanh tim kho, vi cay nhe.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/curated-products/top10-hanh-tim.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 09:49:01'),
(75, 41, 'Lá chanh', 'Gia Vị', 18000.00, 141, 'bó', 'Huế', 'La chanh thom dung cho mon ga.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/curated-products/top10-la-chanh.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 09:49:01'),
(76, 41, 'Tiêu đen xay', 'Gia Vị', 76000.00, 110, 'hũ', 'Phú Quốc', 'Tieu den xay mui nong dac trung.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/curated-products/top10-tieu-den-xay.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 09:13:06'),
(77, 41, 'Quế thanh', 'Gia Vị', 65000.00, 92, 'gói', 'Yên Bái', 'Que thanh thom am, dung ham tra.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/curated-products/top10-que-thanh.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 09:49:01'),
(78, 41, 'Hồi khô', 'Gia Vị', 82000.00, 90, 'gói', 'Lạng Sơn', 'Hoi kho tao mui thom cho pho.', '', 'approved', 0, NULL, '[\"http://localhost/nongsan-api/uploads/curated-products/top10-hoi-kho.jpg\"]', '2026-03-08 08:59:13', '2026-03-08 09:13:06');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_reviews`
--

CREATE TABLE `product_reviews` (
  `id` int(11) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `vendor_name` varchar(255) NOT NULL,
  `rating` tinyint(4) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text NOT NULL,
  `review_img` varchar(500) DEFAULT NULL,
  `status` enum('Pending','Approved','Flagged') DEFAULT 'Pending',
  `review_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `product_reviews`
--

INSERT INTO `product_reviews` (`id`, `customer_name`, `product_name`, `vendor_name`, `rating`, `comment`, `review_img`, `status`, `review_date`, `created_at`, `updated_at`) VALUES
(1, 'Nguyễn Minh', 'Sầu riêng Ri6', 'Nông trại Xanh', 5, 'Trái rất ngon, cơm vàng hạt lép đúng như mô tả!', 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=800', 'Approved', '2026-02-06', '2026-03-02 10:57:27', '2026-03-02 10:57:27'),
(2, 'Trần Hùng', 'Cà chua Beef', 'Vườn Đà Lạt', 1, 'Hàng giao đến bị dập nát hết rồi, yêu cầu hoàn tiền ngay lập tức!!!', 'https://images.unsplash.com/photo-1518977676601-b53f02ac6d31?w=800', 'Pending', '2026-02-05', '2026-03-02 10:57:27', '2026-03-02 10:57:27'),
(3, 'SpamBot_99', 'Măng cụt', 'Sạch Toàn Diện', 5, 'Bấm vào link này để nhận quà miễn phí: bit.ly/xxx', NULL, 'Flagged', '2026-02-04', '2026-03-02 10:57:27', '2026-03-02 10:57:27');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `promotions`
--

CREATE TABLE `promotions` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('percent','fixed') NOT NULL,
  `value` decimal(15,2) NOT NULL,
  `min_order_value` decimal(15,2) DEFAULT 0.00,
  `max_discount_value` decimal(15,2) DEFAULT NULL,
  `scope` enum('order','product') NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `usage_limit` int(11) DEFAULT 100,
  `used_count` int(11) DEFAULT 0,
  `limit_per_user` int(11) DEFAULT 1,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `promotions`
--

INSERT INTO `promotions` (`id`, `code`, `name`, `description`, `type`, `value`, `min_order_value`, `max_discount_value`, `scope`, `product_id`, `vendor_id`, `start_date`, `end_date`, `usage_limit`, `used_count`, `limit_per_user`, `status`, `created_at`) VALUES
(4, '12', '3123', NULL, 'percent', 123.00, 0.00, NULL, 'order', NULL, 6, '2026-01-29', '2026-05-30', 100, 0, 1, 1, '2026-01-29 10:17:56'),
(5, '124', '123', NULL, 'percent', 12.00, 0.00, NULL, 'product', 6, 6, '2026-01-29', '2026-05-31', 100, 0, 1, 0, '2026-01-29 10:27:43'),
(6, 'E2E0306103653', 'E2E Voucher', 'Automated E2E voucher', 'fixed', 10000.00, 0.00, NULL, 'order', NULL, 6, '2026-03-05', '2026-03-13', 5, 1, 1, 1, '2026-03-06 09:36:53');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `promotion_products`
--

CREATE TABLE `promotion_products` (
  `promotion_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `promotion_usages`
--

CREATE TABLE `promotion_usages` (
  `id` int(11) NOT NULL,
  `promotion_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `promotion_usages`
--

INSERT INTO `promotion_usages` (`id`, `promotion_id`, `customer_id`, `order_id`, `used_at`) VALUES
(1, 6, 9, 11, '2026-03-06 09:37:09');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `promo_banners`
--

CREATE TABLE `promo_banners` (
  `id` int(11) NOT NULL,
  `position` int(11) NOT NULL,
  `image_path` text NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `refund_requests`
--

CREATE TABLE `refund_requests` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reason` text NOT NULL,
  `notes` text DEFAULT NULL,
  `vendor_note` text DEFAULT NULL,
  `status` enum('pending','dispute','approved','rejected') DEFAULT 'pending',
  `resolved_by` int(11) DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `refund_requests`
--

INSERT INTO `refund_requests` (`id`, `code`, `order_id`, `customer_id`, `vendor_id`, `amount`, `reason`, `notes`, `vendor_note`, `status`, `resolved_by`, `resolved_at`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'REF-2001', 4410, 9, 27, 450000.00, 'Hàng dập nát khi vận chuyển', 'Khách đã gửi video khui hàng.', NULL, 'dispute', NULL, NULL, '2026-03-01 03:20:00', '2026-03-02 08:30:01', NULL),
(2, 'REF-2002', 5520, 9, 28, 220000.00, 'Giao thiếu số lượng', 'Thiếu 2kg cam.', NULL, 'pending', NULL, NULL, '2026-03-02 07:05:00', '2026-03-02 08:30:01', NULL),
(3, 'REF-2003', 4088, 9, 27, 150000.00, 'Sản phẩm hết hạn sử dụng', 'Sữa tươi hết hạn.', NULL, 'approved', NULL, NULL, '2026-02-25 02:00:00', '2026-03-02 08:30:01', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `target_type` enum('product','vendor') NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text NOT NULL,
  `reply` text DEFAULT NULL,
  `status` enum('visible','pending','reported') DEFAULT 'visible',
  `report_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `reviews`
--

INSERT INTO `reviews` (`id`, `customer_id`, `vendor_id`, `product_id`, `target_type`, `rating`, `comment`, `reply`, `status`, `report_reason`, `created_at`) VALUES
(1, 9, 6, 6, 'product', 5, 'Sản phẩm rất tuyệt vời, giao hàng nhanh!', NULL, 'visible', NULL, '2026-01-29 06:42:26'),
(2, 9, 6, NULL, 'vendor', 4, 'Gian hàng phục vụ tốt, đóng gói kỹ.', 'cam ơn bạn', 'visible', 'spam', '2026-01-29 06:43:42');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sale`
--

CREATE TABLE `sale` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('Flash Sale','Voucher','Discount') NOT NULL DEFAULT 'Flash Sale',
  `discount_value` decimal(15,2) NOT NULL,
  `status` enum('Active','Expired','Hidden') NOT NULL DEFAULT 'Active',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `usage_count` int(11) NOT NULL DEFAULT 0,
  `usage_limit` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `sale`
--

INSERT INTO `sale` (`id`, `name`, `type`, `discount_value`, `status`, `start_date`, `end_date`, `usage_count`, `usage_limit`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Flash Sale Tết Nguyên Đán', 'Flash Sale', 40.00, 'Expired', '2026-01-25', '2026-02-10', 450, 500, '2026-03-02 08:13:37', '2026-03-02 08:13:56', NULL),
(2, 'Voucher Người Mới', 'Voucher', 20000.00, 'Active', '2026-01-01', '2026-12-31', 1200, NULL, '2026-03-02 08:13:37', '2026-03-02 08:13:37', NULL),
(3, 'Xả Kho Rau Củ Đà Lạt', 'Discount', 50.00, 'Expired', '2026-01-10', '2026-01-20', 300, 300, '2026-03-02 08:13:37', '2026-03-02 08:13:37', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `shipping`
--

CREATE TABLE `shipping` (
  `id` int(11) NOT NULL,
  `shipping_code` varchar(20) NOT NULL,
  `order_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `method` enum('Giao nhanh','Giao nội thành','Tự giao') DEFAULT 'Giao nội thành',
  `status` enum('Chờ lấy hàng','Đang giao hàng','Giao thành công','Giao thất bại','Đã hủy') DEFAULT 'Chờ lấy hàng',
  `estimated_time` datetime DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `shipping`
--

INSERT INTO `shipping` (`id`, `shipping_code`, `order_id`, `vendor_id`, `customer_id`, `method`, `status`, `estimated_time`, `note`, `created_at`, `updated_at`) VALUES
(3, 'VD-#INV-001', 1, 6, 10, 'Giao nội thành', 'Giao thành công', '2026-01-31 13:35:00', 'Hàng nông sản tươi, giao nhanh', '2026-01-29 06:35:58', '2026-01-29 06:36:19'),
(4, 'VD-#INV-002', 2, 6, 10, 'Giao nội thành', 'Đang giao hàng', '2026-01-31 13:35:58', 'Hàng nông sản tươi, giao nhanh', '2026-01-29 06:35:58', '2026-01-29 06:35:58');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `shipping_carriers`
--

CREATE TABLE `shipping_carriers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `contact_phone` varchar(50) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `shipping_carriers`
--

INSERT INTO `shipping_carriers` (`id`, `name`, `type`, `is_active`, `contact_phone`, `logo_url`, `created_at`) VALUES
(1, 'Giao Hàng Nhanh (GHN)', 'Bên thứ 3', 1, '1900 636683', 'https://api.dicebear.com/7.x/initials/svg?seed=GHN', '2026-03-02 08:53:50'),
(2, 'Đội Ship Nội Bộ', 'Nội bộ', 1, '0901 222 333', 'https://api.dicebear.com/7.x/initials/svg?seed=NB', '2026-03-02 08:53:50');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `shipping_rates`
--

CREATE TABLE `shipping_rates` (
  `id` int(11) NOT NULL,
  `zone_name` varchar(255) NOT NULL,
  `product_type` varchar(255) NOT NULL,
  `base_price` decimal(15,2) NOT NULL,
  `price_per_kg` decimal(15,2) NOT NULL,
  `express_surcharge` decimal(15,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `shipping_rates`
--

INSERT INTO `shipping_rates` (`id`, `zone_name`, `product_type`, `base_price`, `price_per_kg`, `express_surcharge`, `is_active`, `created_at`) VALUES
(1, 'Nội thành TP.HCM', 'Rau củ', 15000.00, 6000.00, 10000.00, 1, '2026-03-02 08:53:50'),
(2, 'Liên tỉnh', 'Đông lạnh', 45000.00, 12000.00, 25000.00, 1, '2026-03-02 08:53:50');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `system_banners`
--

CREATE TABLE `system_banners` (
  `id` int(11) NOT NULL,
  `banner_key` varchar(50) NOT NULL,
  `image_path` text NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `system_banners`
--

INSERT INTO `system_banners` (`id`, `banner_key`, `image_path`, `updated_at`) VALUES
(1, 'login', 'uploads/banners/sys_login_1772453728.jpg', '2026-03-02 12:15:28'),
(2, 'register', 'uploads/banners/sys_register_1772454831.jpg', '2026-03-02 12:33:51'),
(7, 'user_hero', 'uploads/banners/sys_user_hero_1772450394.png', '2026-03-02 11:19:54');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tickets`
--

CREATE TABLE `tickets` (
  `id` varchar(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `priority` enum('Thấp','Thường','Cao') DEFAULT 'Thường',
  `status` enum('Mới','Đang xử lý','Đã đóng') DEFAULT 'Mới',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ticket_messages`
--

CREATE TABLE `ticket_messages` (
  `id` int(11) NOT NULL,
  `ticket_id` varchar(20) DEFAULT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `message_text` text DEFAULT NULL,
  `image_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`image_urls`)),
  `is_vendor_reply` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `shop_name` varchar(255) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `role` enum('vendor','customer','vendor') NOT NULL DEFAULT 'customer',
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `is_online` tinyint(1) DEFAULT 0,
  `address` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `name`, `shop_name`, `avatar`, `role`, `email`, `phone`, `password`, `is_online`, `address`, `description`, `is_approved`, `created_at`, `updated_at`) VALUES
(6, 'mặt hàng xanh', 'Cửa hàng bán Táo', 'http://localhost/nongsan-api/uploads/avatars/1770532030_Screenshot 2025-02-27 174835.png', 'vendor', '1@gmail.com', '0816931074', '$2y$10$yF/muXJytBQShafJTTsQO.o.aO3OSFBYkkFwLBefN6NNJifEPpA8i', 1, 'Quảng Trị', 'Toàn đồ sạch', 1, '2026-01-28 04:50:55', '2026-03-04 07:58:33'),
(7, ' mathangdo', '', 'http://localhost/nongsan-api/uploads/avatars/1770564561_Screenshot 2025-11-13 104240.png', 'vendor', 'trandinhtu1705@gmail.com', '', '$2y$10$yF/muXJytBQShafJTTsQO.o.aO3OSFBYkkFwLBefN6NNJifEPpA8i', 0, '', '', 1, '2026-01-28 05:13:08', '2026-03-04 07:58:33'),
(8, 'Tran Dinh Tu', NULL, 'http://localhost/nongsan-api/uploads/avatars/1772963221_vendor_avt.jpg', 'vendor', 'vendor@gmail.com', '0816931074', '$2y$10$yF/muXJytBQShafJTTsQO.o.aO3OSFBYkkFwLBefN6NNJifEPpA8i', 0, 'Da Nang', 'Hệ thống quản lý nông sản.', 0, '2026-01-28 05:32:19', '2026-03-10 03:14:40'),
(9, 'Khách hàng', NULL, NULL, 'customer', 'customer@gmail.com', NULL, '$2y$10$yF/muXJytBQShafJTTsQO.o.aO3OSFBYkkFwLBefN6NNJifEPpA8i', 0, NULL, NULL, 0, '2026-01-28 05:32:19', '2026-03-04 07:58:33'),
(10, '12312312', NULL, NULL, 'vendor', 'trandinhtu17052004@gmail.com', NULL, '$2y$10$yF/muXJytBQShafJTTsQO.o.aO3OSFBYkkFwLBefN6NNJifEPpA8i', 0, NULL, NULL, 1, '2026-01-28 05:38:37', '2026-03-04 07:58:33'),
(26, 'vendor123124', NULL, NULL, 'vendor', 'tutran0786@gmail.com', NULL, '$2y$10$WsyHWICllDZDJm/yWG8WpuzBUzFDTccpj0sdV/1uU0HEuovgMvaw2', 0, NULL, NULL, 1, '2026-01-28 07:03:00', '2026-03-07 06:50:32'),
(27, 'Nguyễn Văn A', 'Nông Trại Xanh', NULL, 'vendor', 'nongtrai@gmail.com', NULL, '$2y$10$yF/muXJytBQShafJTTsQO.o.aO3OSFBYkkFwLBefN6N...', 0, NULL, NULL, 0, '2026-02-01 01:00:00', '2026-03-04 07:58:33'),
(28, 'Trần Thị B', 'Đà Lạt Farm', NULL, 'vendor', 'dalatfarm@gmail.com', NULL, '$2y$10$yF/muXJytBQShafJTTsQO.o.aO3OSFBYkkFwLBefN6N...', 0, NULL, NULL, 0, '2026-02-05 02:30:00', '2026-03-04 07:58:33'),
(29, 'Tester', NULL, NULL, 'customer', 'tester@example.com', NULL, '$2a$10$o9UR7Z1Mn17JTMYQ5lFw0u1i6efv2CFH6WNJv6HtlABaAyrOOTd7W', 0, NULL, NULL, 0, '2026-03-04 08:40:30', '2026-03-04 08:40:30'),
(30, 'NewUser', NULL, NULL, 'customer', 'newuser@example.com', NULL, '$2a$10$Vp0Yowfa4GP5lJvA2xl7mePlsbsD6K7GDDy2Xio82ZQNSbbjbNA/6', 0, NULL, NULL, 0, '2026-03-04 08:48:16', '2026-03-04 08:48:16'),
(31, 'tinh', '', 'http://localhost/nongsan-api/uploads/avatars/1772695222_12.jpg', 'customer', 'huutinh582@gmail.com', '0398729285', '$2y$10$U6/wZeIg3EehzKZg46hBMuCMwu4E0.FGlkUIGyoHrkkOZ1X4g4Utu', 1, 'aaaaaa', '', 0, '2026-03-04 08:51:39', '2026-03-06 08:07:06'),
(33, 'Tester1772623603850', NULL, NULL, 'customer', 'testuser1772623603850@example.com', '012345', '$2a$10$nlKXg6gxGWB9BrQdp6u8N.4MTrTJWFaOFwz46/19b6Aeije0JvFcy', 0, NULL, NULL, 0, '2026-03-04 11:26:44', '2026-03-04 11:26:44'),
(34, 'Tester1772623718143', NULL, NULL, 'customer', 'testuser1772623718143@example.com', '012345', '$2a$10$UOlNY2iJ8mpqo/y.U/v1k.1N8VhCeUDrnG07XfvwTyFVBzxQfLJZ2', 0, NULL, NULL, 0, '2026-03-04 11:28:38', '2026-03-04 11:28:38'),
(35, 'Tester1772624008023', NULL, NULL, 'customer', 'testuser1772624008023@example.com', '012345', '$2a$10$dXDW45lX7Bb1pK.QBR8HZe4Lxsps/UR1.QPV4I2Srqsryojmf9YWu', 0, NULL, NULL, 0, '2026-03-04 11:33:28', '2026-03-04 11:33:28'),
(37, 'tinh', '', NULL, 'customer', 'huutinh583@gmail.com', '', '$2y$10$T1qgLPkBkKBXb/qzsxvr2OnXA3mNIuwMXgDYhJzynBRhf36EE3.EO', 1, '', '', 0, '2026-03-05 08:16:31', '2026-03-08 09:50:21'),
(38, 'API Test User', NULL, NULL, 'customer', 'apitest_b615fc8819@example.com', NULL, '$2y$10$abcdefghijklmnopqrstuv1234567890123456789012345678901234', 0, NULL, NULL, 0, '2026-03-07 07:21:20', '2026-03-08 09:50:01'),
(39, 'API Test User', NULL, NULL, 'customer', 'apitest_72cc8e16@example.com', NULL, 'dummyhash', 0, NULL, NULL, 0, '2026-03-07 07:21:34', '2026-03-08 09:50:05'),
(40, 'API Test User', NULL, NULL, 'customer', 'apitest_92cc13cf@example.com', NULL, '$2y$10$abcdefghijklmnopqrstuv1234567890123456789012345678901234', 0, NULL, NULL, 0, '2026-03-07 07:22:01', '2026-03-08 09:50:17'),
(41, 'vendor Test', 'Nong San Sach', NULL, 'vendor', 'vendor@gmail.com', '', '$2y$10$61xNIUkUgv0ZdhgLnWmO5..ZwHaL9pp4ktbrgxT.9MsdNaOtdGrEq', 0, '', '', 1, '2026-03-08 08:38:57', '2026-03-10 03:15:56');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_notifications`
--

CREATE TABLE `user_notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(30) NOT NULL DEFAULT 'SYSTEM',
  `metadata` longtext DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_notifications`
--

INSERT INTO `user_notifications` (`id`, `user_id`, `title`, `content`, `type`, `metadata`, `is_read`, `created_at`) VALUES
(1, 9, 'Dat hang thanh cong', 'Don hang #ORD-1772790992027 da duoc tao thanh cong va dang cho xu ly.', 'SYSTEM', '{\"order_id\":13,\"order_code\":\"#ORD-1772790992027\"}', 0, '2026-03-06 16:56:32'),
(2, 9, 'Dat hang thanh cong', 'Don hang #ORD-1772791014752 da duoc tao thanh cong va dang cho xu ly.', 'SYSTEM', '{\"order_id\":14,\"order_code\":\"#ORD-1772791014752\"}', 0, '2026-03-06 16:56:54'),
(3, 9, 'Cap nhat trang thai don hang', 'Don hang #ORD-1772791014752 dang duoc giao den ban.', 'SYSTEM', '{\"order_id\":14,\"order_code\":\"#ORD-1772791014752\"}', 1, '2026-03-06 16:57:03'),
(4, 31, 'Dat hang thanh cong', 'Don hang #ORD-1772963341107 da duoc tao thanh cong va dang cho xu ly.', 'SYSTEM', '{\"order_id\":15,\"order_code\":\"#ORD-1772963341107\"}', 1, '2026-03-08 16:49:01'),
(5, 37, 'Dat hang thanh cong', 'Don hang #ORD-1772963372172 da duoc tao thanh cong va dang cho xu ly.', 'SYSTEM', '{\"order_id\":16,\"order_code\":\"#ORD-1772963372172\"}', 0, '2026-03-08 16:49:32'),
(6, 31, 'Cap nhat trang thai don hang', 'Don hang #ORD-1772697014929 dang duoc giao den ban.', 'SYSTEM', '{\"order_id\":10,\"order_code\":\"#ORD-1772697014929\"}', 1, '2026-03-08 16:50:55'),
(7, 31, 'Cap nhat trang thai don hang', 'Don hang #ORD-1772790264106 dang duoc giao den ban.', 'SYSTEM', '{\"order_id\":12,\"order_code\":\"#ORD-1772790264106\"}', 1, '2026-03-08 16:50:57'),
(8, 31, 'Cap nhat trang thai don hang', 'Don hang #ORD-1772963341107 dang duoc giao den ban.', 'SYSTEM', '{\"order_id\":15,\"order_code\":\"#ORD-1772963341107\"}', 1, '2026-03-08 16:50:59'),
(9, 37, 'Cap nhat trang thai don hang', 'Don hang #ORD-1772963372172 dang duoc giao den ban.', 'SYSTEM', '{\"order_id\":16,\"order_code\":\"#ORD-1772963372172\"}', 0, '2026-03-08 16:51:00'),
(10, 9, 'Cap nhat trang thai don hang', 'Don hang #ORD-1772790992027 dang duoc giao den ban.', 'SYSTEM', '{\"order_id\":13,\"order_code\":\"#ORD-1772790992027\"}', 0, '2026-03-08 16:51:03'),
(11, 37, 'Cap nhat trang thai don hang', 'Don hang #ORD-1772963372172 da giao thanh cong.', 'SYSTEM', '{\"order_id\":16,\"order_code\":\"#ORD-1772963372172\"}', 0, '2026-03-08 16:51:08'),
(12, 31, 'Cap nhat trang thai don hang', 'Don hang #ORD-1772963341107 da giao thanh cong.', 'SYSTEM', '{\"order_id\":15,\"order_code\":\"#ORD-1772963341107\"}', 1, '2026-03-08 16:51:10'),
(13, 9, 'Cap nhat trang thai don hang', 'Don hang #ORD-1772791014752 da giao thanh cong.', 'SYSTEM', '{\"order_id\":14,\"order_code\":\"#ORD-1772791014752\"}', 0, '2026-03-08 16:51:12'),
(14, 9, 'Cap nhat trang thai don hang', 'Don hang #ORD-1772790992027 da giao thanh cong.', 'SYSTEM', '{\"order_id\":13,\"order_code\":\"#ORD-1772790992027\"}', 0, '2026-03-08 16:51:14'),
(15, 31, 'Cap nhat trang thai don hang', 'Don hang #ORD-1772790264106 da giao thanh cong.', 'SYSTEM', '{\"order_id\":12,\"order_code\":\"#ORD-1772790264106\"}', 1, '2026-03-08 16:51:16');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_notification_reads`
--

CREATE TABLE `user_notification_reads` (
  `user_id` int(11) NOT NULL,
  `notification_id` int(11) NOT NULL,
  `read_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `vendor_wallets`
--

CREATE TABLE `vendor_wallets` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `balance` decimal(15,2) DEFAULT 0.00,
  `total_withdrawn` decimal(15,2) DEFAULT 0.00,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `vendor_wallets`
--

INSERT INTO `vendor_wallets` (`id`, `vendor_id`, `balance`, `total_withdrawn`, `updated_at`) VALUES
(1, 6, 322000.00, 0.00, '2026-01-28 08:42:31'),
(2, 26, 0.00, 0.00, '2026-03-05 07:07:01'),
(12, 41, 1190480.00, 0.00, '2026-03-08 09:53:24');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `warnings`
--

CREATE TABLE `warnings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `withdrawals`
--

CREATE TABLE `withdrawals` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `bank_name` varchar(100) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `account_holder` varchar(100) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `withdrawals`
--

INSERT INTO `withdrawals` (`id`, `vendor_id`, `amount`, `bank_name`, `account_number`, `account_holder`, `status`, `note`, `created_at`) VALUES
(1, 6, 123.00, '123', '123', '13', 'pending', NULL, '2026-01-28 08:49:37'),
(2, 41, 300000.00, 'BIDV', '6261378544', 'T', 'pending', NULL, '2026-03-08 09:53:48');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `vendor_notifications`
--
ALTER TABLE `vendor_notifications`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_parent` (`parent_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_display_order` (`display_order`);

--
-- Chỉ mục cho bảng `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_one` (`user_one`,`user_two`),
  ADD KEY `user_two` (`user_two`);

--
-- Chỉ mục cho bảng `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Chỉ mục cho bảng `message_attachments`
--
ALTER TABLE `message_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `message_id` (`message_id`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_code` (`order_code`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- Chỉ mục cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Chỉ mục cho bảng `order_tracking`
--
ALTER TABLE `order_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_id` (`order_id`);

--
-- Chỉ mục cho bảng `payout_requests`
--
ALTER TABLE `payout_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_vendor` (`vendor_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Chỉ mục cho bảng `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- Chỉ mục cho bảng `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Chỉ mục cho bảng `promotion_products`
--
ALTER TABLE `promotion_products`
  ADD PRIMARY KEY (`promotion_id`,`product_id`);

--
-- Chỉ mục cho bảng `promotion_usages`
--
ALTER TABLE `promotion_usages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `promotion_id` (`promotion_id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Chỉ mục cho bảng `promo_banners`
--
ALTER TABLE `promo_banners`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `position` (`position`);

--
-- Chỉ mục cho bảng `refund_requests`
--
ALTER TABLE `refund_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `resolved_by` (`resolved_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_order` (`order_id`),
  ADD KEY `idx_vendor` (`vendor_id`),
  ADD KEY `idx_customer` (`customer_id`);

--
-- Chỉ mục cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer` (`customer_id`),
  ADD KEY `idx_vendor` (`vendor_id`),
  ADD KEY `idx_product` (`product_id`);

--
-- Chỉ mục cho bảng `sale`
--
ALTER TABLE `sale`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status_deleted` (`status`,`deleted_at`),
  ADD KEY `idx_dates` (`start_date`,`end_date`);

--
-- Chỉ mục cho bảng `shipping`
--
ALTER TABLE `shipping`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `shipping_code` (`shipping_code`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `vendor_id` (`vendor_id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Chỉ mục cho bảng `shipping_carriers`
--
ALTER TABLE `shipping_carriers`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `shipping_rates`
--
ALTER TABLE `shipping_rates`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `system_banners`
--
ALTER TABLE `system_banners`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `banner_key` (`banner_key`);

--
-- Chỉ mục cho bảng `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `unique_email` (`email`);

--
-- Chỉ mục cho bảng `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_notifications_user` (`user_id`),
  ADD KEY `idx_user_notifications_created` (`created_at`);

--
-- Chỉ mục cho bảng `user_notification_reads`
--
ALTER TABLE `user_notification_reads`
  ADD PRIMARY KEY (`user_id`,`notification_id`);

--
-- Chỉ mục cho bảng `vendor_wallets`
--
ALTER TABLE `vendor_wallets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vendor_id` (`vendor_id`),
  ADD UNIQUE KEY `uniq_vendor` (`vendor_id`);

--
-- Chỉ mục cho bảng `warnings`
--
ALTER TABLE `warnings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- Chỉ mục cho bảng `withdrawals`
--
ALTER TABLE `withdrawals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `vendor_notifications`
--
ALTER TABLE `vendor_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT cho bảng `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT cho bảng `message_attachments`
--
ALTER TABLE `message_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT cho bảng `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT cho bảng `order_tracking`
--
ALTER TABLE `order_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `payout_requests`
--
ALTER TABLE `payout_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- AUTO_INCREMENT cho bảng `product_reviews`
--
ALTER TABLE `product_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `promotion_usages`
--
ALTER TABLE `promotion_usages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `promo_banners`
--
ALTER TABLE `promo_banners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `refund_requests`
--
ALTER TABLE `refund_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `sale`
--
ALTER TABLE `sale`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `shipping`
--
ALTER TABLE `shipping`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `shipping_carriers`
--
ALTER TABLE `shipping_carriers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `shipping_rates`
--
ALTER TABLE `shipping_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `system_banners`
--
ALTER TABLE `system_banners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `ticket_messages`
--
ALTER TABLE `ticket_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT cho bảng `user_notifications`
--
ALTER TABLE `user_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT cho bảng `vendor_wallets`
--
ALTER TABLE `vendor_wallets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT cho bảng `warnings`
--
ALTER TABLE `warnings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `withdrawals`
--
ALTER TABLE `withdrawals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_parent_category` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`user_one`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`user_two`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`);

--
-- Các ràng buộc cho bảng `message_attachments`
--
ALTER TABLE `message_attachments`
  ADD CONSTRAINT `message_attachments_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `users` (`id`);

--
-- Các ràng buộc cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `order_tracking`
--
ALTER TABLE `order_tracking`
  ADD CONSTRAINT `order_tracking_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `payout_requests`
--
ALTER TABLE `payout_requests`
  ADD CONSTRAINT `payout_requests_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payout_requests_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `promotion_products`
--
ALTER TABLE `promotion_products`
  ADD CONSTRAINT `promotion_products_ibfk_1` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `promotion_usages`
--
ALTER TABLE `promotion_usages`
  ADD CONSTRAINT `promotion_usages_ibfk_1` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`),
  ADD CONSTRAINT `promotion_usages_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`);

--
-- Các ràng buộc cho bảng `refund_requests`
--
ALTER TABLE `refund_requests`
  ADD CONSTRAINT `refund_requests_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `refund_requests_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `refund_requests_ibfk_3` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_review_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_review_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_review_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `shipping`
--
ALTER TABLE `shipping`
  ADD CONSTRAINT `shipping_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shipping_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `shipping_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`);

--
-- Các ràng buộc cho bảng `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Các ràng buộc cho bảng `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD CONSTRAINT `ticket_messages_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`);

--
-- Các ràng buộc cho bảng `vendor_wallets`
--
ALTER TABLE `vendor_wallets`
  ADD CONSTRAINT `vendor_wallets_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `warnings`
--
ALTER TABLE `warnings`
  ADD CONSTRAINT `warnings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `warnings_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `withdrawals`
--
ALTER TABLE `withdrawals`
  ADD CONSTRAINT `withdrawals_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
