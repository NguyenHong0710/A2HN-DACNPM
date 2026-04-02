<?php
// Cho phép CORS để React có thể gọi API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Xử lý preflight request của CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. KẾT NỐI DATABASE
$host = "localhost";
$dbname = "uxi";                // Tên database của bạn
$username = "root";             // Username database
$password = "";                 // Password database

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Lỗi kết nối CSDL: " . $e->getMessage()]);
    exit();
}

// 2. ĐỊNH TUYẾN CHỨC NĂNG (ROUTING)
$action = isset($_GET['action']) ? $_GET['action'] : 'list';
$data = json_decode(file_get_contents("php://input"));

try {
    switch ($action) {
        // ==========================================
        // LẤY DANH SÁCH ĐÁNH GIÁ
        // ==========================================
        case 'list':
            $sql = "SELECT * FROM product_reviews ORDER BY created_at DESC";
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                "status" => "success",
                "data" => $reviews
            ]);
            break;

        // ==========================================
        // CẬP NHẬT TRẠNG THÁI (Approved, Flagged)
        // ==========================================
        case 'update_status':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new Exception("Yêu cầu phương thức POST.");
            
            if (empty($data->id) || empty($data->status)) {
                throw new Exception("Thiếu ID hoặc Trạng thái mới.");
            }

            $sql = "UPDATE product_reviews SET status = :status WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':status', $data->status);
            $stmt->bindParam(':id', $data->id);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                echo json_encode(["status" => "success", "message" => "Đã cập nhật trạng thái thành công!"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Không tìm thấy đánh giá hoặc trạng thái không đổi."]);
            }
            break;

        // ==========================================
        // XÓA ĐÁNH GIÁ
        // ==========================================
        case 'delete':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new Exception("Yêu cầu phương thức POST.");
            
            $id = $data->id ?? null;
            if (!$id) throw new Exception("Thiếu ID đánh giá cần xóa.");
            
            $sql = "DELETE FROM product_reviews WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            echo json_encode(["status" => "success", "message" => "Đã xóa đánh giá vĩnh viễn!"]);
            break;

        default:
            throw new Exception("Hành động không hợp lệ.");
    }
} catch(Exception $e) {
    echo json_encode([
        "status" => "error", 
        "message" => $e->getMessage()
    ]);
}
?>