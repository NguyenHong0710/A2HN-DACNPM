<?php
// Cho phép CORS để React gọi API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json; charset=utf-8');
require_once './utils/jwt_helper.php';

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

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$postData = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST' && isset($postData['action'])) {
    $action = $postData['action'];
}

// Map trạng thái DB (Tiếng Việt) sang Trạng thái React (Tiếng Anh)
$statusToReact = [
    'Chờ lấy hàng'   => 'Pending',
    'Đang giao hàng' => 'Shipping',
    'Đã giao hàng'   => 'Completed',
    'Đã hủy'         => 'Cancelled'
];

$reactToStatus = [
    'Pending'   => 'Chờ lấy hàng',
    'Shipping'  => 'Đang giao hàng',
    'Completed' => 'Đã giao hàng',
    'Cancelled' => 'Đã hủy'
];

function ensureUserNotificationsTable($pdo) {
    $sql = "CREATE TABLE IF NOT EXISTS user_notifications (
                id INT NOT NULL AUTO_INCREMENT,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                type VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
                metadata LONGTEXT NULL,
                is_read TINYINT(1) NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_user_notifications_user (user_id),
                KEY idx_user_notifications_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo->exec($sql);
}

function createUserNotification($pdo, $userId, $title, $content, $type = 'SYSTEM', $metadata = null) {
    $uid = (int)$userId;
    if ($uid <= 0) return;

    $stmt = $pdo->prepare("INSERT INTO user_notifications (user_id, title, content, type, metadata, is_read, created_at) VALUES (:uid, :title, :content, :type, :metadata, 0, NOW())");
    $stmt->execute([
        ':uid' => $uid,
        ':title' => trim((string)$title),
        ':content' => trim((string)$content),
        ':type' => trim((string)$type),
        ':metadata' => $metadata !== null ? json_encode($metadata, JSON_UNESCAPED_UNICODE) : null,
    ]);
}

ensureUserNotificationsTable($pdo);

// ==========================================
// 2. XỬ LÝ CÁC ROUTE (ACTIONS)
// ==========================================

switch ($action) {

    // --- TẠO ĐƠN HÀNG TỪ CHECKOUT ---
    case 'create_order':
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? ($headers['authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
        $token = trim(preg_replace('/^Bearer\s+/i', '', (string)$authHeader));
        $authUser = JWT_Helper::validate($token);

        if (!$authUser || empty($authUser->id)) {
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
            exit;
        }

        $customerId = (int)$authUser->id;
        $role = strtolower((string)($authUser->role ?? ''));
        if (!in_array($role, ['customer', 'user', 'vendor', 'vendor'], true)) {
            echo json_encode(['status' => 'error', 'message' => 'Không có quyền tạo đơn hàng']);
            exit;
        }

        $items = $postData['items'] ?? [];
        $totalPrice = (float)($postData['totalPrice'] ?? 0);
        $shippingAddress = trim((string)($postData['shippingAddress'] ?? ''));
        $paymentMethodInput = trim((string)($postData['paymentMethod'] ?? 'Tiền mặt'));
        $customerPhone = trim((string)($postData['customerPhone'] ?? ''));
        $customerName = trim((string)($postData['customerName'] ?? ''));
        $voucherCode = strtoupper(trim((string)($postData['voucherCode'] ?? '')));
        $voucherDiscountInput = (float)($postData['voucherDiscount'] ?? 0);

        if (!is_array($items) || count($items) === 0) {
            echo json_encode(['status' => 'error', 'message' => 'Giỏ hàng trống']);
            exit;
        }

        if ($shippingAddress === '' || $customerPhone === '') {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu thông tin giao hàng']);
            exit;
        }

        $vendorId = 0;
        foreach ($items as $it) {
            $candidatevendor = (int)($it['vendor_id'] ?? $it['vendorId'] ?? 0);
            if ($candidatevendor > 0) {
                $vendorId = $candidatevendor;
                break;
            }
        }

        if ($vendorId <= 0) {
            $firstProductId = (int)($items[0]['id'] ?? $items[0]['product_id'] ?? 0);
            if ($firstProductId > 0) {
                $vendortmt = $pdo->prepare("SELECT vendor_id FROM products WHERE id = ? LIMIT 1");
                $vendortmt->execute([$firstProductId]);
                $vendorId = (int)($vendortmt->fetchColumn() ?: 0);
            }
        }

        if ($vendorId <= 0) {
            echo json_encode(['status' => 'error', 'message' => 'Không xác định được nhà cung cấp']);
            exit;
        }

        if ($customerName === '') {
            $nameStmt = $pdo->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
            $nameStmt->execute([$customerId]);
            $customerName = (string)($nameStmt->fetchColumn() ?: 'Khách hàng');
        }

        $finalOrderTotal = 0.0;
        $appliedPromotionId = 0;
        $appliedDiscount = 0.0;

        $paymentMethod = $paymentMethodInput === 'Chuyển khoản' ? 'Chuyển khoản' : 'Tiền mặt';
        $paymentStatus = $paymentMethod === 'Chuyển khoản' ? 'Đã thanh toán' : 'Chờ thanh toán';
        $orderCode = '#ORD-' . substr((string)((int)round(microtime(true) * 1000)), -13);

        try {
            $pdo->beginTransaction();

            $normalizedItems = [];
            $calculatedSubtotal = 0.0;
            $detectedvendorId = 0;

            foreach ($items as $it) {
                $productId = (int)($it['id'] ?? $it['product_id'] ?? 0);
                $quantity = (int)($it['quantity'] ?? $it['amount'] ?? $it['qty'] ?? 1);
                if ($productId <= 0) {
                    throw new Exception('San pham khong hop le trong gio hang');
                }
                if ($quantity < 1) {
                    $quantity = 1;
                }

                $productStmt = $pdo->prepare("SELECT id, vendor_id, name, price, stock, unit, is_banned, approval_status FROM products WHERE id = :pid LIMIT 1 FOR UPDATE");
                $productStmt->execute([':pid' => $productId]);
                $productRow = $productStmt->fetch(PDO::FETCH_ASSOC);

                if (!$productRow) {
                    throw new Exception('San pham khong ton tai: #' . $productId);
                }

                if ((int)($productRow['is_banned'] ?? 0) === 1) {
                    throw new Exception('San pham tam khoa: ' . $productRow['name']);
                }

                if (($productRow['approval_status'] ?? 'approved') !== 'approved') {
                    throw new Exception('San pham chua duoc phe duyet: ' . $productRow['name']);
                }

                $availableStock = (int)($productRow['stock'] ?? 0);
                if ($availableStock < $quantity) {
                    throw new Exception('San pham "' . $productRow['name'] . '" chi con ' . $availableStock . ' trong kho.');
                }

                $itemvendorId = (int)($productRow['vendor_id'] ?? 0);
                if ($detectedvendorId <= 0) {
                    $detectedvendorId = $itemvendorId;
                } elseif ($itemvendorId !== $detectedvendorId) {
                    throw new Exception('Gio hang phai cung mot nha cung cap.');
                }

                $price = (float)($productRow['price'] ?? 0);
                if ($price <= 0) {
                    throw new Exception('Gia san pham khong hop le: ' . $productRow['name']);
                }

                $calculatedSubtotal += ($price * $quantity);
                $normalizedItems[] = [
                    'product_id' => $productId,
                    'product_name' => (string)$productRow['name'],
                    'unit' => (string)($productRow['unit'] ?? ''),
                    'quantity' => $quantity,
                    'price' => $price,
                ];
            }

            if ($detectedvendorId <= 0) {
                throw new Exception('Khong xac dinh duoc nha cung cap.');
            }

            $vendorId = $detectedvendorId;

            if ($voucherCode !== '') {
                $promoSql = "SELECT id, code, type, value, min_order_value, max_discount_value, usage_limit, used_count, limit_per_user, status, start_date, end_date
                             FROM promotions
                             WHERE UPPER(code) = :code
                             FOR UPDATE";
                $promoStmt = $pdo->prepare($promoSql);
                $promoStmt->execute([':code' => $voucherCode]);
                $promo = $promoStmt->fetch(PDO::FETCH_ASSOC);

                if (!$promo) {
                    throw new Exception('Mã voucher không tồn tại');
                }

                $today = date('Y-m-d');
                if ((int)$promo['status'] !== 1 || $promo['start_date'] > $today || $promo['end_date'] < $today) {
                    throw new Exception('Voucher đã hết hạn hoặc chưa đến thời gian áp dụng');
                }

                $minOrder = (float)($promo['min_order_value'] ?? 0);
                if ($calculatedSubtotal < $minOrder) {
                    throw new Exception('Đơn hàng chưa đạt giá trị tối thiểu để dùng voucher');
                }

                $usageLimit = (int)($promo['usage_limit'] ?? 0);
                $usedCount = (int)($promo['used_count'] ?? 0);
                if ($usageLimit > 0 && $usedCount >= $usageLimit) {
                    throw new Exception('Voucher đã hết lượt sử dụng');
                }

                $limitPerUser = (int)($promo['limit_per_user'] ?? 0);
                if ($limitPerUser > 0) {
                    $usageStmt = $pdo->prepare("SELECT COUNT(*) FROM promotion_usages WHERE promotion_id = :pid AND customer_id = :uid");
                    $usageStmt->execute([
                        ':pid' => (int)$promo['id'],
                        ':uid' => $customerId,
                    ]);
                    $customerUsageCount = (int)($usageStmt->fetchColumn() ?: 0);
                    if ($customerUsageCount >= $limitPerUser) {
                        throw new Exception('Bạn đã dùng hết số lần áp dụng voucher này');
                    }
                }

                $isPercent = strtolower((string)$promo['type']) === 'percent';
                $value = (float)($promo['value'] ?? 0);
                $expectedDiscount = $isPercent ? ($calculatedSubtotal * $value / 100) : $value;
                $maxDiscount = $promo['max_discount_value'] !== null ? (float)$promo['max_discount_value'] : null;
                if ($maxDiscount !== null && $maxDiscount > 0 && $expectedDiscount > $maxDiscount) {
                    $expectedDiscount = $maxDiscount;
                }
                if ($expectedDiscount < 0) {
                    $expectedDiscount = 0;
                }
                if ($expectedDiscount > $calculatedSubtotal) {
                    $expectedDiscount = $calculatedSubtotal;
                }

                $expectedFinalTotal = max(0, $calculatedSubtotal - $expectedDiscount);
                if (abs($expectedFinalTotal - $totalPrice) > 0.01 || abs($expectedDiscount - $voucherDiscountInput) > 0.01) {
                    throw new Exception('Thông tin voucher không hợp lệ, vui lòng áp dụng lại mã');
                }

                $appliedPromotionId = (int)$promo['id'];
                $appliedDiscount = round($expectedDiscount, 2);
                $finalOrderTotal = round($expectedFinalTotal, 2);
            } else {
                if (abs($calculatedSubtotal - $totalPrice) > 0.01) {
                    throw new Exception('Tổng tiền đơn hàng không hợp lệ');
                }
                $finalOrderTotal = round($calculatedSubtotal, 2);
            }

            $insertOrderSql = "INSERT INTO orders
                (order_code, customer_id, customer_name, vendor_id, total_amount, payment_method, payment_status, delivery_status, shipping_address, customer_phone)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Chờ lấy hàng', ?, ?)";

            $orderStmt = $pdo->prepare($insertOrderSql);
            $orderStmt->execute([
                $orderCode,
                $customerId,
                $customerName,
                $vendorId,
                $finalOrderTotal,
                $paymentMethod,
                $paymentStatus,
                $shippingAddress,
                $customerPhone,
            ]);

            $orderId = (int)$pdo->lastInsertId();

            $itemStmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, product_name, unit, quantity, price) VALUES (?, ?, ?, ?, ?, ?)");

            foreach ($normalizedItems as $item) {
                $itemStmt->execute([
                    $orderId,
                    $item['product_id'],
                    $item['product_name'],
                    $item['unit'] !== '' ? $item['unit'] : null,
                    $item['quantity'],
                    $item['price'],
                ]);

                $stockStmt = $pdo->prepare("UPDATE products SET stock = stock - :qty WHERE id = :pid AND stock >= :qty");
                $stockStmt->execute([
                    ':qty' => (int)$item['quantity'],
                    ':pid' => (int)$item['product_id'],
                ]);
                if ($stockStmt->rowCount() === 0) {
                    throw new Exception('Cap nhat ton kho that bai cho san pham: ' . $item['product_name']);
                }
            }

            if ($appliedPromotionId > 0) {
                $usageInsert = $pdo->prepare("INSERT INTO promotion_usages (promotion_id, customer_id, order_id) VALUES (?, ?, ?)");
                $usageInsert->execute([$appliedPromotionId, $customerId, $orderId]);

                $promoUpdate = $pdo->prepare("UPDATE promotions SET used_count = used_count + 1 WHERE id = ?");
                $promoUpdate->execute([$appliedPromotionId]);
            }

            createUserNotification(
                $pdo,
                $customerId,
                'Dat hang thanh cong',
                'Don hang ' . $orderCode . ' da duoc tao thanh cong va dang cho xu ly.',
                'SYSTEM',
                ['order_id' => $orderId, 'order_code' => $orderCode]
            );

            $pdo->commit();
            echo json_encode([
                'status' => 'success',
                'message' => 'Tạo đơn hàng thành công',
                'orderCode' => $orderCode,
                'orderId' => $orderId,
                'discountApplied' => $appliedDiscount,
                'orderTotal' => $finalOrderTotal,
            ]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    // --- LẤY DANH SÁCH ĐƠN HÀNG ---
    case 'list_orders':
        try {
            // JOIN với bảng users để lấy tên khách hàng và tên shop (vendor)
            $sql = "SELECT o.*, 
                           cu.name as customer_real_name, 
                           vu.shop_name, 
                           vu.name as vendor_name 
                    FROM orders o
                    LEFT JOIN users cu ON o.customer_id = cu.id
                    LEFT JOIN users vu ON o.vendor_id = vu.id
                    ORDER BY o.created_at DESC";
                    
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $rawOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $orders = array_map(function($o) use ($statusToReact) {
                // Ưu tiên tên nhập trong bảng order, nếu không có lấy từ bảng users
                $customerName = !empty($o['customer_name']) ? $o['customer_name'] : ($o['customer_real_name'] ?? "Khách #".$o['customer_id']);
                // Ưu tiên tên shop, nếu không có lấy tên của user vendor
                $vendorName = !empty($o['shop_name']) ? $o['shop_name'] : ($o['vendor_name'] ?? "vendor #".$o['vendor_id']);
                
                return [
                    'db_id'    => $o['id'],
                    'id'       => $o['order_code'],
                    'customer' => $customerName,
                    'vendor'   => $vendorName,
                    'total'    => (float)$o['total_amount'],
                    'shipFee'  => 30000, // Giả lập phí ship (Vì database chưa có cột ship_fee)
                    'status'   => $statusToReact[$o['delivery_status']] ?? 'Pending',
                    'date'     => date('Y-m-d H:i', strtotime($o['created_at'])),
                    'payment'  => $o['payment_method'],
                    'address'  => $o['shipping_address']
                ];
            }, $rawOrders);
            
            echo json_encode(['status' => 'success', 'data' => $orders]);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
        }
        break;

    // --- CẬP NHẬT TRẠNG THÁI GIAO HÀNG ---
    case 'update_status':
        $db_id = $postData['db_id'] ?? null;
        $new_status = $postData['status'] ?? null; // Trạng thái React (vd: Shipping, Completed)
        
        if (!$db_id || !$new_status) {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu thông tin bắt buộc!']);
            exit;
        }

        $db_status = $reactToStatus[$new_status] ?? null;
        if (!$db_status) {
            echo json_encode(['status' => 'error', 'message' => 'Trạng thái không hợp lệ!']);
            exit;
        }

        try {
            $sql = "UPDATE orders SET delivery_status = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$db_status, $db_id]);

            $orderInfoStmt = $pdo->prepare("SELECT customer_id, order_code FROM orders WHERE id = ? LIMIT 1");
            $orderInfoStmt->execute([$db_id]);
            $orderInfo = $orderInfoStmt->fetch(PDO::FETCH_ASSOC);
            if ($orderInfo && !empty($orderInfo['customer_id'])) {
                $statusContentMap = [
                    'Chờ lấy hàng' => 'Don hang ' . $orderInfo['order_code'] . ' dang cho lay hang.',
                    'Đang giao hàng' => 'Don hang ' . $orderInfo['order_code'] . ' dang duoc giao den ban.',
                    'Đã giao hàng' => 'Don hang ' . $orderInfo['order_code'] . ' da giao thanh cong.',
                    'Đã hủy' => 'Don hang ' . $orderInfo['order_code'] . ' da bi huy.',
                ];
                createUserNotification(
                    $pdo,
                    (int)$orderInfo['customer_id'],
                    'Cap nhat trang thai don hang',
                    $statusContentMap[$db_status] ?? ('Don hang ' . $orderInfo['order_code'] . ' da cap nhat trang thai: ' . $db_status),
                    'SYSTEM',
                    ['order_id' => (int)$db_id, 'order_code' => (string)$orderInfo['order_code']]
                );
            }
            
            echo json_encode(['status' => 'success', 'message' => 'Cập nhật trạng thái thành công!']);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
        }
        break;

    // --- HỦY ĐƠN HÀNG (CƯỠNG CHẾ BỞI vendor) ---
    case 'cancel_order':
        $db_id = $postData['db_id'] ?? null;
        $reason = $postData['reason'] ?? '';
        
        if (!$db_id) {
            echo json_encode(['status' => 'error', 'message' => 'Thiếu ID đơn hàng!']);
            exit;
        }

        try {
            // Hủy đơn hàng: Cập nhật delivery_status = 'Đã hủy', payment_status = 'Hủy', và lưu lý do hủy
            $sql = "UPDATE orders 
                    SET delivery_status = 'Đã hủy', 
                        payment_status = 'Hủy', 
                        cancel_reason = ? 
                    WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$reason, $db_id]);

            $orderInfoStmt = $pdo->prepare("SELECT customer_id, order_code FROM orders WHERE id = ? LIMIT 1");
            $orderInfoStmt->execute([$db_id]);
            $orderInfo = $orderInfoStmt->fetch(PDO::FETCH_ASSOC);
            if ($orderInfo && !empty($orderInfo['customer_id'])) {
                createUserNotification(
                    $pdo,
                    (int)$orderInfo['customer_id'],
                    'Don hang da bi huy',
                    'Don hang ' . $orderInfo['order_code'] . ' da bi huy. Ly do: ' . ($reason !== '' ? $reason : 'Khong co ly do'),
                    'SYSTEM',
                    ['order_id' => (int)$db_id, 'order_code' => (string)$orderInfo['order_code']]
                );
            }
            
            echo json_encode(['status' => 'success', 'message' => 'Đã hủy đơn hàng thành công!']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Lỗi DB: ' . $e->getMessage()]);
        }
        break;

    // --- MẶC ĐỊNH ---
    default:
        echo json_encode(['status' => 'error', 'message' => 'Action không hợp lệ']);
        break;
}
?>