<?php
/**
 * includes/env_loader.php
 *
 * Small, robust .env loader (no composer required).
 * - Loads .env from project root by default (one level up from includes/)
 * - Safe: does not overwrite env vars already set unless $force = true
 * - Supports comments, blank lines, export KEY=VAL, quoted values, and basic escapes
 * - Populates getenv(), $_ENV and $_SERVER
 *
 * Usage: require_once __DIR__ . '/env_loader.php';
 * (call this BEFORE code that depends on getenv() or config files)
 */

declare(strict_types=1);

function loadEnv(string $path = null, bool $force = false): bool
{
    // Default: project root .env (assumes includes/ is inside project root)
    if ($path === null) {
        $path = __DIR__ . '/../.env';
    }

    if (!is_readable($path)) {
        return false;
    }

    $contents = file_get_contents($path);
    if ($contents === false) return false;

    // strip BOM if present
    $contents = preg_replace('/^\xEF\xBB\xBF/', '', $contents);

    $lines = preg_split("/\r\n|\n|\r/", $contents);

    foreach ($lines as $rawLine) {
        $line = trim($rawLine);
        if ($line === '' || $line[0] === '#') continue;           // skip blank & comments
        if (stripos($line, 'export ') === 0) $line = substr($line, 7); // allow "export KEY=VAL"

        // must contain "=" to be valid
        if (strpos($line, '=') === false) continue;

        // key = everything left of first '=' ; value = rest (supports '=' in value)
        [$key, $value] = array_map('trim', explode('=', $line, 2));
        if ($key === '') continue;

        // remove surrounding quotes if present (single or double)
        if (preg_match('/^([\'"])(.*)\1$/s', $value, $m)) {
            $value = $m[2];
            // unescape common sequences for double-quoted strings
            if ($m[1] === '"') {
                $value = str_replace(['\\n','\\r','\\t','\\"','\\\\'], ["\n","\r","\t",'"',"\\\\"], $value);
            }
        }

        // avoid overwriting an already-set environment variable unless forced
        $already = getenv($key);
        if ($already !== false && $already !== null && $force === false) {
            // populate $_ENV/$_SERVER for consistency but do not change the existing value
            if (!isset($_ENV[$key])) $_ENV[$key] = $already;
            if (!isset($_SERVER[$key])) $_SERVER[$key] = $already;
            continue;
        }

        // set in getenv(), $_ENV, $_SERVER
        putenv("$key=$value");
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }

    return true;
}

// Automatically load .env when file is included
// If you need to force overwriting existing env vars, call loadEnv(null, true) manually
loadEnv();
