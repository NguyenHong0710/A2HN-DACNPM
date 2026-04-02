<?php
include_once './config/database.php';

$vendor_id = isset($_GET['vendor_id']) ? $_GET['vendor_id'] : die();

try {
    // Lấy id, name, stock, status của sản phẩm thuộc vendor đó
    $query = "SELECT id, name, stock, status FROM products WHERE vendor_id = :vid ORDER BY id DESC";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':vid', $vendor_id);
    $stmt->execute();
    
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["status" => "success", "data" => $products]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>