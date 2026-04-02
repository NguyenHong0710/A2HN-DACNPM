<?php
include_once './config/database.php';
include_once './utils/jwt_helper.php';
require_once './config/mail.php';
require_once './helpers/audit_log.php';

require './PHPMailer/Exception.php';
require './PHPMailer/PHPMailer.php';
require './PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json; charset=utf-8');

$data = json_decode(file_get_contents('php://input'));
$email = trim((string)($data->email ?? ''));

if ($email === '') {
    echo json_encode(['status' => 'error', 'message' => 'Vui lòng nhập email.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Email không hợp lệ.']);
    exit;
}

try {
    $stmt = $conn->prepare('SELECT id, name, email FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['status' => 'error', 'message' => 'Email chưa được đăng ký.']);
        exit;
    }

    $otp = (string)rand(100000, 999999);

    $mail = new PHPMailer(true);
    $mailConfig = get_mail_config();

    $mail->isSMTP();
    $mail->Host       = $mailConfig['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $mailConfig['username'];
    $mail->Password   = $mailConfig['password'];
    $mail->SMTPSecure = ($mailConfig['encryption'] === 'ssl')
        ? PHPMailer::ENCRYPTION_SMTPS
        : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = (int)$mailConfig['port'];
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom($mailConfig['from_email'], $mailConfig['from_name']);
    $mail->addAddress($user['email'], $user['name']);

    $mail->isHTML(true);
    $mail->Subject = 'Ma OTP dat lai mat khau';
    $mail->Body = "
        <div style='font-family: Arial, sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 10px;'>
            <h2 style='color: #2e7d32;'>Dat lai mat khau</h2>
            <p>Xin chao <b>{$user['name']}</b>, ma OTP cua ban la:</p>
            <div style='background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #333;'>
                {$otp}
            </div>
            <p style='color: #666; font-size: 12px; margin-top: 20px;'>Ma co hieu luc trong 10 phut. Khong chia se ma nay voi bat ky ai.</p>
        </div>
    ";

    $mail->send();

    $tempToken = JWT_Helper::create([
        'email' => (string)$user['email'],
        'otp' => (string)$otp,
        'purpose' => 'password_reset_otp',
        'exp' => time() + (60 * 10),
    ]);

    write_audit_log("USER {$user['name']} ({$user['id']}) requested password reset OTP");

    echo json_encode([
        'status' => 'success',
        'message' => 'Ma OTP da duoc gui den email cua ban.',
        'temp_token' => $tempToken,
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Gui email that bai: ' . $e->getMessage()]);
}
