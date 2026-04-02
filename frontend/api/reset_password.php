<?php
include_once './config/database.php';
include_once './utils/jwt_helper.php';
require_once './helpers/audit_log.php';

header('Content-Type: application/json; charset=utf-8');

$data = json_decode(file_get_contents('php://input'));
$token = trim((string)($data->token ?? ''));
$newPassword = (string)($data->password ?? '');

if ($token === '' || $newPassword === '') {
    echo json_encode(['status' => 'error', 'message' => 'Thieu token hoac mat khau moi.']);
    exit;
}

if (strlen($newPassword) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'Mat khau phai co it nhat 6 ky tu.']);
    exit;
}

$payload = JWT_Helper::validate($token);
if (!$payload) {
    echo json_encode(['status' => 'error', 'message' => 'Phien dat lai mat khau khong hop le.']);
    exit;
}

$purpose = (string)($payload->purpose ?? '');
$email = trim((string)($payload->email ?? ''));
$exp = (int)($payload->exp ?? 0);

if ($purpose !== 'password_reset' || $email === '') {
    echo json_encode(['status' => 'error', 'message' => 'Token khong dung muc dich.']);
    exit;
}

if ($exp > 0 && time() > $exp) {
    echo json_encode(['status' => 'error', 'message' => 'Phien dat lai mat khau da het han.']);
    exit;
}

try {
    $stmt = $conn->prepare('SELECT id, name FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['status' => 'error', 'message' => 'Tai khoan khong ton tai.']);
        exit;
    }

    $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);

    $update = $conn->prepare('UPDATE users SET password = :password WHERE id = :id');
    $update->execute([
        ':password' => $passwordHash,
        ':id' => $user['id'],
    ]);

    write_audit_log("USER {$user['name']} ({$user['id']}) reset password successfully");

    echo json_encode([
        'status' => 'success',
        'message' => 'Dat lai mat khau thanh cong. Vui long dang nhap lai.',
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Loi he thong: ' . $e->getMessage()]);
}
