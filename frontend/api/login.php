<?php
include_once './config/database.php';
include_once './utils/jwt_helper.php';
require_once './helpers/audit_log.php';
require_once './helpers/rate_limit.php';

header('Content-Type: application/json');
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    echo json_encode([
        "status" => "error",
        "message" => "Vui lòng nhập Email và Mật khẩu."
    ]);
    exit;
}

$emailForLimit = isset($data->email) ? strtolower(trim((string)$data->email)) : '';
$limitKey = ($_SERVER['REMOTE_ADDR'] ?? 'unknown_ip') . '|' . $emailForLimit;
try {
    enforce_rate_limit('login_attempt', 7, 600, $limitKey);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => trim($data->email)]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($data->password, $user['password'])) {
        echo json_encode([
            "status" => "error",
            "message" => "Email hoặc mật khẩu không chính xác."
        ]);
        exit;
    }

    $role = strtolower(trim((string)$user['role']));

    // Cho phép các vai trò người dùng đăng nhập vào hệ thống.
    // Phân quyền truy cập trang vendor vẫn được xử lý ở frontend/backend route riêng.
    if (!in_array($role, ['vendor', 'vendor', 'customer', 'user'])) {
        echo json_encode([
            "status" => "error",
            "message" => "Tài khoản không có quyền đăng nhập."
        ]);
        exit;
    }

    $user_id = (int)$user['id'];

    // ========================================================
    // BƯỚC THÊM MỚI: CẬP NHẬT TRẠNG THÁI IS_ONLINE THÀNH 1
    // ========================================================
    $updateOnline = $conn->prepare("UPDATE users SET is_online = 1 WHERE id = :id");
    $updateOnline->execute([':id' => $user_id]);
    // Cập nhật lại biến $user để trả về React có is_online = 1 luôn
    $user['is_online'] = 1; 
    // ========================================================

    $is_approved = isset($user['is_approved']) ? (int)$user['is_approved'] : 0;

    // Tạo JWT
    $token_payload = [
        'id'   => $user_id,
        'role' => $role,
        'exp'  => time() + (60 * 60 * 24)
    ];

    $token = JWT_Helper::create($token_payload);
    unset($user['password']);
    $user['role'] = $role;

    // 📝 GHI AUDIT LOG ĐĂNG NHẬP
    write_audit_log(
        strtoupper($role) . " {$user['name']} (id {$user_id}) đã đăng nhập"
    );

    echo json_encode([
        "status" => "success",
        "token"  => $token,
        "user"   => $user
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status"  => "error",
        "message" => "Lỗi: " . $e->getMessage()
    ]);
}