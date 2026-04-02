<?php
// file: user_status.php
include_once './config/database.php';
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$action = isset($_GET['action']) ? $_GET['action'] : '';
// Định nghĩa domain của bạn để nối vào link ảnh nếu cần
$base_url = "http://localhost/nongsan-api/uploads/avatars/"; 

try {
    switch ($action) {
        // Lấy danh sách toàn bộ người dùng để vendor có thể chọn để nhắn tin
        case 'get_all_users':
            $sql = "SELECT id, name, shop_name, avatar, role, is_online FROM users ORDER BY role ASC, name ASC";
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($users as &$u) {
                // Xử lý logic lấy ảnh: Nếu có avatar thì nối link, không thì để null
                if (!empty($u['avatar'])) {
                    // Kiểm tra nếu avatar đã là link http thì giữ nguyên, nếu là tên file thì nối domain
                    $u['avatar'] = (filter_var($u['avatar'], FILTER_VALIDATE_URL)) 
                                    ? $u['avatar'] 
                                    : $base_url . $u['avatar'];
                } else {
                    $u['avatar'] = null;
                }
            }
            echo json_encode($users);
            break;

        // Chỉ lấy trạng thái Online của 1 user cụ thể (để cập nhật realtime)
        case 'get_online_status':
            $user_id = $_GET['id'];
            $stmt = $conn->prepare("SELECT id, is_online, avatar FROM users WHERE id = :id");
            $stmt->execute([':id' => $user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($user);
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Action invalid"]);
            break;
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>