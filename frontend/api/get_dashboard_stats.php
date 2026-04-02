<?php
include_once './config/database.php';
include_once './utils/jwt_helper.php';

header('Content-Type: application/json');

$headers = function_exists('getallheaders') ? getallheaders() : [];
$authHeader = '';

foreach ($headers as $key => $value) {
    if (strcasecmp((string)$key, 'Authorization') === 0) {
        $authHeader = (string)$value;
        break;
    }
}

if ($authHeader === '' && isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = (string)$_SERVER['HTTP_AUTHORIZATION'];
}

if ($authHeader === '' && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = (string)$_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
}

$token = trim((string)preg_replace('/^Bearer\s+/i', '', $authHeader));
$user = JWT_Helper::validate($token);

if (!$user) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$vendor_id = $user->id;
$role = $user->role;

try {
    // 1. Thống kê số lượng sản phẩm đang bán
    $prodSql = "SELECT COUNT(*) as total_products FROM products WHERE approval_status = 'approved' AND is_banned = 0";
    if ($role === 'vendor') $prodSql .= " AND vendor_id = :vid";
    $stmtProd = $conn->prepare($prodSql);
    if ($role === 'vendor') $stmtProd->bindParam(':vid', $vendor_id);
    $stmtProd->execute();
    $total_products = $stmtProd->fetch(PDO::FETCH_ASSOC)['total_products'];

    // 2. Thống kê số lượng hóa đơn
    $orderSql = "SELECT COUNT(*) as total_orders FROM orders WHERE 1=1";
    if ($role === 'vendor') $orderSql .= " AND vendor_id = :vid";
    $stmtOrder = $conn->prepare($orderSql);
    if ($role === 'vendor') $stmtOrder->bindParam(':vid', $vendor_id);
    $stmtOrder->execute();
    $total_orders = $stmtOrder->fetch(PDO::FETCH_ASSOC)['total_orders'];

    // 3. Thống kê tổng doanh thu (Chỉ tính đơn Đã giao hàng thành công)
    $revenueSql = "SELECT SUM(total_amount) as total_revenue FROM orders WHERE delivery_status = 'Đã giao hàng'";
    if ($role === 'vendor') $revenueSql .= " AND vendor_id = :vid";
    $stmtRev = $conn->prepare($revenueSql);
    if ($role === 'vendor') $stmtRev->bindParam(':vid', $vendor_id);
    $stmtRev->execute();
    $total_revenue = (float)($stmtRev->fetch(PDO::FETCH_ASSOC)['total_revenue'] ?? 0);

    // 4. Lấy dữ liệu biểu đồ (Doanh thu theo tháng trong năm hiện tại)
    $chartSql = "SELECT MONTH(created_at) as month, SUM(total_amount) as amount 
                 FROM orders 
                 WHERE delivery_status = 'Đã giao hàng' AND YEAR(created_at) = YEAR(CURRENT_DATE)";
    if ($role === 'vendor') $chartSql .= " AND vendor_id = :vid";
    $chartSql .= " GROUP BY MONTH(created_at) ORDER BY MONTH(created_at) ASC";
    
    $stmtChart = $conn->prepare($chartSql);
    if ($role === 'vendor') $stmtChart->bindParam(':vid', $vendor_id);
    $stmtChart->execute();
    $chartRaw = $stmtChart->fetchAll(PDO::FETCH_ASSOC);

    // Chuẩn bị mảng 12 tháng mặc định là 0
    $chartData = array_fill(0, 12, 0);
    foreach ($chartRaw as $row) {
        $chartData[$row['month'] - 1] = (float)$row['amount'];
    }

    echo json_encode([
        "status" => "success",
        "stats" => [
            "products" => $total_products,
            "orders" => $total_orders,
            "revenue" => $total_revenue
        ],
        "chart" => $chartData
    ]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}