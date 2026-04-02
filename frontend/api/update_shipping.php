<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once './config/database.php';
require_once './helpers/audit_log.php'; // ✅ audit log

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        $sql = "UPDATE shipping SET 
                    method = :method,
                    status = :status,
                    estimated_time = :etime,
                    note = :note
                WHERE shipping_code = :id";
        
        $stmt = $conn->prepare($sql);
        $success = $stmt->execute([
            ':method' => $data->method,
            ':status' => $data->status,
            ':etime'  => $data->estimatedTime,
            ':note'   => $data->note,
            ':id'     => $data->id
        ]);

        if ($success && $stmt->rowCount() > 0) {

            // 📝 GHI LOG
            write_audit_log(
                "Hệ thống đã cập nhật thông tin vận chuyển cho đơn {$data->id}"
            );

            echo json_encode([
                "status" => "success",
                "message" => "Cập nhật thành công"
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Không có thay đổi nào được thực hiện"
            ]);
        }
    } catch (PDOException $e) {
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ]);
    }
}
?>
