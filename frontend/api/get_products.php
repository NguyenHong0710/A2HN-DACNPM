<?php
include_once './config/database.php';

$vendor_id = isset($_GET['vendor_id']) ? $_GET['vendor_id'] : die();

try {
    $query = "SELECT * FROM products WHERE vendor_id = :vendor_id ORDER BY id DESC";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":vendor_id", $vendor_id);
    $stmt->execute();
    
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // PHP trả về JSON, React sẽ tự parse chuỗi 'images'
    echo json_encode($products);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>