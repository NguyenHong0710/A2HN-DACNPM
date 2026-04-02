<?php
// Cho phép CORS để React gọi API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json; charset=utf-8');

// Xử lý preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==========================================
// 1. CẤU HÌNH DATABASE
// ==========================================
$host = 'localhost';
$db   = 'uxi'; // ĐIỀN TÊN DATABASE CỦA BẠN VÀO ĐÂY
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Lỗi kết nối CSDL: ' . $e->getMessage()]);
    exit;
}

// Nhận action từ GET hoặc POST JSON
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$postData = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST' && isset($postData['action'])) {
    $action = $postData['action'];
}

// ==========================================
// 2. XỬ LÝ CÁC ROUTE (ACTIONS)
// ==========================================

switch ($action) {

    // --- LẤY DANH SÁCH YÊU CẦU RÚT TIỀN (PAYOUTS) ---
    case 'list_payouts':
        try {
            // JOIN với bảng users để lấy tên thật của vendor (ưu tiên shop_name, nếu không có thì lấy name)
            $sql = "SELECT p.*, 
                           u.shop_name as vendor_shop, 
                           u.name as vendor_name 
                    FROM payout_requests p
                    LEFT JOIN users u ON p.vendor_id = u.id
                    WHERE p.deleted_at IS NULL 
                    ORDER BY p.created_at DESC";
                    
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $rawPayouts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $payouts = array_map(function($p) {
                return [
                    'db_id'   => $p['id'],
                    'id'      => $p['code'],
                    // Xử lý lấy tên shop
                    'vendor'  => !empty($p['vendor_shop']) ? $p['vendor_shop'] : ($p['vendor_name'] ?? "vendor #".$p['vendor_id']), 
                    'amount'  => number_format($p['amount'], 0, ',', '.'),
                    'raw_amount' => (float)$p['amount'], // Trả về số gốc để FE dễ tính tổng
                    'balance' => number_format($p['balance_available'], 0, ',', '.'),
                    'date'    => date('d/m/Y', strtotime($p['created_at'])),
                    'method'  => $p['bank_name'] . ' - ' . $p['bank_account'],
                    'status'  => ucfirst($p['status']), // pending -> Pending, approved -> Approved
                    'notes'   => $p['notes']
                ];
            }, $rawPayouts);
            
            echo json_encode(['status' => 'success', 'data' => $payouts]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
        }
        break;

    // --- LẤY DANH SÁCH KHIẾU NẠI HOÀN TIỀN (REFUNDS) ---
    case 'list_refunds':
        try {
            // JOIN 2 lần với bảng users để lấy tên customer và tên vendor
            $sql = "SELECT r.*, 
                           cu.name as customer_name,
                           vu.shop_name as vendor_shop, 
                           vu.name as vendor_name
                    FROM refund_requests r
                    LEFT JOIN users cu ON r.customer_id = cu.id
                    LEFT JOIN users vu ON r.vendor_id = vu.id
                    WHERE r.deleted_at IS NULL 
                    ORDER BY r.created_at DESC";
                    
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $rawRefunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $refunds = array_map(function($r) {
                return [
                    'db_id'    => $r['id'],
                    'id'       => $r['code'],
                    'customer' => $r['customer_name'] ?? "Khách #".$r['customer_id'],
                    'vendor'   => !empty($r['vendor_shop']) ? $r['vendor_shop'] : ($r['vendor_name'] ?? "vendor #".$r['vendor_id']),
                    'amount'   => number_format($r['amount'], 0, ',', '.'),
                    'raw_amount' => (float)$r['amount'],
                    'orderId'  => "#ORD-" . $r['order_id'],
                    'date'     => date('d/m/Y', strtotime($r['created_at'])),
                    'status'   => ucfirst($r['status']),
                    'reason'   => $r['reason'],
                    'notes'    => $r['notes']
                ];
            }, $rawRefunds);
            
            echo json_encode(['status' => 'success', 'data' => $refunds]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
        }
        break;

    // --- DUYỆT RÚT TIỀN (APPROVE PAYOUT) ---
    case 'approve_payout':
        $db_id = $postData['db_id'] ?? null;
        if (!$db_id) {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu ID yêu cầu!']);
            exit;
        }

        try {
            // Cập nhật trạng thái thành 'approved' và ghi lại thời gian duyệt
            $sql = "UPDATE payout_requests SET status = 'approved', approved_at = CURRENT_TIMESTAMP() WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$db_id]);
            
            echo json_encode(['status' => 'success', 'message' => 'Đã duyệt lệnh rút tiền thành công!']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
        }
        break;

    // --- XỬ LÝ HOÀN TIỀN (APPROVE REFUND) ---
    case 'approve_refund':
        $db_id = $postData['db_id'] ?? null;
        if (!$db_id) {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu ID yêu cầu!']);
            exit;
        }

        try {
            // Cập nhật trạng thái thành 'approved' và ghi lại thời gian xử lý
            $sql = "UPDATE refund_requests SET status = 'approved', resolved_at = CURRENT_TIMESTAMP() WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$db_id]);
            
            echo json_encode(['status' => 'success', 'message' => 'Đã phê duyệt hoàn tiền thành công!']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
        }
        break;

    // --- MẶC ĐỊNH ---
    default:
        echo json_encode(['status' => 'error', 'message' => 'Action không hợp lệ']);
        break;
}
?>