<?php
include_once './config/database.php';
include_once './utils/jwt_helper.php';
require_once './helpers/audit_log.php';

header('Content-Type: application/json; charset=utf-8');

function respond_json(int $statusCode, array $payload, bool $terminate = true): void {
    http_response_code($statusCode);
    echo json_encode($payload);
    if ($terminate) {
        exit();
    }
}

$data = json_decode(file_get_contents("php://input"));

if (isset($data->token) && isset($data->otp_input)) {

    // 1. Giải mã token
    $payload = JWT_Helper::validate($data->token);

    if (!$payload) {
        respond_json(401, [
            "status" => "error",
            "message" => "Phiên đăng ký hết hạn, vui lòng thử lại."
        ]);
    }

    // 2. So sánh OTP (ép kiểu chuỗi)
    $otpInToken  = isset($payload->otp) ? trim((string)$payload->otp) : '';
    $otpFromUser = trim((string)$data->otp_input);

    if ($otpInToken === '' || $otpInToken !== $otpFromUser) {
        respond_json(401, [
            "status" => "error",
            "message" => "Mã xác nhận không chính xác!"
        ]);
    }

    // 3. Kiểm tra hết hạn
    if (isset($payload->exp) && time() > $payload->exp) {
        respond_json(410, [
            "status" => "error",
            "message" => "Mã OTP đã hết hạn."
        ]);
    }

    // 4. Lưu user vào DB
    try {
        $name = trim((string)($payload->name ?? ''));
        $email = strtolower(trim((string)($payload->email ?? '')));
        $passwordHash = (string)($payload->password_hash ?? '');

        if ($name === '' || $email === '' || $passwordHash === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            respond_json(422, [
                "status" => "error",
                "message" => "Dữ liệu đăng ký không hợp lệ."
            ]);
        }

        $role = strtolower(trim((string)($payload->role ?? 'customer')));
        if (!in_array($role, ['vendor', 'customer', 'user'], true)) {
            $role = 'customer';
        }
        if ($role === 'user') {
            $role = 'customer';
        }

        $isApproved = $role === 'vendor' ? 0 : 1;

        // Kiểm tra email đã tồn tại trước khi insert để trả lỗi thân thiện.
        $checkStmt = $conn->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
        $checkStmt->execute([':email' => $email]);
        if ($checkStmt->fetch()) {
            respond_json(409, [
                "status" => "error",
                "message" => "Email đã được sử dụng."
            ]);
        }

        $query = "
            INSERT INTO users (name, email, password, role, is_online, is_approved)
            VALUES (:name, :email, :pass, :role, 0, :is_approved)
        ";

        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':name'  => $name,
            ':email' => $email,
            ':pass'  => $passwordHash,
            ':role'  => $role,
            ':is_approved' => $isApproved,
        ]);

        $newUserId = $conn->lastInsertId();

        // 📝 AUDIT LOG – ĐĂNG KÝ THÀNH CÔNG
        write_audit_log(
            strtoupper($role) . " {$payload->name} (id {$newUserId}) đã đăng ký tài khoản"
        );

        respond_json(201, [
            "status" => "success",
            "message" => "Đăng ký thành công!"
        ], false);

    } catch (PDOException $e) {
        error_log('verify_register.php PDOException: ' . $e->getMessage());
        respond_json(500, [
            "status" => "error",
            "message" => "Không thể tạo tài khoản lúc này, vui lòng thử lại."
        ], false);
    } catch (Exception $e) {
        error_log('verify_register.php Exception: ' . $e->getMessage());
        respond_json(500, [
            "status" => "error",
            "message" => "Lỗi hệ thống, vui lòng thử lại sau."
        ], false);
    }

} else {
    respond_json(400, [
        "status" => "error",
        "message" => "Dữ liệu không đầy đủ."
    ], false);
}
?>
