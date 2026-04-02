<?php
include_once './config/database.php';
include_once './utils/jwt_helper.php';

header('Content-Type: application/json');

// 1. Kiểm tra Token (hỗ trợ nhiều kiểu server trả Authorization header)
$headers = function_exists('getallheaders') ? getallheaders() : [];
$authHeader = '';

if (isset($headers['Authorization'])) {
    $authHeader = $headers['Authorization'];
} elseif (isset($headers['authorization'])) {
    $authHeader = $headers['authorization'];
} elseif (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
}

$token = trim(preg_replace('/^Bearer\s+/i', '', (string)$authHeader));
$user = JWT_Helper::validate($token);

if (!$user) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$user_id = $user->id;
$role = strtolower(trim((string)($user->role ?? '')));

try {
    // 2. Lấy trực tiếp customer_name từ bảng orders (o.customer_name)
    // Loại bỏ JOIN users u vì bạn đã có tên ở bảng orders rồi
    $sql = "SELECT o.* FROM orders o";
    
    if ($role === 'vendor') {
        $sql .= " WHERE o.vendor_id = :uid";
    } elseif ($role === 'customer' || $role === 'user') {
        $sql .= " WHERE o.customer_id = :uid";
    }

    $sql .= " ORDER BY o.created_at DESC";

    $stmt = $conn->prepare($sql);
    if ($role !== 'vendor' && ($role === 'vendor' || $role === 'customer' || $role === 'user')) {
        $stmt->bindParam(':uid', $user_id);
    }
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];
    foreach ($orders as $row) {
        // Lấy chi tiết sản phẩm
        $itemStmt = $conn->prepare("SELECT product_name as name, unit, quantity as qty, price FROM order_items WHERE order_id = :oid");
        $itemStmt->execute([':oid' => $row['id']]);
        $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

        // --- XỬ LÝ LOGIC TRẠNG THÁI THANH TOÁN ---
        $currentPaymentStatus = $row['payment_status'];
        $method = $row['payment_method'];

        if ($method === 'Chuyển khoản' && $currentPaymentStatus !== 'Hủy') {
            $displayStatus = 'Đã thanh toán';
        } else if ($method === 'Tiền mặt' && $currentPaymentStatus !== 'Hủy') {
            $displayStatus = 'Chờ thanh toán'; 
        } else {
            $displayStatus = $currentPaymentStatus;
        }

        $result[] = [
            'id' => $row['order_code'],
            'db_id' => $row['id'],
            'customer' => $row['customer_name'], // LẤY TỪ CỘT MỚI THÊM TRONG ORDERS
            'date' => date('d/m/Y', strtotime($row['created_at'])),
            'amount' => (float)$row['total_amount'],
            'payment_method' => $method,
            'paymentStatus' => $displayStatus,
            'deliveryStatus' => $row['delivery_status'],
            'address' => $row['shipping_address'],
            'phone' => $row['customer_phone'],
            'cancelReason' => $row['cancel_reason'] ?? '',
            'items' => $items
        ];
    }

    echo json_encode(["status" => "success", "data" => $result]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}