<?php
include_once './config/database.php';
include_once './utils/jwt_helper.php';
require_once './helpers/audit_log.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"));
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

// Validate JWT
$user = JWT_Helper::validate($token);

if (!$user || !isset($data->id)) {
    echo json_encode(["status" => "error", "message" => "Dữ liệu không hợp lệ"]);
    exit;
}

// 🔎 LẤY THÔNG TIN USER TỪ DB
$stmtUser = $conn->prepare("
    SELECT id, name, role 
    FROM users 
    WHERE id = :id 
    LIMIT 1
");
$stmtUser->execute([':id' => $user->id]);
$userInfo = $stmtUser->fetch(PDO::FETCH_ASSOC);

if (!$userInfo) {
    echo json_encode(["status" => "error", "message" => "User không tồn tại"]);
    exit;
}

try {
    // Chỉ xóa sản phẩm thuộc vendor đang đăng nhập
    $query = "DELETE FROM products 
              WHERE id = :pid 
              AND vendor_id = :vid";

    $stmt = $conn->prepare($query);
    $stmt->execute([
        ':pid' => $data->id,
        ':vid' => $user->id
    ]);

    if ($stmt->rowCount() > 0) {

        // 📝 GHI LOG
        $role = strtoupper($userInfo['role']);
        $name = $userInfo['name'];
        $uid  = $userInfo['id'];

        write_audit_log(
            "{$role} {$name} (id {$uid}) đã xóa sản phẩm id {$data->id}"
        );

        echo json_encode([
            "status" => "success",
            "message" => "Đã xóa sản phẩm"
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Không thể xóa (sản phẩm không tồn tại hoặc không thuộc quyền)"
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
