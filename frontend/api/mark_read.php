<?php
//mark_read.php
include_once './config/database.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->conversation_id) || !isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "Thiếu dữ liệu"]);
    exit;
}

$conversation_id = $data->conversation_id;
$reader_id = $data->user_id; 

try {
    // Đánh dấu tất cả tin nhắn gửi ĐẾN mình trong hội thoại này là Đã đọc
    $sql = "UPDATE messages SET is_read = 1 
            WHERE conversation_id = :cid 
            AND receiver_id = :uid 
            AND is_read = 0";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':cid' => $conversation_id,
        ':uid' => $reader_id
    ]);

    echo json_encode(["status" => "success", "message" => "Đã đọc"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>