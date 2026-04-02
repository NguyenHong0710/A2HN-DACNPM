<?php
include_once './utils/jwt_helper.php';

header('Content-Type: application/json; charset=utf-8');

$data = json_decode(file_get_contents('php://input'));
$token = trim((string)($data->token ?? ''));
$otpInput = trim((string)($data->otp_input ?? ''));

if ($token === '' || $otpInput === '') {
    echo json_encode(['status' => 'error', 'message' => 'Thieu token hoac OTP.']);
    exit;
}

$payload = JWT_Helper::validate($token);
if (!$payload) {
    echo json_encode(['status' => 'error', 'message' => 'Phien xac thuc khong hop le.']);
    exit;
}

$purpose = (string)($payload->purpose ?? '');
$email = trim((string)($payload->email ?? ''));
$otpInToken = trim((string)($payload->otp ?? ''));
$exp = (int)($payload->exp ?? 0);

if ($purpose !== 'password_reset_otp' || $email === '' || $otpInToken === '') {
    echo json_encode(['status' => 'error', 'message' => 'Token khong dung muc dich.']);
    exit;
}

if ($exp > 0 && time() > $exp) {
    echo json_encode(['status' => 'error', 'message' => 'Ma OTP da het han.']);
    exit;
}

if ($otpInput !== $otpInToken) {
    echo json_encode(['status' => 'error', 'message' => 'Ma OTP khong chinh xac.']);
    exit;
}

$resetToken = JWT_Helper::create([
    'email' => $email,
    'purpose' => 'password_reset',
    'exp' => time() + (60 * 15),
]);

echo json_encode([
    'status' => 'success',
    'message' => 'Xac thuc OTP thanh cong.',
    'reset_token' => $resetToken,
]);
