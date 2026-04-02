<?php
//message.php
include_once './config/database.php';
include_once './utils/jwt_helper.php';
require_once './helpers/audit_log.php';
require_once './helpers/rate_limit.php';
header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

if (empty($action)) {
    echo json_encode(["status" => "error", "message" => "Thiếu tham số action"]);
    exit;
}

try {
    $getAuthUser = function() {
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
    };

    $resolveSupportvendorId = function() use ($conn) {
        $stmt = $conn->prepare("SELECT id FROM users WHERE role = 'vendor' ORDER BY id ASC LIMIT 1");
        $stmt->execute();
        return (int)($stmt->fetchColumn() ?: 0);
    };

    $generateSupportFallbackReply = function($rawText) {
        $text = trim((string)$rawText);
        $normalized = mb_strtolower($text, 'UTF-8');

        if ($normalized === '') {
            return 'Ban co the mo ta ro hon de AgriMarket AI ho tro nhanh hon khong?';
        }

        if (strpos($normalized, 'don hang') !== false || strpos($normalized, 'giao') !== false || strpos($normalized, 'ship') !== false) {
            return 'Ban co the vao Tai khoan > Don hang de xem trang thai moi nhat. Neu don dang cham, hay gui ma don de minh kiem tra nhanh cho ban.';
        }

        if (strpos($normalized, 'voucher') !== false || strpos($normalized, 'ma giam') !== false || strpos($normalized, 'khuyen mai') !== false) {
            return 'Ban co the xem voucher tai trang /voucher. Khi thanh toan, nhap ma vao o Voucher de ap dung. Neu ma khong hop le, hay kiem tra ngay hieu luc va gia tri toi thieu.';
        }

        if (strpos($normalized, 'hoan tien') !== false || strpos($normalized, 'refund') !== false || strpos($normalized, 'doi tra') !== false) {
            return 'De hoan tien/doi tra, ban vao chi tiet don hang va gui yeu cau kem ly do va hinh anh (neu co). He thong se cap nhat tien trinh xu ly cho ban.';
        }

        if (strpos($normalized, 'thanh toan') !== false || strpos($normalized, 'vnpay') !== false || strpos($normalized, 'chuyen khoan') !== false) {
            return 'Neu thanh toan loi, ban thu tai lai trang checkout, kiem tra ket noi va phuong thuc thanh toan. Neu van loi, gui thoi gian + ma don de minh kiem tra log giao dich.';
        }

        if (strpos($normalized, 'tai khoan') !== false || strpos($normalized, 'dang nhap') !== false || strpos($normalized, 'mat khau') !== false) {
            return 'Ban co the dung tinh nang quen mat khau de khoi phuc tai khoan. Neu khong nhan duoc OTP, hay kiem tra email/spam va gui cho minh dia chi email ban dang dung.';
        }

        if (strpos($normalized, 'xin chao') !== false || strpos($normalized, 'hello') !== false || strpos($normalized, 'chao') !== false) {
            return 'Chao ban! Minh la AgriMarket AI. Ban can ho tro ve don hang, voucher, thanh toan hay hoan tien?';
        }

        return 'Cam on ban da nhan tin. Minh da ghi nhan yeu cau va co the ho tro ngay neu ban cho minh them chi tiet (ma don, ma voucher, thoi gian gap loi).';
    };

    $httpJsonPost = function($url, array $headers, array $payload, $timeoutSec = 20) {
        if (!function_exists('curl_init')) {
            return [false, '', 'curl_missing'];
        }

        $ch = curl_init($url);
        if ($ch === false) {
            return [false, '', 'curl_init_failed'];
        }

        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE));
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 8);
        curl_setopt($ch, CURLOPT_TIMEOUT, max(8, (int)$timeoutSec));

        $raw = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($raw === false || $err !== '') {
            return [false, '', $err !== '' ? $err : 'curl_exec_failed'];
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            return [false, (string)$raw, 'http_' . $httpCode];
        }

        return [true, (string)$raw, ''];
    };

    $generateOpenAiReply = function($userText) use ($httpJsonPost) {
        $apiKey = trim((string)(getenv('OPENAI_API_KEY') ?: ''));
        if ($apiKey === '') {
            return '';
        }

        $baseUrl = rtrim((string)(getenv('OPENAI_API_BASE') ?: 'https://api.openai.com/v1'), '/');
        $model = trim((string)(getenv('OPENAI_MODEL') ?: 'gpt-4o-mini'));
        $timeout = (int)(getenv('SUPPORT_AI_TIMEOUT') ?: 20);

        $payload = [
            'model' => $model,
            'temperature' => 0.4,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'Ban la tro ly AgriMarket. Tra loi ngan gon, lich su, huu ich, uu tien huong dan cu the cho nguoi dung thuong mai dien tu nong san.',
                ],
                [
                    'role' => 'user',
                    'content' => trim((string)$userText),
                ],
            ],
        ];

        list($ok, $raw,) = $httpJsonPost(
            $baseUrl . '/chat/completions',
            [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            $payload,
            $timeout
        );

        if (!$ok) {
            return '';
        }

        $decoded = json_decode($raw, true);
        $reply = trim((string)($decoded['choices'][0]['message']['content'] ?? ''));
        return $reply;
    };

    $generateGeminiReply = function($userText) use ($httpJsonPost) {
        $apiKey = trim((string)(getenv('GEMINI_API_KEY') ?: ''));
        if ($apiKey === '') {
            return '';
        }

        $model = trim((string)(getenv('GEMINI_MODEL') ?: 'gemini-1.5-flash'));
        $timeout = (int)(getenv('SUPPORT_AI_TIMEOUT') ?: 20);
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent?key=' . rawurlencode($apiKey);

        $payload = [
            'system_instruction' => [
                'parts' => [[
                    'text' => 'Ban la tro ly AgriMarket. Tra loi ngan gon, lich su, huu ich, uu tien huong dan cu the cho nguoi dung thuong mai dien tu nong san.',
                ]],
            ],
            'contents' => [[
                'role' => 'user',
                'parts' => [[
                    'text' => trim((string)$userText),
                ]],
            ]],
            'generationConfig' => [
                'temperature' => 0.4,
                'maxOutputTokens' => 512,
            ],
        ];

        list($ok, $raw,) = $httpJsonPost(
            $url,
            ['Content-Type: application/json'],
            $payload,
            $timeout
        );

        if (!$ok) {
            return '';
        }

        $decoded = json_decode($raw, true);
        $reply = trim((string)($decoded['candidates'][0]['content']['parts'][0]['text'] ?? ''));
        return $reply;
    };

    $generateSupportAssistantReply = function($userText) use ($generateSupportFallbackReply, $generateOpenAiReply, $generateGeminiReply) {
        $enabled = trim((string)(getenv('SUPPORT_AI_ENABLED') ?: '1'));
        if ($enabled === '0' || strtolower($enabled) === 'false') {
            return $generateSupportFallbackReply($userText);
        }

        $provider = strtolower(trim((string)(getenv('SUPPORT_AI_PROVIDER') ?: 'auto')));
        $reply = '';

        if ($provider === 'openai') {
            $reply = $generateOpenAiReply($userText);
        } elseif ($provider === 'gemini') {
            $reply = $generateGeminiReply($userText);
        } else {
            $reply = $generateOpenAiReply($userText);
            if ($reply === '') {
                $reply = $generateGeminiReply($userText);
            }
        }

        if ($reply === '') {
            $reply = $generateSupportFallbackReply($userText);
        }

        if (mb_strlen($reply) > 1500) {
            $reply = mb_substr($reply, 0, 1500);
        }

        return trim($reply);
    };

    $ensureUserNotificationsTable = function() use ($conn) {
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
    };

    $createUserNotification = function($userId, $title, $content, $type = 'SYSTEM', $metadata = null) use ($conn, $ensureUserNotificationsTable) {
        $uid = (int)$userId;
        if ($uid <= 0) return;

        $stmt = $conn->prepare("INSERT INTO user_notifications (user_id, title, content, type, metadata, is_read, created_at) VALUES (:uid, :title, :content, :type, :metadata, 0, NOW())");
        $stmt->execute([
            ':uid' => $uid,
            ':title' => trim((string)$title),
            ':content' => trim((string)$content),
            ':type' => trim((string)$type),
            ':metadata' => $metadata !== null ? json_encode($metadata, JSON_UNESCAPED_UNICODE) : null,
        ]);
    };

    $ensureUserNotificationsTable();

    switch ($action) {
        case 'submit_contact':
            $data = json_decode(file_get_contents('php://input'), true);
            $name = trim((string)($data['name'] ?? ''));
            $email = trim((string)($data['email'] ?? ''));
            $text = trim((string)($data['message'] ?? ''));

            try {
                $limitKey = ($_SERVER['REMOTE_ADDR'] ?? 'unknown_ip') . '|' . strtolower($email);
                enforce_rate_limit('submit_contact', 5, 600, $limitKey);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
                exit;
            }

            if ($name === '' || $email === '' || $text === '') {
                echo json_encode(["status" => "error", "message" => "Vui long nhap day du thong tin."]);
                exit;
            }

            if (mb_strlen($name) > 100 || mb_strlen($text) > 2000) {
                echo json_encode(["status" => "error", "message" => "Noi dung lien he qua dai."]);
                exit;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                echo json_encode(["status" => "error", "message" => "Email khong hop le."]);
                exit;
            }

            $vendorId = $resolveSupportvendorId();
            if ($vendorId <= 0) {
                echo json_encode(["status" => "error", "message" => "He thong chua co vendor ho tro."]);
                exit;
            }

            $authUser = $getAuthUser();
            $senderId = isset($authUser->id) ? (int)$authUser->id : 0;

            // Cho phep gui lien he bang email da dang ky neu chua dang nhap.
            if ($senderId <= 0) {
                $findUser = $conn->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
                $findUser->execute([':email' => $email]);
                $senderId = (int)($findUser->fetchColumn() ?: 0);
            }

            if ($senderId <= 0 || $senderId === $vendorId) {
                echo json_encode(["status" => "error", "message" => "Vui long dang nhap bang tai khoan khach hang de gui lien he."]);
                exit;
            }

            $display = "[CONTACT] {$name} <{$email}>: {$text}";

            $conn->beginTransaction();

            // Tai su dung thread support neu da ton tai.
            $findConv = $conn->prepare("SELECT id FROM conversations WHERE (user_one = ? AND user_two = ?) OR (user_one = ? AND user_two = ?) ORDER BY id DESC LIMIT 1");
            $findConv->execute([$senderId, $vendorId, $vendorId, $senderId]);
            $conversationId = (int)($findConv->fetchColumn() ?: 0);

            if ($conversationId <= 0) {
                $convStmt = $conn->prepare("INSERT INTO conversations (user_one, user_two, last_message, last_time) VALUES (?, ?, ?, NOW())");
                $convStmt->execute([$senderId, $vendorId, $display]);
                $conversationId = (int)$conn->lastInsertId();
            }

            $msgStmt = $conn->prepare("INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text, media_url, message_type, is_read) VALUES (?, ?, ?, ?, NULL, 'text', 0)");
            $msgStmt->execute([$conversationId, $senderId, $vendorId, $display]);

            $updateConv = $conn->prepare("UPDATE conversations SET last_message = ?, last_time = NOW() WHERE id = ?");
            $updateConv->execute([$display, $conversationId]);

            $createUserNotification(
                $senderId,
                'Da gui lien he ho tro',
                'Yeu cau lien he cua ban da duoc gui den vendor. Ma hoi thoai: #' . $conversationId,
                'SYSTEM',
                ['conversation_id' => $conversationId]
            );

            $conn->commit();

            write_audit_log("Contact form submitted by {$name} <{$email}>");
            echo json_encode(["status" => "success", "message" => "Da gui lien he thanh cong."]);
            break;

        case 'support_history':
            $authUser = $getAuthUser();
            if (!$authUser || empty($authUser->id)) {
                echo json_encode(["status" => "error", "message" => "Unauthorized"]);
                exit;
            }

            $userId = (int)$authUser->id;
            $vendorId = $resolveSupportvendorId();
            if ($vendorId <= 0) {
                echo json_encode(["status" => "success", "data" => []]);
                exit;
            }

            $convSql = "SELECT id FROM conversations
                        WHERE (user_one = :u AND user_two = :a) OR (user_one = :a AND user_two = :u)
                        ORDER BY id DESC LIMIT 1";
            $convStmt = $conn->prepare($convSql);
            $convStmt->execute([':u' => $userId, ':a' => $vendorId]);
            $convId = (int)($convStmt->fetchColumn() ?: 0);

            if ($convId <= 0) {
                echo json_encode(["status" => "success", "data" => []]);
                exit;
            }

            $sql = "SELECT id, sender_id, receiver_id, message_text, created_at
                    FROM messages WHERE conversation_id = :cid ORDER BY created_at ASC";
            $stmt = $conn->prepare($sql);
            $stmt->execute([':cid' => $convId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $data = array_map(function($row) use ($userId) {
                return [
                    'id' => (int)$row['id'],
                    'text' => (string)$row['message_text'],
                    'sender' => ((int)$row['sender_id'] === $userId) ? 'user' : 'bot',
                    'time' => date('H:i', strtotime($row['created_at'])),
                ];
            }, $rows);

            echo json_encode(["status" => "success", "data" => $data]);
            break;

        case 'support_send':
            $authUser = $getAuthUser();
            if (!$authUser || empty($authUser->id)) {
                echo json_encode(["status" => "error", "message" => "Unauthorized"]);
                exit;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $text = trim((string)($data['text'] ?? ''));

            try {
                enforce_rate_limit('support_send', 20, 60, 'user_' . (int)$authUser->id);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
                exit;
            }

            if ($text === '') {
                echo json_encode(["status" => "error", "message" => "Tin nhan khong duoc de trong."]);
                exit;
            }

            if (mb_strlen($text) > 1500) {
                echo json_encode(["status" => "error", "message" => "Tin nhan qua dai."]);
                exit;
            }

            $userId = (int)$authUser->id;
            $vendorId = $resolveSupportvendorId();
            if ($vendorId <= 0) {
                echo json_encode(["status" => "error", "message" => "He thong chua co vendor ho tro."]);
                exit;
            }

            $conn->beginTransaction();

            $convSql = "SELECT id FROM conversations
                        WHERE (user_one = :u AND user_two = :a) OR (user_one = :a AND user_two = :u)
                        ORDER BY id DESC LIMIT 1";
            $convStmt = $conn->prepare($convSql);
            $convStmt->execute([':u' => $userId, ':a' => $vendorId]);
            $convId = (int)($convStmt->fetchColumn() ?: 0);

            if ($convId <= 0) {
                $createConv = $conn->prepare("INSERT INTO conversations (user_one, user_two, last_message, last_time) VALUES (?, ?, '', NOW())");
                $createConv->execute([$userId, $vendorId]);
                $convId = (int)$conn->lastInsertId();
            }

            $insertMsg = $conn->prepare("INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text, media_url, message_type, is_read) VALUES (?, ?, ?, ?, NULL, 'text', 0)");
            $insertMsg->execute([$convId, $userId, $vendorId, $text]);

            // Auto AI response so users get immediate support without waiting for human vendor.
            $aiReply = $generateSupportAssistantReply($text);
            if ($aiReply !== '') {
                $insertAiMsg = $conn->prepare("INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text, media_url, message_type, is_read) VALUES (?, ?, ?, ?, NULL, 'text', 0)");
                $insertAiMsg->execute([$convId, $vendorId, $userId, $aiReply]);
            }

            $updateConv = $conn->prepare("UPDATE conversations SET last_message = ?, last_time = NOW() WHERE id = ?");
            $updateConv->execute([$aiReply !== '' ? $aiReply : $text, $convId]);

            $createUserNotification(
                $userId,
                'Tin nhan da duoc gui',
                'He thong da gui tin nhan ho tro cua ban thanh cong.',
                'SYSTEM',
                ['conversation_id' => $convId]
            );

            $conn->commit();

            echo json_encode(["status" => "success", "message" => "Da gui tin nhan."]);
            break;

        case 'get_conversations':
            $authUser = $getAuthUser();
            $user_id = (int)($_GET['user_id'] ?? 0);
            if (!$authUser || empty($authUser->id) || (int)$authUser->id !== $user_id) {
                echo json_encode(["status" => "error", "message" => "Unauthorized"]);
                exit;
            }

            $sql = "SELECT c.id, u.id as partner_id, u.name, u.avatar, c.last_message as lastMessage, c.last_time as time,
                    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.receiver_id = :uid AND m.is_read = 0) as unread
                    FROM conversations c
                    JOIN users u ON (u.id = c.user_one OR u.id = c.user_two) AND u.id != :uid
                    WHERE c.user_one = :uid OR c.user_two = :uid ORDER BY c.last_time DESC";
            $stmt = $conn->prepare($sql);
            $stmt->execute([':uid' => $user_id]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'get_messages':
            $authUser = $getAuthUser();
            $cid = (int)($_GET['conversation_id'] ?? 0);
            $uid = (int)($_GET['user_id'] ?? 0);

            if (!$authUser || empty($authUser->id) || (int)$authUser->id !== $uid) {
                echo json_encode(["status" => "error", "message" => "Unauthorized"]);
                exit;
            }
            
            // BẢO MẬT: Kiểm tra xem user có thực sự thuộc về cuộc hội thoại này không
            $check_sql = "SELECT id FROM conversations WHERE id = :cid AND (user_one = :uid OR user_two = :uid)";
            $check_stmt = $conn->prepare($check_sql);
            $check_stmt->execute([':cid' => $cid, ':uid' => $uid]);
            if ($check_stmt->rowCount() == 0) {
                echo json_encode([]); // Không có quyền, trả về mảng rỗng
                exit;
            }

            // Trả về type sender là 'me' hoặc 'partner' để React dễ xử lý CSS
            $sql = "SELECT id, sender_id, CASE WHEN sender_id = :uid THEN 'me' ELSE 'partner' END as sender,
                    message_text as text, message_type as type, media_url, created_at as time
                    FROM messages WHERE conversation_id = :cid ORDER BY created_at ASC";
            $stmt = $conn->prepare($sql);
            $stmt->execute([':cid' => $cid, ':uid' => $uid]);
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($messages as &$m) {
                $m['images'] = !empty($m['media_url']) ? json_decode($m['media_url'], true) : [];
                $m['time'] = date('H:i', strtotime($m['time']));
            }
            echo json_encode($messages);
            break;

        case 'send_message':
            $authUser = $getAuthUser();
            if (!$authUser || empty($authUser->id)) {
                echo json_encode(["status" => "error", "message" => "Unauthorized"]);
                exit;
            }

            $cid = $_POST['conversation_id'] ?? '';
            $sid = (int)($_POST['sender_id'] ?? 0);
            $rid = (int)($_POST['receiver_id'] ?? 0);
            $text = trim((string)($_POST['text'] ?? ''));

            if ($sid <= 0 || $rid <= 0 || $sid === $rid) {
                echo json_encode(["status" => "error", "message" => "Thong tin nguoi gui/nhan khong hop le."]);
                exit;
            }

            if ((int)$authUser->id !== $sid) {
                echo json_encode(["status" => "error", "message" => "Unauthorized sender."]);
                exit;
            }

            try {
                enforce_rate_limit('send_message', 30, 60, 'chat_user_' . $sid);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
                exit;
            }

            if ($text === '' && empty($_FILES['images'])) {
                echo json_encode(["status" => "error", "message" => "Tin nhan khong duoc de trong."]);
                exit;
            }

            if (mb_strlen($text) > 1500) {
                echo json_encode(["status" => "error", "message" => "Tin nhan qua dai."]);
                exit;
            }

            $uploaded_files = [];
            $final_type = 'text';

            if (isset($_FILES['images'])) {
                $upload_dir = "./uploads/";
                if (!file_exists($upload_dir)) mkdir($upload_dir, 0777, true);
                foreach ($_FILES['images']['tmp_name'] as $key => $tmp_name) {
                    if (empty($tmp_name)) continue;
                    $ext = strtolower(pathinfo($_FILES['images']['name'][$key], PATHINFO_EXTENSION));
                    $filename = time() . "_" . uniqid() . "." . $ext;
                    if (move_uploaded_file($tmp_name, $upload_dir . $filename)) {
                        $uploaded_files[] = "http://localhost/nongsan-api/uploads/" . $filename;
                        if (in_array($ext, ['mp4', 'webm', 'mov', 'avi'])) $final_type = 'video';
                        else if ($final_type !== 'video') $final_type = 'image';
                    }
                }
            }

            $conn->beginTransaction();

            // LOGIC MỚI: Nếu cid rỗng, kiểm tra xem 2 người này ĐÃ CÓ hội thoại chưa trước khi tạo mới
            if (empty($cid) || strpos($cid, 'new_') === 0) {
                $check_conv = $conn->prepare("SELECT id FROM conversations WHERE (user_one = ? AND user_two = ?) OR (user_one = ? AND user_two = ?)");
                $check_conv->execute([$sid, $rid, $rid, $sid]);
                
                if ($check_conv->rowCount() > 0) {
                    $cid = $check_conv->fetchColumn(); // Đã có hội thoại thì lấy lại ID
                } else {
                    $stmt = $conn->prepare("INSERT INTO conversations (user_one, user_two, last_message, last_time) VALUES (?, ?, '', NOW())");
                    $stmt->execute([$sid, $rid]);
                    $cid = $conn->lastInsertId();
                }
            }

            if (!empty($cid) && strpos((string)$cid, 'new_') !== 0) {
                $validateConv = $conn->prepare("SELECT id FROM conversations WHERE id = :cid AND ((user_one = :sid AND user_two = :rid) OR (user_one = :rid AND user_two = :sid))");
                $validateConv->execute([
                    ':cid' => (int)$cid,
                    ':sid' => $sid,
                    ':rid' => $rid,
                ]);
                if ($validateConv->rowCount() === 0) {
                    throw new Exception('Hoi thoai khong hop le.');
                }
            }

            $media_json = !empty($uploaded_files) ? json_encode($uploaded_files) : null;
            
            $stmt = $conn->prepare("INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text, media_url, message_type, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)");
            $stmt->execute([$cid, $sid, $rid, $text, $media_json, $final_type]);

            $last_msg = !empty($uploaded_files) ? ($final_type === 'video' ? "[Video]" : "[Hình ảnh]") : $text;
            $stmt = $conn->prepare("UPDATE conversations SET last_message = ?, last_time = NOW() WHERE id = ?");
            $stmt->execute([$last_msg, $cid]);
            
            $conn->commit();
            echo json_encode(["status" => "success", "conversation_id" => $cid]);
            break;
    }
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) $conn->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}