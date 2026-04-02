<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

include_once './config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$vendor_id = $_REQUEST['id'] ?? null;
if (!$vendor_id) {
    echo json_encode(["status" => "error", "message" => "Thiếu ID"]);
    exit();
}

// Lấy thông tin hiện tại
$check = $conn->prepare("SELECT id, avatar FROM users WHERE id = :id AND role = 'vendor' LIMIT 1");
$check->execute([':id' => $vendor_id]);
$vendor_data = $check->fetch(PDO::FETCH_ASSOC);

if (!$vendor_data) {
    echo json_encode(["status" => "error", "message" => "Không tìm thấy vendor"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->prepare("SELECT id, name, email, phone, avatar, address, description FROM users WHERE id = :id");
    $stmt->execute([':id' => $vendor_id]);
    echo json_encode(["status" => "success", "data" => $stmt->fetch(PDO::FETCH_ASSOC)]);
} 

else if ($method === 'POST') {
    $name = $_POST['name'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $address = $_POST['address'] ?? '';
    $description = $_POST['description'] ?? '';
    
    // Mặc định dùng lại ảnh cũ trong DB
    $final_avatar_url = $vendor_data['avatar']; 
    $avatar_sql = "";
    $params = [':n' => $name, ':p' => $phone, ':a' => $address, ':d' => $description, ':id' => $vendor_id];

    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === 0) {
        $upload_dir = "uploads/avatars/";
        if (!file_exists($upload_dir)) mkdir($upload_dir, 0777, true);

        $file_name = time() . "_vendor_avt." . pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
        $target = $upload_dir . $file_name;

        if (move_uploaded_file($_FILES['avatar']['tmp_name'], $target)) {
            $final_avatar_url = "http://localhost/nongsan-api/" . $target;
            $avatar_sql = ", avatar = :avt";
            $params[':avt'] = $final_avatar_url;
        }
    }

    $sql = "UPDATE users SET name = :n, phone = :p, address = :a, description = :d $avatar_sql WHERE id = :id AND role = 'vendor'";
    $stmt = $conn->prepare($sql);
    
    if ($stmt->execute($params)) {
        echo json_encode([
            "status" => "success", 
            "message" => "Cập nhật thành công!",
            "new_avatar" => (string)$final_avatar_url // Đảm bảo trả về string sạch
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Lỗi SQL"]);
    }
}