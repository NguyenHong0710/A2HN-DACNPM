<?php
// File: update_profile.php
include_once './config/database.php';
require_once './helpers/audit_log.php'; // ✅ audit log

// --- CẤU HÌNH ĐƯỜNG DẪN LƯU ẢNH ---
$target_dir = "uploads/avatars/";
$base_url = "http://localhost/nongsan-api/uploads/avatars/";

// Tạo thư mục nếu chưa có
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

// Kiểm tra method POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

// Lấy dữ liệu Text từ FormData
$id = $_POST['id'] ?? null;
$name = $_POST['name'] ?? '';
$shop_name = $_POST['shop_name'] ?? '';
$phone = $_POST['phone'] ?? '';
$address = $_POST['address'] ?? '';
$description = $_POST['description'] ?? '';

if (!$id) {
    echo json_encode(["status" => "error", "message" => "Thiếu ID người dùng"]);
    exit();
}

try {
    // --- XỬ LÝ UPLOAD ẢNH ---
    $avatar_sql_part = ""; 
    $params = [
        ':name' => $name,
        ':shop' => $shop_name,
        ':phone' => $phone,
        ':addr' => $address,
        ':desc' => $description,
        ':id' => $id
    ];

    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === 0) {
        $file_name = time() . "_" . basename($_FILES['avatar']['name']);
        $target_file = $target_dir . $file_name;
        $ext = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

        $valid_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($ext, $valid_extensions)) {
            echo json_encode(["status" => "error", "message" => "Chỉ chấp nhận file ảnh"]);
            exit();
        }

        if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $target_file)) {
            echo json_encode(["status" => "error", "message" => "Lỗi khi lưu file ảnh"]);
            exit();
        }

        $new_avatar_url = $base_url . $file_name;
        $avatar_sql_part = ", avatar = :avatar";
        $params[':avatar'] = $new_avatar_url;
    }

    // --- CẬP NHẬT DATABASE ---
    $query = "UPDATE users SET 
                name = :name,
                shop_name = :shop,
                phone = :phone,
                address = :addr,
                description = :desc
                $avatar_sql_part
              WHERE id = :id";

    $stmt = $conn->prepare($query);

    if ($stmt->execute($params)) {

        // 🔎 LẤY THÔNG TIN USER ĐỂ GHI LOG
        $stmtUser = $conn->prepare("
            SELECT id, name, role 
            FROM users 
            WHERE id = :id 
            LIMIT 1
        ");
        $stmtUser->execute([':id' => $id]);
        $userInfo = $stmtUser->fetch(PDO::FETCH_ASSOC);

        if ($userInfo) {
            $role = strtoupper($userInfo['role']);
            $uname = $userInfo['name'];
            $uid = $userInfo['id'];

            write_audit_log(
                "{$role} {$uname} (id {$uid}) đã cập nhật hồ sơ cá nhân"
            );
        }

        $response = [
            "status" => "success",
            "message" => "Cập nhật hồ sơ thành công!"
        ];
        if (isset($new_avatar_url)) {
            $response['new_avatar'] = $new_avatar_url;
        }

        echo json_encode($response);
    } else {
        echo json_encode(["status" => "error", "message" => "Không thể cập nhật Database"]);
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Lỗi Server: " . $e->getMessage()]);
}
