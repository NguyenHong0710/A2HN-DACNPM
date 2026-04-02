<?php
// CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once './config/database.php';
require_once './helpers/audit_log.php';

// Đọc dữ liệu JSON
$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->vendor_id) &&
    !empty($data->amount) &&
    !empty($data->bank_name) &&
    !empty($data->account_number) &&
    !empty($data->account_holder)
) {
    try {

        // 🔎 LẤY THÔNG TIN vendor
        $stmtvendor = $conn->prepare("
            SELECT id, name 
            FROM users 
            WHERE id = :id AND role = 'vendor'
            LIMIT 1
        ");
        $stmtvendor->execute([':id' => $data->vendor_id]);
        $vendor = $stmtvendor->fetch(PDO::FETCH_ASSOC);

        if (!$vendor) {
            echo json_encode([
                "status" => "error",
                "message" => "vendor không tồn tại"
            ]);
            exit;
        }

        // --- BƯỚC 1: TÍNH SỐ DƯ THỰC ---
        $sqlRev = "
            SELECT SUM(total_amount * 0.92) as total_earned 
            FROM orders 
            WHERE vendor_id = :vid AND delivery_status = 'Đã giao hàng'
        ";
        $stmtRev = $conn->prepare($sqlRev);
        $stmtRev->execute([':vid' => $vendor['id']]);
        $total_earned = (float)($stmtRev->fetch(PDO::FETCH_ASSOC)['total_earned'] ?? 0);

        $sqlWith = "
            SELECT SUM(amount) as total_out 
            FROM withdrawals 
            WHERE vendor_id = :vid AND status = 'approved'
        ";
        $stmtWith = $conn->prepare($sqlWith);
        $stmtWith->execute([':vid' => $vendor['id']]);
        $total_out = (float)($stmtWith->fetch(PDO::FETCH_ASSOC)['total_out'] ?? 0);

        $current_balance = $total_earned - $total_out;

        // --- BƯỚC 2: CHECK SỐ DƯ ---
        if ($data->amount > $current_balance) {
            echo json_encode([
                "status" => "error",
                "message" => "Số dư không đủ! Số dư khả dụng: " .
                    number_format($current_balance, 0, ',', '.') . " VNĐ"
            ]);
            exit;
        }

        // --- BƯỚC 3: LƯU YÊU CẦU RÚT ---
        $query = "
            INSERT INTO withdrawals 
            (vendor_id, amount, bank_name, account_number, account_holder, status, created_at)
            VALUES 
            (:vid, :amount, :bank, :acc_num, :acc_holder, 'pending', NOW())
        ";

        $stmt = $conn->prepare($query);
        $success = $stmt->execute([
            ':vid'        => $vendor['id'],
            ':amount'     => $data->amount,
            ':bank'       => $data->bank_name,
            ':acc_num'    => $data->account_number,
            ':acc_holder' => $data->account_holder
        ]);

        if ($success) {

            // 📝 AUDIT LOG – RÚT TIỀN
            write_audit_log(
                "vendor {$vendor['name']} (id {$vendor['id']}) đã gửi yêu cầu rút " .
                number_format($data->amount, 0, ',', '.') . " VNĐ"
            );

            echo json_encode([
                "status" => "success",
                "message" => "Yêu cầu rút tiền đã được gửi. Vui lòng chờ vendor phê duyệt!"
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Không thể lưu yêu cầu vào hệ thống."
            ]);
        }

    } catch (PDOException $e) {
        echo json_encode([
            "status" => "error",
            "message" => "Lỗi Database: " . $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Vui lòng điền đầy đủ thông tin rút tiền."
    ]);
}
?>
