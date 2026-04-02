<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

include_once './config/database.php'; 

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$getAuthUser = function() {
    if (!class_exists('JWT_Helper')) {
        $jwtPath = __DIR__ . '/utils/jwt_helper.php';
        if (file_exists($jwtPath)) {
            require_once $jwtPath;
        }
    }

    if (!class_exists('JWT_Helper')) {
        return null;
    }

    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = '';

    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        $authHeader = $headers['authorization'];
    } elseif (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    $token = trim(preg_replace('/^Bearer\s+/i', '', (string)$authHeader));
    if ($token === '') {
        return null;
    }

    return JWT_Helper::validate($token);
};

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $normalizeDate = static function($value) {
        $value = trim((string)$value);
        if ($value === '') {
            return null;
        }

        $dt = DateTime::createFromFormat('Y-m-d', $value);
        if (!$dt || $dt->format('Y-m-d') !== $value) {
            return null;
        }

        return $value;
    };

    switch ($action) {
        // Danh sach voucher cho user app
        case 'get_user_vouchers':
            $today = date('Y-m-d');
            $sql = "SELECT id, code, name, description, type, value, min_order_value, max_discount_value, start_date, end_date
                FROM promotions
                WHERE status = 1
                                    AND code LIKE 'SALE%'
                  AND start_date <= :today
                  AND end_date >= :today
                ORDER BY id DESC";
            $stmt = $conn->prepare($sql);
            $stmt->execute([':today' => $today]);
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'validate_code':
            if ($method !== 'POST') {
                throw new Exception('Yeu cau phuong thuc POST.');
            }

            $payload = json_decode(file_get_contents("php://input"), true);
            $code = strtoupper(trim((string)($payload['code'] ?? '')));
            $orderTotal = (float)($payload['order_total'] ?? 0);

            if ($code === '') {
                echo json_encode(["status" => "error", "message" => "Vui long nhap ma voucher."]);
                break;
            }

            if ($orderTotal <= 0) {
                echo json_encode(["status" => "error", "message" => "Tong tien don hang khong hop le."]);
                break;
            }

            $today = date('Y-m-d');
            $sql = "SELECT id, code, name, type, value, min_order_value, max_discount_value, usage_limit, used_count, limit_per_user, status, start_date, end_date
                    FROM promotions
                    WHERE UPPER(code) = :code
                    LIMIT 1";
            $stmt = $conn->prepare($sql);
            $stmt->execute([':code' => $code]);
            $promo = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$promo) {
                echo json_encode(["status" => "error", "message" => "Ma voucher khong ton tai."]);
                break;
            }

            if ((int)$promo['status'] !== 1) {
                echo json_encode(["status" => "error", "message" => "Voucher da bi khoa."]);
                break;
            }

            if ($promo['start_date'] > $today || $promo['end_date'] < $today) {
                echo json_encode(["status" => "error", "message" => "Voucher da het han hoac chua den ngay ap dung."]);
                break;
            }

            $minOrder = (float)($promo['min_order_value'] ?? 0);
            if ($orderTotal < $minOrder) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Don hang chua dat gia tri toi thieu de dung voucher.",
                    "min_order_value" => $minOrder,
                ]);
                break;
            }

            $usageLimit = (int)($promo['usage_limit'] ?? 0);
            $usedCount = (int)($promo['used_count'] ?? 0);
            if ($usageLimit > 0 && $usedCount >= $usageLimit) {
                echo json_encode(["status" => "error", "message" => "Voucher da het luot su dung."]);
                break;
            }

            $authUser = $getAuthUser();
            if ($authUser && !empty($authUser->id)) {
                $limitPerUser = (int)($promo['limit_per_user'] ?? 0);
                if ($limitPerUser > 0) {
                    $usageStmt = $conn->prepare("SELECT COUNT(*) FROM promotion_usages WHERE promotion_id = :pid AND customer_id = :uid");
                    $usageStmt->execute([
                        ':pid' => (int)$promo['id'],
                        ':uid' => (int)$authUser->id,
                    ]);
                    $userUsage = (int)($usageStmt->fetchColumn() ?: 0);
                    if ($userUsage >= $limitPerUser) {
                        echo json_encode(["status" => "error", "message" => "Ban da dung het so lan ap dung voucher nay."]);
                        break;
                    }
                }
            }

            $value = (float)($promo['value'] ?? 0);
            $isPercent = strtolower((string)$promo['type']) === 'percent';
            $discount = $isPercent ? ($orderTotal * $value / 100) : $value;

            $maxDiscount = $promo['max_discount_value'] !== null ? (float)$promo['max_discount_value'] : null;
            if ($maxDiscount !== null && $maxDiscount > 0 && $discount > $maxDiscount) {
                $discount = $maxDiscount;
            }

            if ($discount < 0) {
                $discount = 0;
            }

            if ($discount > $orderTotal) {
                $discount = $orderTotal;
            }

            $finalTotal = max(0, $orderTotal - $discount);

            echo json_encode([
                "status" => "success",
                "data" => [
                    "promotion_id" => (int)$promo['id'],
                    "code" => (string)$promo['code'],
                    "name" => (string)$promo['name'],
                    "type" => (string)$promo['type'],
                    "value" => $value,
                    "discount_amount" => round($discount, 2),
                    "order_total" => round($orderTotal, 2),
                    "final_total" => round($finalTotal, 2),
                ],
            ]);
            break;

        // 1. Lấy danh sách khuyến mãi kèm tên sản phẩm
        case 'get_all':
            $vendor_id = $_GET['vendor_id'] ?? null;
            // Join với bảng products để lấy tên sản phẩm nếu scope là 'product'
            $sql = "SELECT pr.*, p.name as product_name 
                    FROM promotions pr
                    LEFT JOIN products p ON pr.product_id = p.id";
            
            if ($vendor_id) {
                $sql .= " WHERE pr.vendor_id = :vendor_id";
            }
            $sql .= " ORDER BY pr.id DESC";
            
            $stmt = $conn->prepare($sql);
            if ($vendor_id) $stmt->bindParam(':vendor_id', $vendor_id);
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        // 2. Lấy danh sách sản phẩm của vendor để hiển thị trong ô chọn (Select Box)
        case 'get_vendor_products':
            $vendor_id = $_GET['vendor_id'] ?? null;
            if (!$vendor_id) {
                echo json_encode(["status" => "error", "message" => "Thiếu ID người bán"]);
                exit;
            }
            $stmt = $conn->prepare("SELECT id, name, price FROM products WHERE vendor_id = ? AND is_banned = 0");
            $stmt->execute([$vendor_id]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'toggle_status':
            if ($method !== 'POST') {
                throw new Exception('Yeu cau phuong thuc POST.');
            }

            $data = json_decode(file_get_contents("php://input"), true);
            $id = isset($data['id']) ? (int)$data['id'] : 0;
            $new_status = isset($data['status']) ? (int)$data['status'] : -1;

            if ($id <= 0 || !in_array($new_status, [0, 1], true)) {
                echo json_encode(["status" => "error", "message" => "Du lieu cap nhat trang thai khong hop le."]);
                break;
            }

            $stmt = $conn->prepare("UPDATE promotions SET status = ? WHERE id = ?");
            if ($stmt->execute([$new_status, $id])) {
                echo json_encode(["status" => "success"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Khong the cap nhat trang thai"]);
            }
            break;

        // 3. Tạo mới hoặc Cập nhật
        case 'create':
        case 'update':
            if ($method !== 'POST') {
                throw new Exception('Yeu cau phuong thuc POST.');
            }

            $data = json_decode(file_get_contents("php://input"), true);
            if (!$data) {
                echo json_encode(["status" => "error", "message" => "Không nhận được dữ liệu"]);
                exit;
            }

            $code = strtoupper(trim((string)($data['code'] ?? '')));
            $name = trim((string)($data['name'] ?? ''));
            $type = strtolower(trim((string)($data['type'] ?? 'percent')));
            $scope = trim((string)($data['scope'] ?? 'order'));
            $value = isset($data['value']) ? (float)$data['value'] : 0;
            $startDate = $normalizeDate($data['startDate'] ?? '');
            $endDate = $normalizeDate($data['endDate'] ?? '');
            $usageLimit = isset($data['limit']) && $data['limit'] !== '' ? (int)$data['limit'] : 100;

            if ($code === '' || $name === '') {
                echo json_encode(["status" => "error", "message" => "Ma voucher va ten chuong trinh khong duoc de trong."]);
                break;
            }

            if (!in_array($type, ['percent', 'fixed'], true)) {
                echo json_encode(["status" => "error", "message" => "Loai voucher khong hop le."]);
                break;
            }

            if (!in_array($scope, ['order', 'product'], true)) {
                echo json_encode(["status" => "error", "message" => "Pham vi ap dung khong hop le."]);
                break;
            }

            if ($value <= 0) {
                echo json_encode(["status" => "error", "message" => "Gia tri giam phai lon hon 0."]);
                break;
            }

            if ($startDate === null || $endDate === null) {
                echo json_encode(["status" => "error", "message" => "Ngay bat dau va ngay ket thuc khong hop le."]);
                break;
            }

            if ($startDate > $endDate) {
                echo json_encode(["status" => "error", "message" => "Ngay ket thuc phai lon hon hoac bang ngay bat dau."]);
                break;
            }

            // Xử lý giá trị productId (Nếu chọn toàn cửa hàng thì productId là NULL)
            $product_id = ($scope === 'product' && !empty($data['productId'])) ? (int)$data['productId'] : null;

            if ($scope === 'product' && empty($product_id)) {
                echo json_encode(["status" => "error", "message" => "Vui long chon san pham cho voucher theo san pham."]);
                break;
            }

            if ($action == 'create') {
                $sql = "INSERT INTO promotions (code, name, type, value, scope, product_id, vendor_id, start_date, end_date, usage_limit, status) 
                        VALUES (:code, :name, :type, :value, :scope, :product_id, :vendor_id, :start_date, :end_date, :usage_limit, 1)";
            } else {
                $updateId = isset($data['id']) ? (int)$data['id'] : 0;
                if ($updateId <= 0) {
                    echo json_encode(["status" => "error", "message" => "ID voucher khong hop le."]);
                    break;
                }

                $sql = "UPDATE promotions SET code=:code, name=:name, type=:type, value=:value, scope=:scope, 
                        product_id=:product_id, start_date=:start_date, end_date=:end_date, usage_limit=:usage_limit 
                        WHERE id=:id";
            }
            
            $stmt = $conn->prepare($sql);
            $params = [
                ':code' => $code,
                ':name' => $name,
                ':type' => $type,
                ':value' => $value,
                ':scope' => $scope,
                ':product_id' => $product_id,
                ':start_date' => $startDate,
                ':end_date' => $endDate,
                ':usage_limit' => $usageLimit
            ];

            if ($action == 'create') {
                $params[':vendor_id'] = isset($data['vendor_id']) ? (int)$data['vendor_id'] : null;
            } else {
                $params[':id'] = $updateId;
            }

            if ($stmt->execute($params)) {
                echo json_encode(["status" => "success", "message" => "Thành công"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Lỗi thực thi SQL"]);
            }
            break;

        case 'delete':
            $id = $_GET['id'] ?? null;
            if ($id) {
                $stmt = $conn->prepare("DELETE FROM promotions WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(["status" => "success"]);
            }
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Hành động không hợp lệ"]);
            break;
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>