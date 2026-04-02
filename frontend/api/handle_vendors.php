<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// --- KẾT NỐI DATABASE ---
$host = 'localhost';
$db   = 'uxi';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Lỗi kết nối database']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// --- 1. LẤY DANH SÁCH vendor (GET) ---
if ($method === 'GET') {
    try {
        // Lấy thông tin từ bảng users, role là 'vendor'
        // totalProducts lấy từ bảng products (giả định bạn có bảng này kết nối qua vendor_id)
        $sql = "SELECT 
                    id, name, email, phone, avatar, is_approved, created_at,
                    (SELECT COUNT(*) FROM products WHERE vendor_id = users.id) as totalProducts
                FROM users 
                WHERE role = 'vendor'
                ORDER BY created_at DESC";
        
        $stmt = $pdo->query($sql);
        $vendor = $stmt->fetchAll();

        $data = array_map(function($v) {
            // Map giá trị is_approved sang status cho React
            $status = 'Active';
            if ($v['is_approved'] == 0) $status = 'Pending';
            if ($v['is_approved'] == 2) $status = 'Banned'; // Giả sử 2 là Banned

            return [
                'id' => (int)$v['id'],
                'name' => $v['name'],
                'email' => $v['email'],
                'phone' => $v['phone'] ?? 'N/A',
                'status' => $status,
                'joinDate' => date('Y-m-d', strtotime($v['created_at'])),
                'totalProducts' => (int)$v['totalProducts'],
                'rating' => 4.5, // Giả lập rating
                'isMomoLinked' => false,
                'avatar' => $v['avatar'] ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=" . $v['id']
            ];
        }, $vendor);

        echo json_encode(['status' => 'success', 'data' => $data]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

// --- 2. CẬP NHẬT TRẠNG THÁI / MẬT KHẨU (POST) ---
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    if ($action === 'update_status') {
        $id = $input['id'];
        $newStatus = $input['status']; // 'Active', 'Pending', 'Banned'
        
        $val = 1;
        if ($newStatus === 'Pending') $val = 0;
        if ($newStatus === 'Banned') $val = 2;

        $stmt = $pdo->prepare("UPDATE users SET is_approved = ? WHERE id = ?");
        if ($stmt->execute([$val, $id])) {
            echo json_encode(['status' => 'success']);
        }
    }

    if ($action === 'update_password') {
        $id = $input['id'];
        $pass = password_hash($input['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        if ($stmt->execute([$pass, $id])) {
            echo json_encode(['status' => 'success']);
        }
    }
}