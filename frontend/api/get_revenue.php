<?php
include_once './config/database.php';
include_once './utils/jwt_helper.php';

header('Content-Type: application/json');

$vendor_id = $_GET['vendor_id'] ?? null;
$role = $_GET['role'] ?? null;

if (!$vendor_id || $role !== 'vendor') {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

try {
    // 1. LẤY DANH SÁCH ĐƠN HÀNG ĐÃ GIAO HÀNG (ĐỂ TÍNH DOANH THU)
    $query = "SELECT o.*, u.name as customer_name 
              FROM orders o 
              JOIN users u ON o.customer_id = u.id 
              WHERE o.vendor_id = :vid AND o.delivery_status = 'Đã giao hàng'
              ORDER BY o.created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute([':vid' => $vendor_id]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. ĐẾM SỐ ĐƠN HÀNG CHỜ THANH TOÁN (KHẮC PHỤC CON SỐ 0)
    // Đếm các đơn của vendor này có trạng thái 'Chờ thanh toán'
    $countQuery = "SELECT COUNT(*) as pending_total 
                   FROM orders 
                   WHERE vendor_id = :vid AND payment_status = 'Chờ thanh toán'";
    $stmtCount = $conn->prepare($countQuery);
    $stmtCount->execute([':vid' => $vendor_id]);
    $pendingCount = $stmtCount->fetch(PDO::FETCH_ASSOC)['pending_total'];

    // 3. LOGIC BIỂU ĐỒ (Doanh thu thực nhận theo tháng)
    $chartQuery = "SELECT MONTH(created_at) as month, SUM(total_amount * 0.92) as net_monthly 
                   FROM orders 
                   WHERE vendor_id = :vid AND delivery_status = 'Đã giao hàng' 
                   AND YEAR(created_at) = YEAR(CURDATE())
                   GROUP BY MONTH(created_at)";
    $stmtChart = $conn->prepare($chartQuery);
    $stmtChart->execute([':vid' => $vendor_id]);
    $chartDataRaw = $stmtChart->fetchAll(PDO::FETCH_ASSOC);

    $monthlyStats = array_fill(1, 12, 0);
    foreach($chartDataRaw as $data) {
        $monthlyStats[(int)$data['month']] = (float)$data['net_monthly'];
    }

    // 4. TÍNH TỔNG WIDGETS
    $total_gross = 0;
    $processedOrders = [];
    foreach ($orders as $row) {
        $amount = (float)$row['total_amount'];
        $total_gross += $amount;
        $processedOrders[] = [
            'id' => $row['order_code'],
            'customer' => $row['customer_name'],
            'date' => date('d/m/Y', strtotime($row['created_at'])),
            'amount' => $amount,
            'feeRate' => 8,
            'paymentStatus' => $row['payment_status']
        ];
    }

    echo json_encode([
        "status" => "success",
        "orders" => $processedOrders,
        "chart_data" => array_values($monthlyStats),
        "stats" => [
            "net_revenue" => $total_gross * 0.92,
            "platform_fee" => $total_gross * 0.08,
            "pending_count" => (int)$pendingCount // TRẢ VỀ CON SỐ THỰC TẾ
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}