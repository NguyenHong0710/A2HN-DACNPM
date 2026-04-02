<?php
// config/database.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$host = getenv("DB_HOST") ?: "localhost";
$db_name = getenv("DB_NAME") ?: "uxi";
$username = getenv("DB_USER") ?: "root";
$password = getenv("DB_PASSWORD") ?: "";

try {
    $conn = new PDO(
        "mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4",
        $username,
        $password
    );
    $conn->exec("set names utf8");
} catch(PDOException $exception) {
    echo json_encode(["error" => "Connection error: " . $exception->getMessage()]);
    exit();
}
?>