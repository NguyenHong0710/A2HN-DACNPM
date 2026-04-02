<?php
// Cho phép CORS để React có thể gọi API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

// 1. KẾT NỐI DATABASE (Sử dụng PDO)
$host = "localhost";
$dbname = "uxi"; // Thay bằng tên database của bạn
$username = "root";             // Thay bằng username của bạn
$password = "";                 // Thay bằng password của bạn

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["error" => "Lỗi kết nối CSDL: " . $e->getMessage()]);
    exit();
}

// 2. LẤY THAM SỐ THỜI GIAN
$timeRange = isset($_GET['timeRange']) ? $_GET['timeRange'] : 'week';

// Thêm tiền tố 'orders.' để tránh lỗi mập mờ (ambiguous) khi JOIN các bảng sau này
$currentCondition = "";
$previousCondition = "";

switch ($timeRange) {
    case 'month':
        $currentCondition = "orders.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
        $previousCondition = "orders.created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) AND orders.created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)";
        break;
    case 'year':
        $currentCondition = "YEAR(orders.created_at) = YEAR(NOW())";
        $previousCondition = "YEAR(orders.created_at) = YEAR(NOW()) - 1";
        break;
    case 'week':
    default:
        $currentCondition = "orders.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $previousCondition = "orders.created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND orders.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)";
        break;
}

try {
    // ===================================================================================
    // 3. QUERY 4 CHỈ SỐ TỔNG QUAN (THỜI GIAN HIỆN TẠI) - Đã nhân 8% (0.08)
    // ===================================================================================
    $sql_stats = "SELECT 
                    ROUND(SUM(CASE WHEN payment_status != 'Hủy' THEN total_amount * 0.08 ELSE 0 END), 2) as total_revenue,
                    COUNT(id) as total_orders,
                    SUM(CASE WHEN payment_status = 'Hủy' THEN 1 ELSE 0 END) as canceled_orders,
                    COUNT(DISTINCT vendor_id) as new_vendor
                  FROM orders WHERE $currentCondition";
    $stmt = $conn->query($sql_stats);
    $currentStats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Xử lý null
    $currentRevenue = (float)($currentStats['total_revenue'] ?? 0);
    $currentOrders = (int)($currentStats['total_orders'] ?? 0);
    $cancelRate = $currentOrders > 0 ? round(($currentStats['canceled_orders'] / $currentOrders) * 100, 1) : 0;
    
    // ===================================================================================
    // 4. QUERY CHỈ SỐ KỲ TRƯỚC (ĐỂ TÍNH TĂNG TRƯỞNG) - Đã nhân 8% (0.08)
    // ===================================================================================
    $sql_prev_stats = "SELECT 
                        ROUND(SUM(CASE WHEN payment_status != 'Hủy' THEN total_amount * 0.08 ELSE 0 END), 2) as prev_revenue,
                        COUNT(id) as prev_orders
                       FROM orders WHERE $previousCondition";
    $stmt_prev = $conn->query($sql_prev_stats);
    $prevStats = $stmt_prev->fetch(PDO::FETCH_ASSOC);
    
    $prevRevenue = (float)($prevStats['prev_revenue'] ?? 0);
    $prevOrders = (int)($prevStats['prev_orders'] ?? 0);

    // Tính % tăng trưởng tổng quan
    $revenueGrowth = $prevRevenue > 0 ? round((($currentRevenue - $prevRevenue) / $prevRevenue) * 100, 1) : ($currentRevenue > 0 ? 100 : 0);
    $orderGrowth = $prevOrders > 0 ? round((($currentOrders - $prevOrders) / $prevOrders) * 100, 1) : ($currentOrders > 0 ? 100 : 0);

    // ===================================================================================
    // 5. QUERY BIỂU ĐỒ DOANH THU (Nhóm theo ngày) - Đã nhân 8% (0.08)
    // ===================================================================================
    $sql_chart = "SELECT DATE_FORMAT(orders.created_at, '%d/%m') as name, 
                         ROUND(SUM(total_amount * 0.08), 2) as total
                  FROM orders 
                  WHERE $currentCondition AND payment_status != 'Hủy'
                  GROUP BY DATE(orders.created_at)
                  ORDER BY DATE(orders.created_at) ASC";
    $stmt_chart = $conn->query($sql_chart);
    $revenueData = $stmt_chart->fetchAll(PDO::FETCH_ASSOC);

    // Ép kiểu total về số cho thư viện Recharts bên React
    foreach ($revenueData as &$row) {
        $row['total'] = (float)$row['total'];
    }

    // ===================================================================================
    // 6. QUERY HIỆU SUẤT vendor
    // ===================================================================================
    $sql_vendor = "SELECT 
                    CONCAT('vendor ID: ', vendor_id) as name, 
                    COUNT(id) as orders,
                    SUM(CASE WHEN payment_status != 'Hủy' THEN 1 ELSE 0 END) as success_orders
                   FROM orders 
                   WHERE $currentCondition
                   GROUP BY vendor_id
                   ORDER BY orders DESC LIMIT 5";
    $stmt_vendor = $conn->query($sql_vendor);
    $vendorRaw = $stmt_vendor->fetchAll(PDO::FETCH_ASSOC);
    
    $vendorPerformance = [];
    foreach ($vendorRaw as $v) {
        $rateVal = $v['orders'] > 0 ? round(($v['success_orders'] / $v['orders']) * 100) : 0;
        $vendorPerformance[] = [
            "name" => $v['name'],
            "orders" => (int)$v['orders'],
            "rate" => $rateVal . "%",
            "status" => $rateVal >= 80 ? 'Tốt' : 'Kém'
        ];
    }

    // ===================================================================================
    // 7. QUERY DỮ LIỆU THẬT: TOP SẢN PHẨM BÁN CHẠY (Dùng bảng order_items)
    // ===================================================================================
    // Bước 1: Lấy top sản phẩm bán chạy trong kỳ hiện tại
    $sql_top_products = "SELECT 
                            oi.product_id,
                            oi.product_name as name,
                            SUM(oi.quantity) as sales
                         FROM order_items oi
                         JOIN orders ON oi.order_id = orders.id
                         WHERE $currentCondition AND orders.payment_status != 'Hủy'
                         GROUP BY oi.product_id, oi.product_name
                         ORDER BY sales DESC
                         LIMIT 5";
    $stmt_top = $conn->query($sql_top_products);
    $currentTopProducts = $stmt_top->fetchAll(PDO::FETCH_ASSOC);

    $topProducts = [];
    
    // Bước 2: Duyệt qua từng sản phẩm top để tính tỷ lệ tăng trưởng so với kỳ trước
    foreach ($currentTopProducts as $product) {
        $prod_id = (int)$product['product_id'];
        $current_sales = (int)$product['sales'];

        // Lấy số lượng bán kỳ trước của sản phẩm này
        $sql_prev_prod = "SELECT SUM(oi.quantity) as prev_sales
                          FROM order_items oi
                          JOIN orders ON oi.order_id = orders.id
                          WHERE $previousCondition AND orders.payment_status != 'Hủy' AND oi.product_id = $prod_id";
        $stmt_prev_prod = $conn->query($sql_prev_prod);
        $prevProdData = $stmt_prev_prod->fetch(PDO::FETCH_ASSOC);
        
        $prev_sales = (int)($prevProdData['prev_sales'] ?? 0);

        // Tính % tăng trưởng của sản phẩm
        $grow = 0;
        if ($prev_sales > 0) {
            $grow = round((($current_sales - $prev_sales) / $prev_sales) * 100, 1);
        } elseif ($current_sales > 0) {
            $grow = 100; // Mới bán được trong kỳ này
        }

        $topProducts[] = [
            "name" => $product['name'],
            "sales" => $current_sales,
            "grow" => (float)$grow
        ];
    }

    // ===================================================================================
    // 8. TRẢ VỀ JSON CHO REACT
    // ===================================================================================
    echo json_encode([
        "status" => "success",
        "overview" => [
            "total_revenue" => $currentRevenue,
            "revenue_growth" => $revenueGrowth,
            "total_orders" => $currentOrders,
            "order_growth" => $orderGrowth,
            "cancel_rate" => $cancelRate,
            "new_vendor" => (int)$currentStats['new_vendor']
        ],
        "charts" => [
            "revenueData" => $revenueData
        ],
        "lists" => [
            "topProducts" => $topProducts,
            "vendorPerformance" => $vendorPerformance
        ]
    ]);

} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Lỗi truy vấn: " . $e->getMessage()]);
}
?>