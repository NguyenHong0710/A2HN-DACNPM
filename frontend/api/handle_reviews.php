<?php
include_once './config/database.php';
include_once './utils/jwt_helper.php';
require_once './helpers/audit_log.php';

header('Content-Type: application/json');

// 1. Xác thực Token
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);
$user = JWT_Helper::validate($token);

if (!$user) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$user_id = $user->id;
$role = $user->role;
$method = $_SERVER['REQUEST_METHOD'];

// 🔎 LẤY THÔNG TIN USER TỪ DB (để ghi log)
$stmtUser = $conn->prepare("
    SELECT id, name, role 
    FROM users 
    WHERE id = :id 
    LIMIT 1
");
$stmtUser->execute([':id' => $user_id]);
$userInfo = $stmtUser->fetch(PDO::FETCH_ASSOC);

if (!$userInfo) {
    echo json_encode(["status" => "error", "message" => "User không tồn tại"]);
    exit;
}

try {
    /* =========================
       GET: LẤY DANH SÁCH REVIEW
    ========================== */
    if ($method === 'GET') {

        $sql = "SELECT 
                    r.id,
                    r.customer_id,
                    r.vendor_id,
                    r.product_id,
                    CASE 
                        WHEN r.target_type = 'product' THEN 'Sản phẩm'
                        WHEN r.target_type = 'vendor' THEN 'Gian hàng'
                        ELSE r.target_type 
                    END as type, 
                    r.target_type,
                    r.rating,
                    r.comment,
                    r.reply,
                    r.status,
                    r.created_at as date,
                    u.name as customer,
                    CASE 
                        WHEN r.target_type = 'product' THEN p.name
                        ELSE v.name
                    END as targetName
                FROM reviews r
                JOIN users u ON r.customer_id = u.id
                LEFT JOIN products p ON r.product_id = p.id
                LEFT JOIN users v ON r.vendor_id = v.id";

        if ($role === 'vendor') {
            $sql .= " WHERE r.vendor_id = :uid";
        } elseif ($role === 'customer') {
            $sql .= " WHERE r.customer_id = :uid";
        }

        $sql .= " ORDER BY r.created_at DESC";

        $stmt = $conn->prepare($sql);
        if ($role !== 'vendor') {
            $stmt->bindParam(':uid', $user_id);
        }

        $stmt->execute();
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($reviews as &$row) {
            $row['rating'] = (int)$row['rating'];
        }

        echo json_encode([
            "status" => "success",
            "data" => $reviews
        ]);

    /* =========================
       POST: REPLY / REPORT
    ========================== */
    } elseif ($method === 'POST') {

        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->action) || !isset($data->id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu thông tin xử lý"]);
            exit;
        }

        // Lấy info review để ghi log cho rõ
        $stmtReview = $conn->prepare("
            SELECT id, product_id, vendor_id, customer_id 
            FROM reviews 
            WHERE id = :id
            LIMIT 1
        ");
        $stmtReview->execute([':id' => $data->id]);
        $review = $stmtReview->fetch(PDO::FETCH_ASSOC);

        if (!$review) {
            echo json_encode(["status" => "error", "message" => "Review không tồn tại"]);
            exit;
        }

        if ($data->action === 'reply') {

            $sql = "UPDATE reviews SET reply = :reply WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':reply' => $data->reply,
                ':id'    => $data->id
            ]);

            // 📝 LOG REPLY
            write_audit_log(
                strtoupper($userInfo['role']) . " {$userInfo['name']} (id {$userInfo['id']}) đã phản hồi review id {$data->id}"
            );

        } elseif ($data->action === 'report') {

            $sql = "UPDATE reviews 
                    SET status = 'reported', report_reason = :reason 
                    WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':reason' => $data->reason,
                ':id'     => $data->id
            ]);

            // 📝 LOG REPORT
            write_audit_log(
                strtoupper($userInfo['role']) . " {$userInfo['name']} (id {$userInfo['id']}) đã báo cáo review id {$data->id}"
            );
        }

        echo json_encode([
            "status" => "success",
            "message" => "Cập nhật thành công"
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
