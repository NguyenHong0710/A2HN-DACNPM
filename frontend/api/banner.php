<?php
// Cho phép CORS để React có thể gọi API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. KẾT NỐI DATABASE
$host = "localhost";
$dbname = "uxi";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Lỗi kết nối CSDL: " . $e->getMessage()]);
    exit();
}

// Thư mục lưu trữ ảnh trên server
$uploadDir = 'uploads/banners/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$action = $_GET['action'] ?? 'list';

try {
    switch ($action) {
        // ==========================================
        // LẤY DANH SÁCH BANNER HIỆN TẠI
        // ==========================================
        case 'list':
            // Lấy banner hệ thống
            $stmtSys = $conn->query("SELECT * FROM system_banners");
            $system = $stmtSys->fetchAll(PDO::FETCH_ASSOC);

            // Lấy banner quảng bá
            $stmtPromo = $conn->query("SELECT * FROM promo_banners ORDER BY position ASC");
            $promo = $stmtPromo->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "status" => "success",
                "data" => [
                    "system" => $system,
                    "promo" => $promo
                ]
            ]);
            break;

        // ==========================================
        // CẬP NHẬT BANNER HỆ THỐNG (Login, Register, Hero)
        // ==========================================
        case 'update_system':
            $banner_key = $_POST['banner_key'] ?? ''; // 'login', 'register', 'user_hero'
            if (empty($banner_key) || !isset($_FILES['image'])) {
                throw new Exception("Thiếu thông tin banner hoặc tệp tin.");
            }

            // 1. Tìm thông tin ảnh cũ để xóa
            $stmt = $conn->prepare("SELECT image_path FROM system_banners WHERE banner_key = :key");
            $stmt->execute([':key' => $banner_key]);
            $oldData = $stmt->fetch(PDO::FETCH_ASSOC);

            // 2. Xử lý tải lên ảnh mới
            $file = $_FILES['image'];
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $newFileName = "sys_" . $banner_key . "_" . time() . "." . $ext;
            $targetPath = $uploadDir . $newFileName;

            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                // 3. Xóa tệp tin cũ nếu tồn tại
                if ($oldData && !empty($oldData['image_path'])) {
                    if (file_exists($oldData['image_path']) && !strpos($oldData['image_path'], 'unsplash.com')) {
                        unlink($oldData['image_path']);
                    }
                }

                // 4. Cập nhật Database (Dùng INSERT ON DUPLICATE KEY UPDATE)
                $sql = "INSERT INTO system_banners (banner_key, image_path) 
                        VALUES (:key, :path) 
                        ON DUPLICATE KEY UPDATE image_path = :path";
                $stmtUpdate = $conn->prepare($sql);
                $stmtUpdate->execute([':key' => $banner_key, ':path' => $targetPath]);

                echo json_encode(["status" => "success", "message" => "Đã thay đổi banner hệ thống!", "path" => $targetPath]);
            } else {
                throw new Exception("Lỗi khi lưu tệp tin.");
            }
            break;

        // ==========================================
        // CẬP NHẬT BANNER QUẢNG BÁ (1-7)
        // ==========================================
        case 'update_promo':
            $position = (int)($_POST['position'] ?? 0);
            $note = $_POST['note'] ?? '';
            
            if ($position < 1 || $position > 7) {
                throw new Exception("Vị trí banner không hợp lệ.");
            }

            // 1. Tìm thông tin ảnh cũ
            $stmt = $conn->prepare("SELECT image_path FROM promo_banners WHERE position = :pos");
            $stmt->execute([':pos' => $position]);
            $oldData = $stmt->fetch(PDO::FETCH_ASSOC);

            $targetPath = $oldData['image_path'] ?? '';

            // 2. Nếu có tệp mới được tải lên
            if (isset($_FILES['image'])) {
                $file = $_FILES['image'];
                $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                $newFileName = "promo_pos" . $position . "_" . time() . "." . $ext;
                $newPath = $uploadDir . $newFileName;

                if (move_uploaded_file($file['tmp_name'], $newPath)) {
                    // Xóa tệp cũ
                    if (!empty($targetPath) && file_exists($targetPath) && !strpos($targetPath, 'unsplash.com')) {
                        unlink($targetPath);
                    }
                    $targetPath = $newPath;
                }
            }

            // 3. Cập nhật Database
            $sql = "INSERT INTO promo_banners (position, image_path, note) 
                    VALUES (:pos, :path, :note) 
                    ON DUPLICATE KEY UPDATE image_path = :path, note = :note";
            $stmtUpdate = $conn->prepare($sql);
            $stmtUpdate->execute([
                ':pos' => $position, 
                ':path' => $targetPath,
                ':note' => $note
            ]);

            echo json_encode(["status" => "success", "message" => "Đã cập nhật banner quảng bá!", "path" => $targetPath]);
            break;

        default:
            throw new Exception("Hành động không hợp lệ.");
    }
} catch(Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>