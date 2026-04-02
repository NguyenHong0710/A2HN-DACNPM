<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

include_once './config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// Lấy ID người dùng từ GET hoặc POST
$user_id = $_REQUEST['id'] ?? null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "Thiếu ID người dùng để đăng xuất."]);
    exit();
}

try {
    // 1. Cập nhật trạng thái is_online về 0 trong bảng users
    $query = "UPDATE users SET is_online = 0 WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $user_id);

    if ($stmt->execute()) {
        // Nếu bro có dùng Session của PHP thì hủy ở đây
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        session_unset();
        session_destroy();

        echo json_encode([
            "status" => "success",
            "message" => "Đã đăng xuất và cập nhật trạng thái Offline."
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Không thể cập nhật trạng thái hệ thống."]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Lỗi Server: " . $e->getMessage()]);
}