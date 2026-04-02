<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
require_once './helpers/audit_log.php'; // ✅ audit log

include_once './config/database.php';
include_once './utils/jwt_helper.php';

/* =====================================
   1. XÁC THỰC TOKEN
===================================== */
$authHeader = null;
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (function_exists('getallheaders')) {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    }
}

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    echo json_encode(["status" => "error", "message" => "Truy cập bị từ chối. Thiếu hoặc sai định dạng Token."]);
    exit();
}

$token = $matches[1];

try {
    $decoded = JWT_Helper::validate($token);
    $logged_user_id = $decoded->id ?? null;
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Token không hợp lệ"]);
    exit();
}

/* =====================================
   2. XỬ LÝ HÌNH ẢNH (CŨ & MỚI)
===================================== */
$base_url = "http://localhost/nongsan-api/uploads/";
$target_dir = "./uploads/";
$final_images = [];

// Giữ lại ảnh cũ (đã có trên server)
if (isset($_POST['existing_images'])) {
    $final_images = $_POST['existing_images']; 
}

// Upload thêm ảnh mới
if (isset($_FILES['new_images'])) {
    $total = count($_FILES['new_images']['name']);
    for ($i = 0; $i < $total; $i++) {
        if (!empty($_FILES['new_images']['name'][$i])) {
            $ext = pathinfo($_FILES['new_images']['name'][$i], PATHINFO_EXTENSION);
            $filename = time() . "_edit_" . $i . "." . $ext;
            if (move_uploaded_file($_FILES['new_images']['tmp_name'][$i], $target_dir . $filename)) {
                $final_images[] = $base_url . $filename;
            }
        }
    }
}

/* =====================================
   3. LẤY DỮ LIỆU TỪ REQUEST
===================================== */
$id = $_POST['id'] ?? null;
$vendor_id = $_POST['vendor_id'] ?? null; // ID gửi từ frontend
$name = $_POST['name'] ?? '';
$category = $_POST['category'] ?? '';
$price = $_POST['price'] ?? 0;
$stock = $_POST['stock'] ?? 0;
$unit = $_POST['unit'] ?? '';
$origin = $_POST['origin'] ?? ''; // <--- CẬP NHẬT TRƯỜNG XUẤT XỨ
$description = $_POST['description'] ?? '';
$status = $_POST['status'] ?? 'Còn hàng';

// Bảo mật: vendor chỉ được sửa sản phẩm của chính mình
if ((int)$logged_user_id !== (int)$vendor_id) {
    echo json_encode(["status" => "error", "message" => "Bạn không có quyền sửa sản phẩm này!"]);
    exit();
}

$images_json = json_encode($final_images);

try {
    /* =====================================
       4. THỰC THI CẬP NHẬT DATABASE
    ===================================== */
    $query = "UPDATE products SET 
                name = :name, 
                category = :cat, 
                price = :price, 
                stock = :stock, 
                unit = :unit, 
                origin = :origin, 
                description = :desc, 
                status = :status, 
                images = :imgs,
                approval_status = 'pending', 
                is_banned = 0,
                ban_reason = NULL,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = :id AND vendor_id = :vid";

    $stmt = $conn->prepare($query);
    $result = $stmt->execute([
        ':name'    => $name,
        ':cat'     => $category,
        ':price'   => $price,
        ':stock'   => $stock,
        ':unit'    => $unit,
        ':origin'  => $origin, // <--- LƯU XUẤT XỨ VÀO DB
        ':desc'    => $description,
        ':status'  => $status,
        ':imgs'    => $images_json,
        ':id'      => $id,
        ':vid'     => $vendor_id
    ]);
if ($result) {

    // 🔎 LẤY THÔNG TIN USER (để log giống cancel)
    $stmtUser = $conn->prepare("
        SELECT id, name, role 
        FROM users 
        WHERE id = :id 
        LIMIT 1
    ");
    $stmtUser->execute([':id' => $logged_user_id]);
    $userInfo = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if ($userInfo) {
        $role = strtoupper($userInfo['role']);
        $name = $userInfo['name'];
        $uid  = $userInfo['id'];

        // 📝 GHI LOG CHUẨN
        write_audit_log(
            "{$role} {$name} (id {$uid}) đã cập nhật sản phẩm id {$id}"
        );
    }

    echo json_encode([
        "status" => "success", 
        "message" => "Cập nhật thành công. Vui lòng chờ vendor duyệt lại nội dung mới."
    ]);
}
 else {
        echo json_encode(["status" => "error", "message" => "Không có thay đổi nào được thực hiện."]);
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Lỗi Database: " . $e->getMessage()]);
}
?>