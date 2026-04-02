<?php
// Cho phép CORS để React có thể gọi API từ port khác
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once './utils/jwt_helper.php';

// Xử lý preflight request của CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. KẾT NỐI DATABASE (Sử dụng PDO)
$host = "localhost";
$dbname = "uxi";                // Thay bằng tên database của bạn
$username = "root";             // Thay bằng username của bạn
$password = "";                 // Thay bằng password của bạn

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Lỗi kết nối CSDL: " . $e->getMessage()]);
    exit();
}

/**
 * HÀM TRA CỨU ID DỰA TRÊN TÊN (Dùng khi Front-end không gửi ID)
 */
function getUserIdByName($conn, $vendorName) {
    if (empty($vendorName)) return null;

    // Bảng users của bạn có cột 'name', không có 'username'
    $stmt = $conn->prepare("SELECT id FROM users WHERE name = :name LIMIT 1");
    $stmt->bindParam(':name', $vendorName);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    return $user ? (int)$user['id'] : null;
}

function getAuthUser() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = '';

    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        $authHeader = $headers['authorization'];
    } elseif (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    $token = trim(preg_replace('/^Bearer\s+/i', '', (string)$authHeader));
    if ($token === '') return null;

    return JWT_Helper::validate($token);
}

function ensureNotificationReadTable($conn) {
    $sql = "CREATE TABLE IF NOT EXISTS user_notification_reads (
                user_id INT NOT NULL,
                notification_id INT NOT NULL,
                read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, notification_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $conn->exec($sql);
}

function ensureUserNotificationsTable($conn) {
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
    $conn->exec($sql);
}

function parseNotificationIdentity($rawId, $sourceHint = '') {
    $source = trim(strtolower((string)$sourceHint));
    $sourceId = 0;

    if (is_string($rawId) && strpos($rawId, ':') !== false) {
        [$prefix, $idPart] = explode(':', $rawId, 2);
        $source = trim(strtolower((string)$prefix));
        $sourceId = (int)$idPart;
    } else {
        $sourceId = (int)$rawId;
    }

    if (!in_array($source, ['system', 'user'], true)) {
        $source = 'system';
    }

    return [$source, $sourceId];
}

// 2. ĐỊNH TUYẾN CHỨC NĂNG (ROUTING)
$action = isset($_GET['action']) ? $_GET['action'] : 'list';

try {
    ensureNotificationReadTable($conn);
    ensureUserNotificationsTable($conn);

    switch ($action) {
        case 'list_user':
            $authUser = getAuthUser();
            $userId = isset($authUser->id) ? (int)$authUser->id : 0;

            if ($userId > 0) {
              $sql = "SELECT * FROM (
                    SELECT CONCAT('system:', n.id) AS notify_key,
                        n.id AS source_id,
                        'system' AS source,
                        n.title,
                        n.content,
                        n.type,
                        n.target_group,
                        n.created_at,
                        CASE WHEN r.user_id IS NULL THEN 1 ELSE 0 END AS unread
                    FROM vendor_notifications n
                    LEFT JOIN user_notification_reads r
                        ON r.notification_id = n.id AND r.user_id = :uid
                    WHERE n.status = 'ACTIVE'
                      AND n.target_group IN ('ALL', 'USER')
                      AND (n.end_time IS NULL OR n.end_time >= NOW())

                    UNION ALL

                    SELECT CONCAT('user:', un.id) AS notify_key,
                        un.id AS source_id,
                        'user' AS source,
                        un.title,
                        un.content,
                        un.type,
                        'USER' AS target_group,
                        un.created_at,
                        CASE WHEN un.is_read = 1 THEN 0 ELSE 1 END AS unread
                    FROM user_notifications un
                    WHERE un.user_id = :uid
                   ) t
                   ORDER BY t.created_at DESC";
                $stmt = $conn->prepare($sql);
                $stmt->execute([':uid' => $userId]);
            } else {
              $sql = "SELECT CONCAT('system:', n.id) AS notify_key,
                       n.id AS source_id,
                       'system' AS source,
                       n.title,
                       n.content,
                       n.type,
                       n.target_group,
                       n.created_at,
                               1 AS unread
                        FROM vendor_notifications n
                        WHERE n.status = 'ACTIVE'
                          AND n.target_group IN ('ALL', 'USER')
                          AND (n.end_time IS NULL OR n.end_time >= NOW())
                        ORDER BY n.created_at DESC";
                $stmt = $conn->prepare($sql);
                $stmt->execute();
            }

            echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'mark_read_user':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new Exception("Yeu cau phuong thuc POST.");
            $authUser = getAuthUser();
            if (!$authUser || empty($authUser->id)) {
                throw new Exception("Unauthorized");
            }

            $data = json_decode(file_get_contents("php://input"), true);
            [$source, $notificationId] = parseNotificationIdentity($data['id'] ?? '', $data['source'] ?? '');
            if ($notificationId <= 0) {
                throw new Exception("Thieu ID thong bao.");
            }

            if ($source === 'user') {
                $update = $conn->prepare("UPDATE user_notifications SET is_read = 1 WHERE id = :id AND user_id = :uid");
                $update->execute([
                    ':id' => $notificationId,
                    ':uid' => (int)$authUser->id,
                ]);
            } else {
                $insert = $conn->prepare("INSERT IGNORE INTO user_notification_reads (user_id, notification_id, read_at) VALUES (:uid, :nid, NOW())");
                $insert->execute([
                    ':uid' => (int)$authUser->id,
                    ':nid' => $notificationId,
                ]);
            }

            echo json_encode(["status" => "success", "message" => "Da danh dau da doc."]);
            break;

        case 'mark_all_read_user':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new Exception("Yeu cau phuong thuc POST.");
            $authUser = getAuthUser();
            if (!$authUser || empty($authUser->id)) {
                throw new Exception("Unauthorized");
            }

            $uid = (int)$authUser->id;
            $insertAll = "INSERT IGNORE INTO user_notification_reads (user_id, notification_id, read_at)
                          SELECT :uid, n.id, NOW()
                          FROM vendor_notifications n
                          WHERE n.status = 'ACTIVE'
                            AND n.target_group IN ('ALL', 'USER')
                            AND (n.end_time IS NULL OR n.end_time >= NOW())";
            $stmt = $conn->prepare($insertAll);
            $stmt->execute([':uid' => $uid]);

            $markUserNoti = $conn->prepare("UPDATE user_notifications SET is_read = 1 WHERE user_id = :uid AND is_read = 0");
            $markUserNoti->execute([':uid' => $uid]);

            echo json_encode(["status" => "success", "message" => "Da danh dau tat ca da doc."]);
            break;

        case 'list':
            $sql = "SELECT * FROM vendor_notifications ORDER BY created_at DESC";
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'create':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new Exception("Yêu cầu phương thức POST.");
            
            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->title) || empty($data->content)) {
                throw new Exception("Tiêu đề và nội dung không được để trống.");
            }

            // --- XỬ LÝ LẤY ID vendor ---
            $vendor_id = null;
            // 1. Ưu tiên lấy vendorId trực tiếp (nếu React gửi payload.vendorId)
            if (isset($data->vendorId) && !empty($data->vendorId)) {
                $vendor_id = (int)$data->vendorId;
            } 
            // 2. Nếu không có vendorId, tra cứu bằng vendorName (React gửi payload.vendorName)
            else if (isset($data->vendorName) && !empty($data->vendorName)) {
                $vendor_id = getUserIdByName($conn, $data->vendorName);
            }

            $target_group = $data->targetGroup ?? 'ALL';
            $type = $data->notiType ?? 'GENERAL';
            $status = 'ACTIVE';
            $end_time = !empty($data->endTime) ? $data->endTime : null;
            
            // Câu lệnh SQL khớp với bảng 11 cột của bạn
            $sql = "INSERT INTO vendor_notifications (title, content, target_group, type, status, end_time, vendor_id) 
                    VALUES (:title, :content, :target_group, :type, :status, :end_time, :vendor_id)";
                    
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':title', $data->title);
            $stmt->bindParam(':content', $data->content);
            $stmt->bindParam(':target_group', $target_group);
            $stmt->bindParam(':type', $type);
            $stmt->bindParam(':status', $status);
            $stmt->bindParam(':end_time', $end_time);
            $stmt->bindParam(':vendor_id', $vendor_id); 
            
            $stmt->execute();
            
            echo json_encode([
                "status" => "success", 
                "message" => "Đã phát thông báo thành công!",
                "debug_received_id" => $vendor_id
            ]);
            break;

        case 'cancel':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new Exception("Yêu cầu phương thức POST.");
            $data = json_decode(file_get_contents("php://input"));
            
            if (empty($data->id)) throw new Exception("Thiếu ID thông báo.");
            
            $cancel_reason = !empty($data->cancelReason) ? $data->cancelReason : "Hủy bởi vendor";
            
            $sql = "UPDATE vendor_notifications 
                    SET status = 'CANCELLED', 
                        cancel_reason = :cancel_reason, 
                        cancelled_at = NOW() 
                    WHERE id = :id";
                    
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':cancel_reason', $cancel_reason);
            $stmt->bindParam(':id', $data->id);
            $stmt->execute();
            
            echo json_encode(["status" => "success", "message" => "Đã hủy thành công!"]);
            break;

        case 'delete':
            $data = json_decode(file_get_contents("php://input"));
            $id = $data->id ?? ($_GET['id'] ?? null);
            if (!$id) throw new Exception("Thiếu ID.");
            
            $stmt = $conn->prepare("DELETE FROM vendor_notifications WHERE id = :id");
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            echo json_encode(["status" => "success", "message" => "Đã xóa vĩnh viễn!"]);
            break;

        default:
            throw new Exception("Hành động không hợp lệ.");
    }
} catch(Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>