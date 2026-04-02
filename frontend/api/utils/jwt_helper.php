<?php
class JWT_Helper {
    private static $secret_key = "nhincaigimanhin"; 

    public static function create($data) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($data);
        
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret_key, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function validate($jwt) {
        $tokenParts = explode('.', $jwt);
        if (count($tokenParts) != 3) return null;
        
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
        $signature_provided = $tokenParts[2];

        // Tái tạo chữ ký để kiểm tra
        $base64UrlHeader = $tokenParts[0];
        $base64UrlPayload = $tokenParts[1];
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret_key, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        if ($base64UrlSignature === $signature_provided) {
            // Trả về Object để chuẩn hóa cách truy cập bằng dấu ->
            return json_decode($payload); 
        }
        return null;
    }
}
?>