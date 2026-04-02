<?php
include_once './config/database.php';

$vendor_id = isset($_GET['vendor_id']) ? $_GET['vendor_id'] : die();

try {
    // Query phức tạp: Join đơn hàng và chi tiết đơn hàng
    // Chỉ tính các đơn "Đã thanh toán"
    $query = "SELECT 
                oi.product_name as name, 
                SUM(oi.quantity) as sold, 
                SUM(oi.quantity * oi.price) as revenue
              FROM order_items oi
              JOIN orders o ON oi.order_id = o.id
              WHERE o.vendor_id = :vid AND o.payment_status = 'Đã thanh toán'
              GROUP BY oi.product_id, oi.product_name
              ORDER BY revenue DESC
              LIMIT 10"; // Lấy top 10

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':vid', $vendor_id);
    $stmt->execute();
    
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["status" => "success", "data" => $data]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>