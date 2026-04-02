<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once './config/database.php';

// Giả sử bạn đã có logic lấy $vendor_id từ Token hoặc Session
$vendor_id = isset($_GET['vendor_id']) ? $_GET['vendor_id'] : null;

if (!$vendor_id) {
    echo json_encode(["status" => "error", "message" => "Thiếu vendor ID"]);
    exit;
}

try {
    // BƯỚC 1: QUÉT TOÀN BỘ BẢNG ORDERS (CẢ CŨ VÀ MỚI)
    // Tính tổng doanh thu thực nhận (92% của các đơn 'Đã giao hàng')
    $sqlRevenue = "SELECT SUM(total_amount * 0.92) as total_earned 
                   FROM orders 
                   WHERE vendor_id = :vid AND delivery_status = 'Đã giao hàng'";
    $stmtRev = $conn->prepare($sqlRevenue);
    $stmtRev->execute([':vid' => $vendor_id]);
    $total_earned = (float)($stmtRev->fetch(PDO::FETCH_ASSOC)['total_earned'] ?? 0);

    // BƯỚC 2: QUÉT TOÀN BỘ LỊCH SỬ RÚT TIỀN
    // Tính tổng tiền đã rút thành công (approved)
    $sqlWithdrawn = "SELECT SUM(amount) as total_out 
                     FROM withdrawals 
                     WHERE vendor_id = :vid AND status = 'approved'";
    $stmtWith = $conn->prepare($sqlWithdrawn);
    $stmtWith->execute([':vid' => $vendor_id]);
    $total_withdrawn = (float)($stmtWith->fetch(PDO::FETCH_ASSOC)['total_out'] ?? 0);

    // BƯỚC 3: TÍNH SỐ DƯ CUỐI CÙNG
    $current_balance = $total_earned - $total_withdrawn;

    // BƯỚC 4: CẬP NHẬT (LƯU) VÀO BẢNG vendor_wallets
    // Sử dụng ON DUPLICATE KEY UPDATE để nếu chưa có dòng của vendor thì INSERT, có rồi thì UPDATE
    $updateWallet = "INSERT INTO vendor_wallets (vendor_id, balance, total_withdrawn) 
                     VALUES (:vid, :bal, :withdrawn)
                     ON DUPLICATE KEY UPDATE balance = :bal, total_withdrawn = :withdrawn";
    $stmtUp = $conn->prepare($updateWallet);
    $stmtUp->execute([
        ':vid' => $vendor_id,
        ':bal' => $current_balance,
        ':withdrawn' => $total_withdrawn
    ]);

    // BƯỚC 5: LẤY LỊCH SỬ RÚT TIỀN ĐỂ TRẢ VỀ FRONTEND
    $historyQuery = "SELECT * FROM withdrawals WHERE vendor_id = :vid ORDER BY created_at DESC";
    $stmtH = $conn->prepare($historyQuery);
    $stmtH->execute([':vid' => $vendor_id]);
    $history = $stmtH->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "wallet" => [
            "balance" => $current_balance,
            "total_withdrawn" => $total_withdrawn
        ],
        "history" => $history
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Lỗi DB: " . $e->getMessage()]);
}