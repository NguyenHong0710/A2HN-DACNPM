<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// KẾT NỐI DATABASE
$host = "localhost";
$dbname = "uxi"; // Thay bằng tên CSDL của bạn
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Lỗi kết nối CSDL: " . $e->getMessage()]);
    exit();
}

date_default_timezone_set('Asia/Ho_Chi_Minh');

try {
    // 1. TỔNG QUAN HỆ THỐNG
    // Doanh thu hôm nay (Bỏ qua các đơn bị 'Hủy')
    $stmt = $conn->query("SELECT COALESCE(SUM(total_amount), 0) as today_revenue FROM orders WHERE DATE(created_at) = CURDATE() AND payment_status != 'Hủy'");
    $todayRevenue = $stmt->fetch(PDO::FETCH_ASSOC)['today_revenue'];

    // Số đơn hôm nay
    $stmt = $conn->query("SELECT COUNT(id) as today_orders FROM orders WHERE DATE(created_at) = CURDATE()");
    $todayOrders = $stmt->fetch(PDO::FETCH_ASSOC)['today_orders'];

    // vendor hoạt động
    $stmt = $conn->query("SELECT COUNT(id) as active_vendor FROM users WHERE role = 'vendor' AND is_approved = 1");
    $activevendor = $stmt->fetch(PDO::FETCH_ASSOC)['active_vendor'];

    // Customer mới (Trong tháng này)
    $stmt = $conn->query("SELECT COUNT(id) as new_customers FROM users WHERE role = 'customer' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())");
    $newCustomers = $stmt->fetch(PDO::FETCH_ASSOC)['new_customers'];

    // 2. BIỂU ĐỒ DOANH THU & ĐƠN HÀNG (7 NGÀY GẦN NHẤT)
    $revenueData = [];
    $ordersData = [];
    
    // Khởi tạo mảng 7 ngày trước để tránh bị trống data nếu ngày đó không có đơn
    for ($i = 6; $i >= 0; $i--) {
        $dateStr = date('Y-m-d', strtotime("-$i days"));
        $displayDate = date('d/m', strtotime("-$i days")); // Cho biểu đồ doanh thu
        
        // Tính Thứ cho biểu đồ đơn hàng
        $dayOfWeek = date('N', strtotime("-$i days"));
        $dayName = ($dayOfWeek == 7) ? 'CN' : 'Thứ ' . ($dayOfWeek + 1);

        $revenueData[$dateStr] = ["name" => $displayDate, "value" => 0];
        $ordersData[$dateStr] = ["name" => $dayName, "count" => 0];
    }

    // Lấy data doanh thu 7 ngày
    $stmt = $conn->query("SELECT DATE(created_at) as date, SUM(total_amount) as revenue FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND payment_status != 'Hủy' GROUP BY DATE(created_at)");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if(isset($revenueData[$row['date']])) {
            $revenueData[$row['date']]['value'] = (float)$row['revenue'];
        }
    }

    // Lấy data đơn hàng 7 ngày
    $stmt = $conn->query("SELECT DATE(created_at) as date, COUNT(id) as order_count FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY DATE(created_at)");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if(isset($ordersData[$row['date']])) {
            $ordersData[$row['date']]['count'] = (int)$row['order_count'];
        }
    }

    // 3. CẦN XỬ LÝ
    $stmt = $conn->query("SELECT COUNT(id) as pending_vendor FROM users WHERE role = 'vendor' AND is_approved = 0");
    $pendingvendor = $stmt->fetch(PDO::FETCH_ASSOC)['pending_vendor'];
    // Yêu cầu rút tiền & Tranh chấp chưa có bảng nên tạm set = 0
    $pendingWithdrawals = 0; 
    $pendingDisputes = 0;

    // 4. TOP 5 vendor BÁN CHẠY NHẤT
    $stmt = $conn->query("
        SELECT u.shop_name, SUM(o.total_amount) as total_revenue
        FROM orders o
        JOIN users u ON o.vendor_id = u.id
        WHERE o.payment_status != 'Hủy'
        GROUP BY o.vendor_id
        ORDER BY total_revenue DESC
        LIMIT 5
    ");
    $topvendor = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. SẢN PHẨM BÁN CHẠY NHẤT
    $stmt = $conn->query("
        SELECT product_name, SUM(quantity) as total_sold
        FROM order_items
        GROUP BY product_id, product_name
        ORDER BY total_sold DESC
        LIMIT 4
    ");
    $topProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // XUẤT JSON TRẢ VỀ CHO REACT
    echo json_encode([
        "status" => "success",
        "data" => [
            "overview" => [
                "todayRevenue" => $todayRevenue,
                "todayOrders" => $todayOrders,
                "activevendor" => $activevendor,
                "newCustomers" => $newCustomers
            ],
            "charts" => [
                "revenue" => array_values($revenueData),
                "orders" => array_values($ordersData)
            ],
            "pending" => [
                "vendor" => $pendingvendor,
                "withdrawals" => $pendingWithdrawals,
                "disputes" => $pendingDisputes
            ],
            "topvendor" => $topvendor,
            "topProducts" => $topProducts
        ]
    ]);

} catch(Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>