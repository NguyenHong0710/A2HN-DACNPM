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
    
    // --- LẤY DANH SÁCH USER THEO 3 NHÓM ---
    case 'list':
        try {
            $stmt = $pdo->prepare("SELECT id, name, email, role, is_online, is_approved FROM users ORDER BY id DESC");
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Khởi tạo mảng phân nhóm như React cần
            $data = [
                'vendor' => [],
                'vendor' => [],
                'customers' => []
            ];

            foreach ($users as $u) {
                // 1. Xử lý trạng thái (Status)
                if ($u['is_approved'] == 0) {
                    $status = 'Banned';
                } else {
                    $status = ($u['is_online'] == 1) ? 'Online' : 'Offline';
                }

                // 2. Map Role từ Database sang format của React
                $reactRoleCode = 'USER_ROLE';
                $reactRoleName = 'Customer';
                
                if ($u['role'] === 'vendor') {
                    // Mặc định cho là vendor Tổng, thực tế có thể cần thêm cột phân loại vendor
                    $reactRoleCode = 'SUPER_vendor'; 
                    $reactRoleName = 'vendor Tổng';
                } elseif ($u['role'] === 'vendor') {
                    $reactRoleCode = 'vendor_ROLE';
                    $reactRoleName = 'vendor';
                }

                // Format lại item
                $item = [
                    'id' => $u['id'],
                    'name' => $u['name'],
                    'email' => $u['email'],
                    'role' => $reactRoleCode,
                    'roleName' => $reactRoleName,
                    'status' => $status
                ];

                // Phân loại vào từng mảng
                if ($u['role'] === 'vendor') {
                    $data['vendor'][] = $item;
                } elseif ($u['role'] === 'vendor') {
                    $data['vendor'][] = $item;
                } else {
                    $data['customers'][] = $item;
                }
            }

            echo json_encode(['status' => 'success', 'data' => $data]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    // --- CẬP NHẬT QUYỀN TRUY CẬP (ROLE) ---
    case 'update_role':
        $userId = $postData['id'] ?? null;
        $newReactRole = $postData['role'] ?? null;

        if ($userId && $newReactRole) {
            // Map từ format React về Database ENUM
            $dbRole = 'customer'; // Mặc định
            if (in_array($newReactRole, ['SUPER_vendor', 'SUPPORT_vendor'])) {
                $dbRole = 'vendor';
            } elseif ($newReactRole === 'vendor_ROLE') {
                $dbRole = 'vendor';
            }

            try {
                $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
                if ($stmt->execute([$dbRole, $userId])) {
                    echo json_encode(['status' => 'success', 'message' => 'Cập nhật phân quyền thành công']);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'Lỗi khi cập nhật']);
                }
            } catch (PDOException $e) {
                echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu ID hoặc Role']);
        }
        break;

    // --- KHÓA / MỞ KHÓA TÀI KHOẢN ---
    case 'toggle_ban':
        $userId = $postData['id'] ?? null;
        // status truyền lên: 'ban' hoặc 'unban'
        $actionType = $postData['action_type'] ?? 'ban'; 

        if ($userId) {
            $isApproved = ($actionType === 'ban') ? 0 : 1;
            
            try {
                $stmt = $pdo->prepare("UPDATE users SET is_approved = ? WHERE id = ?");
                $stmt->execute([$isApproved, $userId]);
                echo json_encode(['status' => 'success', 'message' => 'Đã cập nhật trạng thái tài khoản']);
            } catch (PDOException $e) {
                echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu ID người dùng']);
        }
        break;

    // --- GỬI CẢNH BÁO TÀI KHOẢN ---
    case 'warn_user':
        $userId = $postData['id'] ?? null;
        
        // Nhận thêm vendor_id và message từ Frontend. 
        // Nếu Frontend chưa kịp gửi, ta set giá trị mặc định để tránh lỗi CSDL.
        $vendorId = $postData['vendor_id'] ?? 1; // Giả sử ID của vendor đang login là 1
        $message = $postData['message'] ?? 'Tài khoản của bạn có dấu hiệu vi phạm chính sách. Vui lòng chú ý hoạt động của mình!';

        if ($userId) {
            try {
                // Lưu ý: Đổi tên bảng "warnings" thành tên bảng thực tế của bạn
                $stmt = $pdo->prepare("INSERT INTO warnings (user_id, vendor_id, message) VALUES (?, ?, ?)");
                $stmt->execute([$userId, $vendorId, $message]);
                
                echo json_encode(['status' => 'success', 'message' => 'Đã gửi cảnh báo và lưu vào lịch sử hệ thống']);
            } catch (PDOException $e) {
                echo json_encode(['status' => 'error', 'message' => 'Lỗi DB khi lưu cảnh báo: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu ID người dùng']);
        }
        break;

    // --- MẶC ĐỊNH LỖI ---
    default:
        echo json_encode(['status' => 'error', 'message' => 'Action không hợp lệ']);
        break;
}
?>