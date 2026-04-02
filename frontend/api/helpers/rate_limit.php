<?php

function get_rate_limit_identifier($explicitIdentifier = null) {
    if (!empty($explicitIdentifier)) {
        return (string)$explicitIdentifier;
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown_ip';
    return (string)$ip;
}

function enforce_rate_limit($action, $limit, $windowSeconds, $explicitIdentifier = null) {
    $identifier = get_rate_limit_identifier($explicitIdentifier);
    $safeAction = preg_replace('/[^a-zA-Z0-9_\-]/', '_', (string)$action);
    $hash = hash('sha256', $safeAction . '|' . $identifier);

    $dir = __DIR__ . '/../logs/ratelimit';
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }

    $filePath = $dir . '/' . $hash . '.json';
    $now = time();

    $fh = fopen($filePath, 'c+');
    if ($fh === false) {
        return;
    }

    try {
        if (!flock($fh, LOCK_EX)) {
            return;
        }

        $raw = stream_get_contents($fh);
        $state = json_decode($raw ?: '', true);
        if (!is_array($state)) {
            $state = [
                'window_start' => $now,
                'count' => 0,
            ];
        }

        $windowStart = (int)($state['window_start'] ?? $now);
        $count = (int)($state['count'] ?? 0);

        if (($now - $windowStart) >= (int)$windowSeconds) {
            $windowStart = $now;
            $count = 0;
        }

        if ($count >= (int)$limit) {
            $retryAfter = max(1, (int)$windowSeconds - ($now - $windowStart));
            throw new Exception('Too many requests. Please try again in ' . $retryAfter . ' seconds.');
        }

        $count++;
        $nextState = [
            'window_start' => $windowStart,
            'count' => $count,
            'updated_at' => $now,
        ];

        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, json_encode($nextState));
    } finally {
        flock($fh, LOCK_UN);
        fclose($fh);
    }
}
