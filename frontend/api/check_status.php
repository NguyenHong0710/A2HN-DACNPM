<?php
// Cho phép React truy cập (Sửa lỗi CORS)
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Nếu server vẫn đang chạy ổn định, trả về success
echo json_encode(["status" => "success"]);
exit;