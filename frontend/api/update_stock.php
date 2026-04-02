<?php
include_once './config/database.php';
include_once './utils/jwt_helper.php';
require_once './helpers/audit_log.php'; // ✅ audit log

// 1. Lấy Token từ Header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

// Validate Token
$decoded = JWT_Helper::validate($token);
if (!$token || !$decoded) {
    echo json_encode(["status" => "error", "message" => "Lỗi xác thực Token!"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (isset($data->product_id) && isset($data->quantity_added)) {
    $product_id = (int)$data->product_id;
    $added = (int)$data->quantity_added;

    try {
        // Cập nhật tồn kho
        $query = "UPDATE products SET stock = stock + :added WHERE id = :pid";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':added', $added, PDO::PARAM_INT);
        $stmt->bindParam(':pid', $product_id, PDO::PARAM_INT);

        if ($stmt->execute() && $stmt->rowCount() > 0) {

            // 📝 GHI LOG NHẬP KHO
            write_audit_log(
                "User id {$decoded->id} đã nhập thêm {$added} sản phẩm cho product id {$product_id}"
            );

            echo json_encode([
                "status" => "success",
                "message" => "Đã nhập kho thành công!"
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Không có thay đổi nào được thực hiện"
            ]);
        }
    } catch (Exception $e) {
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Thiếu dữ liệu"
    ]);
}
?>
