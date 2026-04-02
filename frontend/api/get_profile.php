<?php
// File: get_profile.php
include_once './config/database.php';

// Lấy ID từ tham số GET (React gửi lên: ?id=1)
$id = isset($_GET['id']) ? $_GET['id'] : die();

try {
    // Chỉ lấy các trường cần thiết, bỏ password
    $query = "SELECT id, name, shop_name, email, phone, address, description, avatar, role, is_approved, created_at FROM users WHERE id = :id LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    
    if($stmt->rowCount() > 0){
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Chuẩn hóa đường dẫn ảnh (nếu null thì trả về rỗng)
        $row['avatar'] = $row['avatar'] ? $row['avatar'] : '';
        
        echo json_encode([
            "status" => "success", 
            "data" => $row
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Không tìm thấy tài khoản."]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Lỗi hệ thống: " . $e->getMessage()]);
}
?>