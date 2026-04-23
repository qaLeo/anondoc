#!/usr/bin/env bash
# smoke-test.sh — быстрая проверка api.anondoc.app перед переключением Production
# Использование: bash packages/backend/scripts/smoke-test.sh
# Зависимости: curl, jq (опционально — без него JSON не парсится, но PASS/FAIL всё равно работает)

set -euo pipefail

API="https://api.anondoc.app"
GOOD_ORIGIN="https://anondoc.app"
EVIL_ORIGIN="https://evil.example.com"

PASS=0
FAIL=0

green() { printf '\033[32m%s\033[0m\n' "$*"; }
red()   { printf '\033[31m%s\033[0m\n' "$*"; }

check() {
  local label="$1"
  local result="$2"   # "pass" or "fail"
  local detail="$3"
  if [[ "$result" == "pass" ]]; then
    green "  PASS  $label"
    PASS=$((PASS + 1))
  else
    red   "  FAIL  $label"
    red   "        $detail"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "=== AnonDoc API smoke-test ==="
echo "    Target: $API"
echo ""

# ── 1. Health check ─────────────────────────────────────────────────────────
echo "[ 1/4 ] GET /health"
HEALTH_BODY=$(curl -sf "$API/health" 2>&1) || HEALTH_BODY=""
HEALTH_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$API/health" 2>/dev/null || echo "000")

if [[ "$HEALTH_HTTP" == "200" ]]; then
  # Try to parse with jq; fall back to grep
  if command -v jq &>/dev/null; then
    H_STATUS=$(echo "$HEALTH_BODY" | jq -r '.status // "unknown"' 2>/dev/null)
    H_DB=$(echo "$HEALTH_BODY"     | jq -r '.db    // "unknown"' 2>/dev/null)
    H_REDIS=$(echo "$HEALTH_BODY"  | jq -r '.redis // "unknown"' 2>/dev/null)
  else
    H_STATUS=$(echo "$HEALTH_BODY" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    H_DB=$(echo "$HEALTH_BODY"     | grep -o '"db":"[^"]*"'     | cut -d'"' -f4 || echo "unknown")
    H_REDIS=$(echo "$HEALTH_BODY"  | grep -o '"redis":"[^"]*"'  | cut -d'"' -f4 || echo "unknown")
  fi

  if [[ "$H_STATUS" == "ok" && "$H_DB" == "connected" ]]; then
    check "GET /health → 200, status=ok, db=connected, redis=$H_REDIS" "pass" ""
  else
    check "GET /health → 200, но status=$H_STATUS db=$H_DB redis=$H_REDIS" "fail" \
      "Ожидалось status=ok db=connected. Body: $HEALTH_BODY"
  fi
else
  check "GET /health → HTTP $HEALTH_HTTP" "fail" \
    "Ожидалось 200. Сервер недоступен?"
fi

# ── 2. CORS preflight — хороший origin ──────────────────────────────────────
echo ""
echo "[ 2/4 ] OPTIONS /auth/login (origin: $GOOD_ORIGIN)"
CORS_HEADERS=$(curl -si -X OPTIONS "$API/auth/login" \
  -H "Origin: $GOOD_ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  2>/dev/null || echo "")
CORS_HTTP=$(echo "$CORS_HEADERS" | head -1 | grep -o '[0-9]\{3\}' | head -1 || echo "000")
CORS_ORIGIN_HEADER=$(echo "$CORS_HEADERS" | grep -i 'access-control-allow-origin' | tr -d '\r' || echo "")
CORS_CRED_HEADER=$(echo "$CORS_HEADERS"   | grep -i 'access-control-allow-credentials' | tr -d '\r' || echo "")

if [[ "$CORS_HTTP" =~ ^(200|204)$ ]] \
  && echo "$CORS_ORIGIN_HEADER" | grep -qi "$GOOD_ORIGIN" \
  && echo "$CORS_CRED_HEADER"   | grep -qi "true"; then
  check "CORS preflight → $CORS_HTTP, allow-origin: $GOOD_ORIGIN, credentials: true" "pass" ""
else
  check "CORS preflight — неверный ответ (HTTP $CORS_HTTP)" "fail" \
    "allow-origin: $(echo "$CORS_ORIGIN_HEADER" | head -1) | allow-credentials: $(echo "$CORS_CRED_HEADER" | head -1)"
fi

# ── 3. Login с неверными credentials — ожидаем 401 ─────────────────────────
echo ""
echo "[ 3/4 ] POST /auth/login (bad credentials → expect 401)"
LOGIN_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: $GOOD_ORIGIN" \
  -d '{"email":"smoke-test@example.com","password":"wrongpassword123"}' \
  2>/dev/null || echo "000")

if [[ "$LOGIN_HTTP" == "401" ]]; then
  check "POST /auth/login (bad creds) → 401" "pass" ""
elif [[ "$LOGIN_HTTP" == "429" ]]; then
  check "POST /auth/login → 429 Too Many Requests (rate limit сработал — это ОК)" "pass" ""
else
  check "POST /auth/login → HTTP $LOGIN_HTTP" "fail" \
    "Ожидалось 401. Если 404 — маршрут не зарегистрирован. Если 500 — ошибка сервера."
fi

# ── 4. CORS preflight — злой origin НЕ должен получить allow-origin ────────
echo ""
echo "[ 4/4 ] OPTIONS /auth/login (evil origin: $EVIL_ORIGIN)"
EVIL_HEADERS=$(curl -si -X OPTIONS "$API/auth/login" \
  -H "Origin: $EVIL_ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  2>/dev/null || echo "")
EVIL_ORIGIN_HEADER=$(echo "$EVIL_HEADERS" | grep -i 'access-control-allow-origin' | tr -d '\r' || echo "")

if echo "$EVIL_ORIGIN_HEADER" | grep -qi "$EVIL_ORIGIN"; then
  check "Evil origin CORS — access-control-allow-origin содержит evil.example.com" "fail" \
    "CORS слишком открытый! Заголовок: $EVIL_ORIGIN_HEADER"
else
  check "Evil origin CORS → allow-origin не содержит evil.example.com" "pass" ""
fi

# ── Итог ────────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────"
if [[ $FAIL -eq 0 ]]; then
  green "  ALL PASS ($PASS/4) — можно переключать Production"
else
  red   "  $FAIL FAIL / $PASS PASS — не переключай до исправления"
fi
echo "────────────────────────────────"
echo ""
