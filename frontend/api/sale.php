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

function upsertPromotionFromSale(PDO $pdo, array $saleRow)
{
    $saleId = (int)($saleRow['id'] ?? 0);
    if ($saleId <= 0) {
        return;
    }

    $code = 'SALE' . $saleId;
    $name = (string)($saleRow['name'] ?? ('Voucher Sale #' . $saleId));
    $value = (float)($saleRow['discount_value'] ?? 0);
    $startDate = !empty($saleRow['start_date']) ? $saleRow['start_date'] : date('Y-m-d');
    $endDate = !empty($saleRow['end_date']) ? $saleRow['end_date'] : date('Y-m-d');
    $usageLimit = isset($saleRow['usage_limit']) && $saleRow['usage_limit'] !== null ? (int)$saleRow['usage_limit'] : 0;
    $status = ((string)($saleRow['status'] ?? 'Active') === 'Active') ? 1 : 0;
    $promotionType = 'fixed';

    $existsStmt = $pdo->prepare("SELECT id FROM promotions WHERE code = ? LIMIT 1");
    $existsStmt->execute([$code]);
    $promotionId = (int)($existsStmt->fetchColumn() ?: 0);

    if ($promotionId > 0) {
        $updateStmt = $pdo->prepare(
            "UPDATE promotions
             SET name = ?, type = ?, value = ?, scope = 'order', product_id = NULL,
                 vendor_id = NULL, start_date = ?, end_date = ?, usage_limit = ?, status = ?
             WHERE id = ?"
        );
        $updateStmt->execute([$name, $promotionType, $value, $startDate, $endDate, $usageLimit, $status, $promotionId]);
        return;
    }

    $insertStmt = $pdo->prepare(
        "INSERT INTO promotions
         (code, name, description, type, value, min_order_value, max_discount_value, scope, product_id, vendor_id, start_date, end_date, usage_limit, used_count, limit_per_user, status)
         VALUES (?, ?, NULL, ?, ?, 0, NULL, 'order', NULL, NULL, ?, ?, ?, 0, 1, ?)"
    );
    $insertStmt->execute([$code, $name, $promotionType, $value, $startDate, $endDate, $usageLimit, $status]);
}

function disablePromotionFromSale(PDO $pdo, int $saleId)
{
    if ($saleId <= 0) {
        return;
    }

    $code = 'SALE' . $saleId;
    $stmt = $pdo->prepare("UPDATE promotions SET status = 0 WHERE code = ?");
    $stmt->execute([$code]);
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

    // --- LẤY DANH SÁCH CHIẾN DỊCH KHUYẾN MÃI ---
    case 'list':
        try {
            // Đồng bộ trạng thái theo end_date để bản ghi đã gia hạn được kích hoạt lại.
            $updateSql = "UPDATE sale
                          SET status = CASE
                              WHEN end_date IS NOT NULL AND end_date < CURDATE() THEN 'Expired'
                              ELSE 'Active'
                          END
                          WHERE deleted_at IS NULL";
            $pdo->exec($updateSql);

            // Chỉ đồng bộ campaign loại Voucher từ bảng sale sang promotions.
            $syncStmt = $pdo->prepare("SELECT id, name, discount_value, start_date, end_date, usage_limit, status, type, deleted_at FROM sale");
            $syncStmt->execute();
            $voucherRows = $syncStmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($voucherRows as $row) {
                if (!empty($row['deleted_at'])) {
                    disablePromotionFromSale($pdo, (int)$row['id']);
                    continue;
                }

                if ((string)($row['type'] ?? '') !== 'Voucher') {
                    disablePromotionFromSale($pdo, (int)$row['id']);
                    continue;
                }

                upsertPromotionFromSale($pdo, $row);
            }

            // Lấy danh sách
            $sql = "SELECT * FROM sale WHERE deleted_at IS NULL ORDER BY created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $rawPromos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format lại dữ liệu cho giống với state initialsale trong React
            $promos = array_map(function($p) {
                // Nối usage_count và usage_limit thành dạng chuỗi (vd: "450/500" hoặc "1200")
                $usageStr = (string)$p['usage_count'];
                if ($p['usage_limit'] !== null) {
                    $usageStr .= '/' . $p['usage_limit'];
                }

                return [
                    'id' => $p['id'],
                    'name' => $p['name'],
                    'type' => $p['type'],
                    'discount' => $p['discount_value'], // Đổi tên key cho khớp React
                    'status' => $p['status'],
                    'start' => $p['start_date'],
                    'end' => $p['end_date'],
                    'usage' => $usageStr
                ];
            }, $rawPromos);
            
            echo json_encode(['status' => 'success', 'data' => $promos]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi lấy dữ liệu: ' . $e->getMessage()]);
        }
        break;

    // --- TẠO MỚI CHIẾN DỊCH ---
    case 'create':
        $name = $postData['name'] ?? '';
        $type = $postData['type'] ?? 'Flash Sale';
        $discountValue = isset($postData['discount']) ? (float)$postData['discount'] : 0;
        $startDate = !empty($postData['start']) ? $postData['start'] : null;
        $endDate = !empty($postData['end']) ? $postData['end'] : null;
        $status = ($endDate !== null && $endDate < date('Y-m-d')) ? 'Expired' : 'Active';
        
        // Mặc định tạo mới sẽ có lượt dùng bằng 0. usage_limit có thể thêm vào React form sau này, tạm thời để NULL
        $usageLimit = isset($postData['usageLimit']) && $postData['usageLimit'] !== '' ? (int)$postData['usageLimit'] : null;

        if (empty($name) || empty($discountValue)) {
            echo json_encode(['status' => 'error', 'message' => 'Tên chương trình và mức giảm không được để trống!']);
            exit;
        }

        try {
            $sql = "INSERT INTO sale (name, type, discount_value, status, start_date, end_date, usage_count, usage_limit) 
                    VALUES (?, ?, ?, ?, ?, ?, 0, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$name, $type, $discountValue, $status, $startDate, $endDate, $usageLimit]);

            $newSaleId = (int)$pdo->lastInsertId();
            if ($newSaleId > 0 && $type === 'Voucher') {
                upsertPromotionFromSale($pdo, [
                    'id' => $newSaleId,
                    'name' => $name,
                    'type' => $type,
                    'discount_value' => $discountValue,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'usage_limit' => $usageLimit,
                    'status' => $status,
                ]);
            } elseif ($newSaleId > 0) {
                disablePromotionFromSale($pdo, $newSaleId);
            }
            
            echo json_encode(['status' => 'success', 'message' => 'Tạo chiến dịch thành công!']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
        }
        break;

    // --- CẬP NHẬT CHIẾN DỊCH ---
    case 'update':
        $id = $postData['id'] ?? null;
        $name = $postData['name'] ?? '';
        $type = $postData['type'] ?? 'Flash Sale';
        $discountValue = isset($postData['discount']) ? (float)$postData['discount'] : 0;
        $startDate = !empty($postData['start']) ? $postData['start'] : null;
        $endDate = !empty($postData['end']) ? $postData['end'] : null;
        $status = ($endDate !== null && $endDate < date('Y-m-d')) ? 'Expired' : 'Active';

        if (!$id || empty($name) || empty($discountValue)) {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu thông tin bắt buộc (ID, Tên hoặc Mức giảm)!']);
            exit;
        }

        try {
            $sql = "UPDATE sale 
                    SET name=?, type=?, discount_value=?, status=?, start_date=?, end_date=? 
                    WHERE id=? AND deleted_at IS NULL";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$name, $type, $discountValue, $status, $startDate, $endDate, $id]);

            $usageStmt = $pdo->prepare("SELECT usage_limit FROM sale WHERE id = ? LIMIT 1");
            $usageStmt->execute([(int)$id]);
            $usageLimit = $usageStmt->fetchColumn();

            if ($type === 'Voucher') {
                upsertPromotionFromSale($pdo, [
                    'id' => (int)$id,
                    'name' => $name,
                    'type' => $type,
                    'discount_value' => $discountValue,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'usage_limit' => $usageLimit,
                    'status' => $status,
                ]);
            } else {
                disablePromotionFromSale($pdo, (int)$id);
            }
            
            echo json_encode(['status' => 'success', 'message' => 'Cập nhật thành công!']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
        }
        break;

    // --- XÓA CHIẾN DỊCH (XÓA MỀM) ---
    case 'delete':
        $id = $postData['id'] ?? null;
        if ($id) {
            try {
                // Thực hiện XÓA MỀM
                $stmt = $pdo->prepare("UPDATE sale SET deleted_at = CURRENT_TIMESTAMP() WHERE id = ?");
                $stmt->execute([$id]);
                disablePromotionFromSale($pdo, (int)$id);
                
                echo json_encode(['status' => 'success', 'message' => 'Đã đưa chiến dịch vào thùng rác!']);
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