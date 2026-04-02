<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Authorization: Bearer"); // Nếu bạn có dùng JWT

include_once './config/database.php';

// Giả sử bạn lấy user_id và role từ Token đã validate
// Ở đây tôi ví dụ lấy qua GET để bạn dễ test trước
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$role = isset($_GET['role']) ? $_GET['role'] : null;

if (!$user_id || !$role) {
    echo json_encode(["status" => "error", "message" => "Thiếu thông tin người dùng"]);
    exit;
}

try {
    // Câu lệnh SQL linh hoạt cho cả 3 đối tượng
    $sql = "SELECT 
                s.id as db_id,
                s.shipping_code as id,
                o.order_code as orderId,
                u.name as customer,
                o.shipping_address as address,
                s.method,
                s.status,
                s.estimated_time as estimatedTime,
                s.note
            FROM shipping s
            JOIN orders o ON s.order_id = o.id
            JOIN users u ON s.customer_id = u.id";

    // Phân quyền dữ liệu
    if ($role === 'vendor') {
        $sql .= " WHERE s.vendor_id = :uid";
    } elseif ($role === 'customer') {
        $sql .= " WHERE s.customer_id = :uid";
    }
    // vendor không cần WHERE để xem tất cả

    $sql .= " ORDER BY s.created_at DESC";

    $stmt = $conn->prepare($sql);
    
    if ($role !== 'vendor') {
        $stmt->bindParam(':uid', $user_id);
    }
    
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $data
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error", 
        "message" => "Lỗi Database: " . $e->getMessage()
    ]);
}
?>