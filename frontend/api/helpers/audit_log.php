<?php

// Ép PHP dùng UTF-8
ini_set('default_charset', 'UTF-8');

function write_audit_log($message)
{
    date_default_timezone_set('Asia/Ho_Chi_Minh');

    // Đảm bảo message là UTF-8
    if (!mb_check_encoding($message, 'UTF-8')) {
        $message = mb_convert_encoding($message, 'UTF-8', 'auto');
    }

    $time = date('H:i') . ' ngày ' . date('d/m/Y');

    // DÒNG LOG CHUẨN UTF-8
    $line = $message . ' lúc ' . $time . PHP_EOL;

    $logDir = __DIR__ . '/../logs';

    // Tạo thư mục nếu chưa có
    if (!is_dir($logDir)) {
        if (!mkdir($logDir, 0777, true)) {
            error_log('AUDIT LOG: Không tạo được thư mục logs');
            return false;
        }
    }

    // Kiểm tra quyền ghi
    if (!is_writable($logDir)) {
        error_log('AUDIT LOG: Thư mục logs không có quyền ghi');
        return false;
    }

    $file = $logDir . '/audit.txt';

    // GHI FILE VỚI UTF-8
    $result = file_put_contents(
        $file,
        $line,
        FILE_APPEND | LOCK_EX
    );

    if ($result === false) {
        error_log('AUDIT LOG: Ghi file audit.txt thất bại');
        return false;
    }

    return true;
}
