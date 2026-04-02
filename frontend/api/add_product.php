<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once './config/database.php';
include_once './utils/jwt_helper.php';
include_once './helpers/audit_log.php'; // ✅ THÊM LOG

/* =====================================
   1. LẤY TOKEN TỪ HEADER
===================================== */
$authHeader = null;

if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
}
elseif (function_exists('getallheaders')) {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    }
}

if (!$authHeader) {
    echo json_encode([
        "status" => "error",
        "message" => "Thiếu token (Authorization header)"
    ]);
    exit();
}

if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    echo json_encode([
        "status" => "error",
        "message" => "Token không đúng định dạng"
    ]);
    exit();
}

$token = $matches[1];

/* =====================================
   2. GIẢI MÃ JWT
===================================== */
try {
    $decoded = JWT_Helper::validate($token);
    $user_id = $decoded->id ?? null;

    if (!$user_id) {
        throw new Exception("Token không chứa user_id");
    }

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Token không hợp lệ",
        "debug" => $e->getMessage()
    ]);
    exit();
}

/* =====================================
   3. LẤY USER TỪ DB
===================================== */
$stmt = $conn->prepare("
    SELECT id, role, is_approved 
    FROM users 
    WHERE id = :id 
    LIMIT 1
");
$stmt->execute([':id' => $user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode([
        "status" => "error",
        "message" => "User không tồn tại"
    ]);
    exit();
}

/* =====================================
   4. CHECK ROLE + DUYỆT
===================================== */
if ($user['role'] !== 'vendor') {
    echo json_encode([
        "status" => "error",
        "message" => "Chỉ tài khoản vendor mới được thêm sản phẩm"
    ]);
    exit();
}

if ((int)$user['is_approved'] !== 1) {
    echo json_encode([
        "status" => "error",
        "message" => "Tài khoản vendor chưa được duyệt bởi vendor"
    ]);
    exit();
}

/* =====================================
   5. UPLOAD ẢNH
===================================== */
$base_url = "http://localhost/nongsan-api/uploads/";
$target_dir = "./uploads/";

if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

$uploaded_images = [];

if (isset($_FILES['new_images'])) {
    foreach ($_FILES['new_images']['name'] as $i => $nameImg) {
        if (!empty($nameImg)) {
            $ext = pathinfo($nameImg, PATHINFO_EXTENSION);
            $filename = time() . "_{$i}." . $ext;
            if (move_uploaded_file($_FILES['new_images']['tmp_name'][$i], $target_dir . $filename)) {
                $uploaded_images[] = $base_url . $filename;
            }
        }
    }
}

/* =====================================
   6. LẤY DỮ LIỆU POST
===================================== */
$name = $_POST['name'] ?? '';
$category = $_POST['category'] ?? '';
$price = $_POST['price'] ?? 0;
$stock = $_POST['stock'] ?? 0;
$unit = $_POST['unit'] ?? '';
$origin = $_POST['origin'] ?? '';
$description = $_POST['description'] ?? '';
$status = $_POST['status'] ?? 'Còn hàng';

/* =====================================
   7. INSERT PRODUCT + LOG
===================================== */
try {
    $stmt = $conn->prepare("
        INSERT INTO products
        (vendor_id, name, category, price, stock, unit, origin, description, status, approval_status, is_banned, images)
        VALUES
        (:vid, :name, :cat, :price, :stock, :unit, :origin, :desc, :status, 'pending', 0, :imgs)
    ");

    $stmt->execute([
        ':vid'    => $user_id,
        ':name'   => $name,
        ':cat'    => $category,
        ':price'  => $price,
        ':stock'  => $stock,
        ':unit'   => $unit,
        ':origin' => $origin,
        ':desc'   => $description,
        ':status' => $status,
        ':imgs'   => json_encode($uploaded_images)
    ]);

    // ✅ GHI LOG CHỈ KHI THÀNH CÔNG
    write_audit_log(
        "vendor id $user_id đã thêm sản phẩm $name"
    );

    echo json_encode([
        "status" => "success",
        "message" => "Thêm sản phẩm thành công, vui lòng chờ vendor phê duyệt"
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Lỗi database: " . $e->getMessage()
    ]);
}
?>
