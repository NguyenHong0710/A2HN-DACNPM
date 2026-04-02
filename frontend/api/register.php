<?php
// File: register.php
include_once './config/database.php';
require_once './helpers/audit_log.php';

header('Content-Type: application/json');

// Nhận dữ liệu JSON
$data = json_decode(file_get_contents("php://input"));

// Validate input
if (
    empty($data->name) ||
    empty($data->email) ||
    empty($data->password)
) {
    echo json_encode([
        "status" => "error",
        "message" => "Thiếu thông tin đăng ký"
    ]);
    exit;
}

$name     = trim(strip_tags($data->name));
$email    = trim(strip_tags($data->email));
$password = $data->password;

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "status" => "error",
        "message" => "Email không hợp lệ"
    ]);
    exit;
}

// Validate password
if (strlen($password) < 6) {
    echo json_encode([
        "status" => "error",
        "message" => "Mật khẩu phải có ít nhất 6 ký tự"
    ]);
    exit;
}

// ⚠️ ROLE CỐ ĐỊNH – KHÔNG CHO CLIENT GỬI
$role = 'vendor';

try {
    // 1. Check email tồn tại
    $stmtCheck = $conn->prepare(
        "SELECT id FROM users WHERE email = :email LIMIT 1"
    );
    $stmtCheck->execute([':email' => $email]);

    if ($stmtCheck->rowCount() > 0) {
        echo json_encode([
            "status" => "error",
            "message" => "Email này đã được sử dụng"
        ]);
        exit;
    }

    // 2. Hash password
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    // 3. Insert user
    $stmt = $conn->prepare("
        INSERT INTO users (name, email, password, role, is_online)
        VALUES (:name, :email, :password, :role, 1)
    ");

    $stmt->execute([
        ':name'     => $name,
        ':email'    => $email,
        ':password' => $passwordHash,
        ':role'     => $role
    ]);

    $newUserId = $conn->lastInsertId();

    // 📝 AUDIT LOG
    $ok = write_audit_log(
    "vendor {$name} (id {$newUserId}) đã đăng ký tài khoản"
);

if (!$ok) {
    error_log('REGISTER: Ghi audit log thất bại');
}

    echo json_encode([
        "status" => "success",
        "message" => "Đăng ký tài khoản thành công"
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Lỗi hệ thống"
    ]);
}
