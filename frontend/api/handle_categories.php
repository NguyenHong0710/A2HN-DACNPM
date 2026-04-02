<?php
// Cho phép CORS để React/Vue/Angular có thể gọi API
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

    // --- LẤY DANH SÁCH ĐỂ HIỂN THỊ RA BẢNG (TABLE) ---
    case 'list':
        try {
            // Lấy tất cả danh mục chưa bị xóa (deleted_at IS NULL)
            // Lấy thêm tên của danh mục cha (nếu có) để hiển thị cho đẹp
            $sql = "SELECT c.*, p.name as parent_name 
                    FROM categories c 
                    LEFT JOIN categories p ON c.parent_id = p.id 
                    WHERE c.deleted_at IS NULL 
                    ORDER BY c.display_order ASC, c.created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['status' => 'success', 'data' => $categories]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi lấy dữ liệu: ' . $e->getMessage()]);
        }
        break;

    // --- LẤY DANH SÁCH DANH MỤC LÀM DANH MỤC CHA (CHO DROPDOWN) ---
    case 'list_parents':
        try {
            // Chỉ lấy các danh mục 'active' và chưa bị xóa mềm
            $stmt = $pdo->prepare("SELECT id, name, parent_id FROM categories WHERE status = 'active' AND deleted_at IS NULL ORDER BY display_order ASC, name ASC");
            $stmt->execute();
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['status' => 'success', 'data' => $categories]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
        }
        break;

    // --- TẠO MỚI DANH MỤC ---
    case 'create':
        $name = $postData['name'] ?? '';
        $slug = $postData['slug'] ?? '';
        $parentId = !empty($postData['parentId']) ? (int)$postData['parentId'] : null;
        $description = $postData['description'] ?? null;
        $status = $postData['status'] ?? 'active';
        $displayOrder = isset($postData['displayOrder']) ? (int)$postData['displayOrder'] : 0;
        
        // Các trường mới theo Schema
        $metaTitle = $postData['metaTitle'] ?? null;
        $metaDesc = $postData['metaDescription'] ?? null;
        $metaKey = $postData['metaKeywords'] ?? null;
        $thumbnail = $postData['thumbnail'] ?? null;

        if (empty($name) || empty($slug)) {
            echo json_encode(['status' => 'error', 'message' => 'Tên danh mục và Slug không được để trống!']);
            exit;
        }

        try {
            // Kiểm tra Slug đã tồn tại chưa (chỉ xét những record chưa bị xóa mềm)
            $checkStmt = $pdo->prepare("SELECT id FROM categories WHERE slug = ? AND deleted_at IS NULL LIMIT 1");
            $checkStmt->execute([$slug]);
            if ($checkStmt->rowCount() > 0) {
                echo json_encode(['status' => 'error', 'message' => 'Đường dẫn tĩnh (Slug) này đã tồn tại!']);
                exit;
            }

            // Insert dữ liệu
            $sql = "INSERT INTO categories (name, slug, parent_id, description, status, display_order, meta_title, meta_description, meta_keywords, thumbnail) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$name, $slug, $parentId, $description, $status, $displayOrder, $metaTitle, $metaDesc, $metaKey, $thumbnail]);
            
            echo json_encode(['status' => 'success', 'message' => 'Tạo danh mục thành công!']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
        }
        break;

    // --- CẬP NHẬT DANH MỤC ---
    case 'update':
        $id = $postData['id'] ?? null;
        $name = $postData['name'] ?? '';
        $slug = $postData['slug'] ?? '';
        $parentId = !empty($postData['parentId']) ? (int)$postData['parentId'] : null;
        $description = $postData['description'] ?? null;
        $status = $postData['status'] ?? 'active';
        $displayOrder = isset($postData['displayOrder']) ? (int)$postData['displayOrder'] : 0;
        
        $metaTitle = $postData['metaTitle'] ?? null;
        $metaDesc = $postData['metaDescription'] ?? null;
        $metaKey = $postData['metaKeywords'] ?? null;
        $thumbnail = $postData['thumbnail'] ?? null;

        if (!$id || empty($name) || empty($slug)) {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu thông tin bắt buộc (ID, Tên hoặc Slug)!']);
            exit;
        }

        // Không cho phép chọn chính nó làm danh mục cha
        if ($id == $parentId) {
            echo json_encode(['status' => 'error', 'message' => 'Danh mục cha không hợp lệ!']);
            exit;
        }

        try {
            // Kiểm tra Slug có trùng với danh mục KHÁC không
            $checkStmt = $pdo->prepare("SELECT id FROM categories WHERE slug = ? AND id != ? AND deleted_at IS NULL LIMIT 1");
            $checkStmt->execute([$slug, $id]);
            if ($checkStmt->rowCount() > 0) {
                echo json_encode(['status' => 'error', 'message' => 'Đường dẫn tĩnh (Slug) này đã được sử dụng!']);
                exit;
            }

            // Update dữ liệu
            $sql = "UPDATE categories 
                    SET name=?, slug=?, parent_id=?, description=?, status=?, display_order=?, meta_title=?, meta_description=?, meta_keywords=?, thumbnail=? 
                    WHERE id=? AND deleted_at IS NULL";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$name, $slug, $parentId, $description, $status, $displayOrder, $metaTitle, $metaDesc, $metaKey, $thumbnail, $id]);
            
            echo json_encode(['status' => 'success', 'message' => 'Cập nhật thành công!']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
        }
        break;

    // --- XÓA DANH MỤC (XÓA MỀM - SOFT DELETE) ---
    case 'delete':
        $id = $postData['id'] ?? null;
        if ($id) {
            try {
                // Kiểm tra xem có danh mục con nào đang phụ thuộc không (chưa bị xóa)
                $checkChild = $pdo->prepare("SELECT id FROM categories WHERE parent_id = ? AND deleted_at IS NULL LIMIT 1");
                $checkChild->execute([$id]);
                if ($checkChild->rowCount() > 0) {
                     echo json_encode(['status' => 'error', 'message' => 'Không thể xóa vì danh mục này đang chứa danh mục con!']);
                     exit;
                }

                // Thực hiện XÓA MỀM (Cập nhật deleted_at = thời gian hiện tại)
                $stmt = $pdo->prepare("UPDATE categories SET deleted_at = CURRENT_TIMESTAMP() WHERE id = ?");
                $stmt->execute([$id]);
                
                echo json_encode(['status' => 'success', 'message' => 'Đã đưa danh mục vào thùng rác!']);
            } catch (PDOException $e) {
                echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu ID để xóa']);
        }
        break;

    // --- MẶC ĐỊNH LỖI ---
    default:
        echo json_encode(['status' => 'error', 'message' => 'Action không hợp lệ']);
        break;
}
?>