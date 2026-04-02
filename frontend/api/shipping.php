<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost';
$db   = 'uxi'; 
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Lỗi kết nối database: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$postData = json_decode(file_get_contents('php://input'), true);
if ($method === 'POST' && isset($postData['action'])) $action = $postData['action'];

switch ($action) {

    // 1. LẤY DANH SÁCH ĐƠN HÀNG
    case 'list_shipping_orders':
        try {
            $sql = "SELECT o.id, o.order_code, o.customer_name, o.delivery_status, 
                           cu.name as customer_real, 
                           vu.shop_name as vendor_shop, vu.name as vendor_name, 
                           o.created_at
                    FROM orders o
                    LEFT JOIN users cu ON o.customer_id = cu.id
                    LEFT JOIN users vu ON o.vendor_id = vu.id
                    ORDER BY o.created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $rawOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $orders = array_map(function($o) {
                return [
                    'db_id' => $o['id'],
                    'order_code' => $o['order_code'] ?? $o['id'], // Dự phòng nếu order_code trống
                    'customer' => !empty($o['customer_name']) ? $o['customer_name'] : ($o['customer_real'] ?? 'Khách hàng'),
                    'vendor' => !empty($o['vendor_shop']) ? $o['vendor_shop'] : ($o['vendor_name'] ?? 'vendor'),
                    'status' => $o['delivery_status'],
                    'created_at' => date('d/m/Y H:i', strtotime($o['created_at']))
                ];
            }, $rawOrders);

            echo json_encode(['status' => 'success', 'data' => $orders]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    // 2. LẤY CÀI ĐẶT (CARRIERS & RATES)
    case 'get_settings':
        try {
            $stmtC = $pdo->query("SELECT * FROM shipping_carriers ORDER BY id ASC");
            $carriers = $stmtC->fetchAll(PDO::FETCH_ASSOC);

            $stmtR = $pdo->query("SELECT * FROM shipping_rates ORDER BY id ASC");
            $rates = $stmtR->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['status' => 'success', 'data' => ['carriers' => $carriers, 'rates' => $rates]]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    // 3. THEO DÕI HÀNH TRÌNH (Sửa lỗi tìm kiếm)
    case 'track_order':
        $code = $_GET['code'] ?? '';
        if (!$code) {
            echo json_encode(['status' => 'error', 'message' => 'Vui lòng cung cấp mã đơn hàng']);
            exit;
        }

        try {
            // Tìm theo order_code trước, nếu không thấy thì tìm theo database ID
            $sql = "SELECT o.id, o.order_code, o.customer_name, o.delivery_status, cu.name as customer_real, vu.shop_name as vendor_shop, vu.name as vendor_name 
                    FROM orders o
                    LEFT JOIN users cu ON o.customer_id = cu.id
                    LEFT JOIN users vu ON o.vendor_id = vu.id
                    WHERE o.order_code = ? OR o.id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$code, $code]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                echo json_encode(['status' => 'error', 'message' => 'Không tìm thấy thông tin vận đơn này!']);
                exit;
            }

            $customerName = !empty($order['customer_name']) ? $order['customer_name'] : ($order['customer_real'] ?? 'Khách hàng');
            $vendorName = !empty($order['vendor_shop']) ? $order['vendor_shop'] : ($order['vendor_name'] ?? 'vendor');

            // Lấy hành trình
            $tSql = "SELECT status_title, description, created_at FROM order_tracking WHERE order_id = ? ORDER BY created_at DESC";
            $tStmt = $pdo->prepare($tSql);
            $tStmt->execute([$order['id']]);
            $timelineRaw = $tStmt->fetchAll(PDO::FETCH_ASSOC);

            $timeline = [];
            foreach ($timelineRaw as $t) {
                $timeline[] = [
                    'time' => date('d/m/Y H:i', strtotime($t['created_at'])),
                    'status' => $t['status_title'],
                    'desc' => $t['description']
                ];
            }

            if (empty($timeline)) {
                $timeline[] = [
                    'time' => date('d/m/Y H:i'),
                    'status' => $order['delivery_status'],
                    'desc' => 'Đơn hàng đang ở trạng thái xử lý mặc định.'
                ];
            }

            $response = [
                'id' => $order['order_code'] ?? $order['id'],
                'db_id' => $order['id'],
                'customer' => $customerName,
                'vendor' => $vendorName,
                'carrier' => "Giao hàng nội bộ",
                'timeline' => $timeline
            ];

            echo json_encode(['status' => 'success', 'data' => $response]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    // 4. BẬT/TẮT TRẠNG THÁI
    case 'toggle_status':
        $type = $postData['type'] ?? '';
        $id = $postData['id'] ?? 0;
        $table = ($type === 'carrier') ? 'shipping_carriers' : 'shipping_rates';
        try {
            $sql = "UPDATE $table SET is_active = NOT is_active WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id]);
            echo json_encode(['status' => 'success', 'message' => 'Cập nhật thành công']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    // 5. CHỈNH SỬA ĐỐI TÁC
    case 'edit_carrier':
        $id = $postData['id'] ?? 0;
        $name = $postData['name'] ?? '';
        $contact = $postData['contact'] ?? '';
        try {
            $sql = "UPDATE shipping_carriers SET name = ?, contact_phone = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$name, $contact, $id]);
            echo json_encode(['status' => 'success', 'message' => 'Đã cập nhật đối tác']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    // 6. CHỈNH SỬA CẤU HÌNH PHÍ SHIP (MỚI)
    case 'edit_rate':
        $id = $postData['id'] ?? 0;
        $base = $postData['base'] ?? 0;
        $per_kg = $postData['per_kg'] ?? 0;
        $express = $postData['express'] ?? 0;

        try {
            $sql = "UPDATE shipping_rates 
                    SET base_price = ?, price_per_kg = ?, express_surcharge = ? 
                    WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$base, $per_kg, $express, $id]);
            echo json_encode(['status' => 'success', 'message' => 'Cập nhật bảng giá thành công']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi: ' . $e->getMessage()]);
        }
        break;

    // 7. HỦY VẬN CHUYỂN
    case 'cancel_shipping':
        $db_id = $postData['order_db_id'] ?? 0;
        $reason = $postData['reason'] ?? '';
        try {
            $sql1 = "UPDATE orders SET delivery_status = 'Đã hủy', cancel_reason = ? WHERE id = ?";
            $stmt1 = $pdo->prepare($sql1);
            $stmt1->execute([$reason, $db_id]);

            $sql2 = "INSERT INTO order_tracking (order_id, status_title, description) VALUES (?, 'Đã hủy vận chuyển', ?)";
            $stmt2 = $pdo->prepare($sql2);
            $stmt2->execute([$db_id, "Lý do: " . $reason]);

            echo json_encode(['status' => 'success', 'message' => 'Đã hủy vận chuyển']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Hành động không hợp lệ']);
        break;
}
?>