<?php
// Cho phép CORS để React có thể gọi API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
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
    
    // --- LẤY DANH SÁCH SẢN PHẨM ---
    case 'list':
        try {
            // Lấy danh sách sản phẩm kèm theo tên Shop/vendor từ bảng users
            // Giả định bảng users có cột shop_name hoặc name
            $query = "
                SELECT p.*, COALESCE(u.shop_name, u.name, 'Gian hàng ẩn') as store 
                FROM products p 
                LEFT JOIN users u ON p.vendor_id = u.id 
                ORDER BY p.id DESC
            ";
            
            // Nếu bạn chưa có bảng users hoặc chưa JOIN được, dùng query này:
            // $query = "SELECT *, 'Gian hàng mặc định' as store FROM products ORDER BY id DESC";

            $stmt = $pdo->prepare($query);
            $stmt->execute();
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Ép kiểu các dữ liệu để Frontend React hoạt động mượt hơn
            $formattedProducts = array_map(function($p) {
                return [
                    'id' => (int)$p['id'],
                    'vendor_id' => (int)$p['vendor_id'],
                    'store' => $p['store'],
                    'name' => $p['name'],
                    'category' => $p['category'] ?? 'Chưa phân loại',
                    'price' => (float)$p['price'],
                    'stock' => (int)$p['stock'],
                    'unit' => $p['unit'],
                    'origin' => $p['origin'] ?? 'Không rõ',
                    'description' => $p['description'],
                    'status' => $p['status'],
                    'approval_status' => $p['approval_status'],
                    'is_banned' => (int)$p['is_banned'],
                    'ban_reason' => $p['ban_reason'],
                    'images' => $p['images'] // chuỗi JSON string
                ];
            }, $products);

            echo json_encode(['status' => 'success', 'data' => $formattedProducts]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    // --- PHÊ DUYỆT SẢN PHẨM ---
    case 'approve':
        $productId = $postData['id'] ?? null;
        if ($productId) {
            try {
                $stmt = $pdo->prepare("UPDATE products SET approval_status = 'approved', is_banned = 0 WHERE id = ?");
                $stmt->execute([$productId]);
                echo json_encode(['status' => 'success', 'message' => 'Đã phê duyệt sản phẩm']);
            } catch (PDOException $e) {
                echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu ID sản phẩm']);
        }
        break;

    // --- ĐÌNH CHỈ / CẤM SẢN PHẨM ---
    case 'ban':
        $productId = $postData['id'] ?? null;
        $banReason = $postData['ban_reason'] ?? 'Vi phạm chính sách nền tảng';
        
        if ($productId) {
            try {
                $stmt = $pdo->prepare("UPDATE products SET is_banned = 1, approval_status = 'rejected', ban_reason = ? WHERE id = ?");
                $stmt->execute([$banReason, $productId]);
                echo json_encode(['status' => 'success', 'message' => 'Đã đình chỉ sản phẩm']);
            } catch (PDOException $e) {
                echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu ID sản phẩm']);
        }
        break;

    // --- XÓA SẢN PHẨM ---
    case 'delete':
        $productId = $postData['id'] ?? null;
        if ($productId) {
            try {
                $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
                $stmt->execute([$productId]);
                echo json_encode(['status' => 'success', 'message' => 'Đã xóa sản phẩm khỏi hệ thống']);
            } catch (PDOException $e) {
                echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu ID sản phẩm']);
        }
        break;

    // --- MẶC ĐỊNH LỖI ---
    default:
        echo json_encode(['status' => 'error', 'message' => 'Action không hợp lệ']);
        break;
}
?>