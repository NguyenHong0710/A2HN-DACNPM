<?php
include_once './config/database.php';
include_once './utils/jwt_helper.php';
require_once './config/mail.php';

// Import PHPMailer thủ công
require './PHPMailer/Exception.php';
require './PHPMailer/PHPMailer.php';
require './PHPMailer/SMTP.php';
require_once './helpers/audit_log.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$data = json_decode(file_get_contents("php://input"));

if(isset($data->name) && isset($data->email) && isset($data->password)) {
    $name = trim($data->name);
    $email = trim($data->email);
    $requestedRole = strtolower(trim((string)($data->role ?? 'vendor')));
    $role = in_array($requestedRole, ['vendor', 'customer', 'user'], true) ? ($requestedRole === 'user' ? 'customer' : $requestedRole) : 'vendor';

    // 1. KIỂM TRA TRÙNG LẶP
    // vendor: kiểm tra cả tên + email; Customer: chỉ kiểm tra email.
    if ($role === 'vendor') {
        $check = $conn->prepare("SELECT name, email FROM users WHERE name = :name OR email = :email LIMIT 1");
        $check->execute([':name' => $name, ':email' => $email]);
    } else {
        $check = $conn->prepare("SELECT name, email FROM users WHERE email = :email LIMIT 1");
        $check->execute([':email' => $email]);
    }
    $existingUser = $check->fetch(PDO::FETCH_ASSOC);

    if($existingUser) {
        if ($role === 'vendor' && strcasecmp($existingUser['name'], $name) == 0 && $existingUser['name'] == $name) {
             // Nếu database của bạn là Case-Insensitive, vendor và vendor sẽ lọt vào đây
             echo json_encode(["status" => "error", "message" => "Tên người dùng '$name' này đã tồn tại, vui lòng chọn tên khác!"]);
             exit();
        }
        if ($existingUser['email'] == $email) {
            echo json_encode(["status" => "error", "message" => "Email này đã được sử dụng!"]);
            exit();
        }
    }
    // 2. Tạo OTP - Luôn giữ định dạng Chuỗi 6 số
    $otp = (string)rand(100000, 999999);

    // 3. Gửi Email
    $mail = new PHPMailer(true);
    $mailConfig = get_mail_config();
    try {
        $mail->isSMTP();
        $mail->Host       = $mailConfig['host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $mailConfig['username'];
        $mail->Password   = $mailConfig['password'];
        $mail->SMTPSecure = ($mailConfig['encryption'] === 'ssl')
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = (int)$mailConfig['port'];
        $mail->CharSet    = 'UTF-8'; // Đảm bảo tiếng Việt không lỗi

        $mail->setFrom($mailConfig['from_email'], $mailConfig['from_name']);
        $mail->addAddress($email);

        $mail->isHTML(true);
        $roleLabel = $role === 'vendor' ? 'vendor' : 'Khách hàng';
        $mail->Subject = "Mã xác nhận đăng ký {$roleLabel}";
        $mail->Body    = "
            <div style='font-family: Arial, sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 10px;'>
                <h2 style='color: #2eb85c;'>Xác thực đăng ký</h2>
                <p>Chào <b>{$data->name}</b>, mã OTP của bạn là:</p>
                <div style='background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #333;'>
                    $otp
                </div>
                <p style='color: #666; font-size: 12px; margin-top: 20px;'>Mã này có hiệu lực trong 10 phút. Không chia sẻ mã này cho bất kỳ ai.</p>
            </div>
        ";

        $mail->send();
        write_audit_log(
    strtoupper($role) . " {$name} ({$email}) đã yêu cầu đăng ký – gửi OTP"
);
        // 4. Tạo JWT - Ép kiểu STRING toàn bộ các trường quan trọng
        $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
        
        $temp_data = [
            'name'          => (string)$data->name,
            'email'         => (string)$email,
            'password_hash' => (string)$password_hash,
            'role'          => $role,
            'otp'           => (string)$otp, // Ép kiểu chuỗi cực kỳ quan trọng
            'exp'           => time() + (60 * 10) // 10 phút
        ];

        $token = JWT_Helper::create($temp_data);

        echo json_encode([
            "status" => "success", 
            "message" => "Mã OTP đã được gửi, vui lòng kiểm tra email!",
            "temp_token" => $token 
        ]);

    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Gửi mail thất bại: {$mail->ErrorInfo}"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Vui lòng nhập đầy đủ thông tin."]);
}
?>