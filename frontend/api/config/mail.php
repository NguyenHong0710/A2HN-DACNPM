<?php

function get_mail_config() {
    return [
        // Prefer environment variables if available.
        'host' => getenv('MAIL_HOST') ?: 'smtp.gmail.com',
        'port' => (int)(getenv('MAIL_PORT') ?: 587),
        'username' => getenv('MAIL_USERNAME') ?: 'tu0147258369@gmail.com',
        'password' => getenv('MAIL_PASSWORD') ?: 'tmmu yrcb fesb mtvq',
        'from_email' => getenv('MAIL_FROM_EMAIL') ?: 'no-reply@nongsan.com',
        'from_name' => getenv('MAIL_FROM_NAME') ?: 'He Thong Nong San',
        'encryption' => getenv('MAIL_ENCRYPTION') ?: 'tls',
    ];
}
