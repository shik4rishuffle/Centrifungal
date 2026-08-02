#!/usr/bin/env bash
# =============================================================================
# Smoke Tests - Centrifungal Launch Verification
# =============================================================================
#
# Runs all pre-launch checks against the production environment.
# Requires: curl, openssl, dig
#
# Usage:
#   bash smoke-tests.sh
#   bash smoke-tests.sh https://centrifungal.co.uk
#   BASE_URL=https://centrifungal.co.uk bash smoke-tests.sh
#
# Exit code: 0 if all checks pass, 1 if any fail.

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

BASE_URL="${1:-${BASE_URL:-https://centrifungal.co.uk}}"
API_URL="${API_URL:-https://api.centrifungal.co.uk}"
FRONTEND_HOST="centrifungal.co.uk"
API_HOST="api.centrifungal.co.uk"
TLS_WARN_DAYS=30

# Strip trailing slash
BASE_URL="${BASE_URL%/}"
API_URL="${API_URL%/}"

# -----------------------------------------------------------------------------
# Colour output
# -----------------------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

# -----------------------------------------------------------------------------
# Counters
# -----------------------------------------------------------------------------

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

pass() {
    local description="$1"
    echo -e "  ${GREEN}PASS${RESET}  ${description}"
    PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
    local description="$1"
    local detail="${2:-}"
    echo -e "  ${RED}FAIL${RESET}  ${description}"
    if [[ -n "$detail" ]]; then
        echo -e "        ${detail}"
    fi
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

warn() {
    local description="$1"
    local detail="${2:-}"
    echo -e "  ${YELLOW}WARN${RESET}  ${description}"
    if [[ -n "$detail" ]]; then
        echo -e "        ${detail}"
    fi
    WARN_COUNT=$((WARN_COUNT + 1))
}

section() {
    echo ""
    echo -e "${BOLD}$1${RESET}"
}

require_tool() {
    local tool="$1"
    if ! command -v "$tool" &>/dev/null; then
        echo -e "${RED}ERROR: Required tool '$tool' not found. Install it and re-run.${RESET}"
        exit 1
    fi
}

# Returns the HTTP status code for a URL.
http_status() {
    curl -sI -o /dev/null -w "%{http_code}" --max-time 15 "$1"
}

# Returns the HTTP status code following no redirects.
http_status_no_redirect() {
    curl -sI -o /dev/null -w "%{http_code}" --max-time 15 --max-redirs 0 "$1" 2>/dev/null || true
}

# Returns response headers for a URL.
http_headers() {
    curl -sI --max-time 15 "$1"
}

# Returns response body for a URL.
http_body() {
    curl -s --max-time 15 "$1"
}

# -----------------------------------------------------------------------------
# Pre-flight
# -----------------------------------------------------------------------------

require_tool curl
require_tool openssl
require_tool dig

echo ""
echo -e "${BOLD}Centrifungal Smoke Tests${RESET}"
echo "  Frontend: ${BASE_URL}"
echo "  API:      ${API_URL}"
echo "  Date:     $(date -u '+%Y-%m-%d %H:%M:%S UTC')"

# =============================================================================
# 1. Frontend Availability
# =============================================================================

section "1. Frontend Availability"

status=$(http_status "${BASE_URL}/")
if [[ "$status" == "200" ]]; then
    pass "GET ${BASE_URL}/ returns HTTP 200"
else
    fail "GET ${BASE_URL}/ returns HTTP 200" "Got HTTP ${status}"
fi

# =============================================================================
# 2. API Health Endpoint
# =============================================================================

section "2. API Health Endpoint"

api_status=$(http_status "${API_URL}/api/health")
if [[ "$api_status" == "200" ]]; then
    pass "GET ${API_URL}/api/health returns HTTP 200"
else
    fail "GET ${API_URL}/api/health returns HTTP 200" "Got HTTP ${api_status}"
fi

health_body=$(http_body "${API_URL}/api/health")
if echo "$health_body" | grep -q '"status"'; then
    health_status_value=$(echo "$health_body" | grep -o '"status":"[^"]*"' | head -1)
    if echo "$health_body" | grep -q '"status":"healthy"'; then
        pass "API health body contains status:healthy"
    else
        fail "API health body contains status:healthy" "Got: ${health_status_value}"
    fi
else
    fail "API health body is valid JSON with status field" "Body: ${health_body}"
fi

if echo "$health_body" | grep -q '"database":"connected"'; then
    pass "API health reports database connected"
else
    db_value=$(echo "$health_body" | grep -o '"database":"[^"]*"' | head -1)
    fail "API health reports database connected" "Got: ${db_value:-no database field}"
fi

# =============================================================================
# 3. HTTPS Enforcement
# =============================================================================

section "3. HTTPS Enforcement"

# Netlify handles the HTTP->HTTPS redirect. Check the plain-HTTP URL.
http_base="http://${FRONTEND_HOST}"
redirect_status=$(http_status_no_redirect "${http_base}/")
if [[ "$redirect_status" == "301" || "$redirect_status" == "308" ]]; then
    pass "HTTP ${http_base}/ redirects (${redirect_status}) to HTTPS"
else
    fail "HTTP ${http_base}/ redirects to HTTPS" "Got HTTP ${redirect_status} (expected 301 or 308)"
fi

# Verify the redirect Location header points to HTTPS.
redirect_location=$(curl -sI --max-time 15 --max-redirs 0 "${http_base}/" 2>/dev/null \
    | grep -i '^location:' | tr -d '\r' | awk '{print $2}' || true)
if echo "$redirect_location" | grep -qi '^https://'; then
    pass "HTTP->HTTPS redirect Location header points to HTTPS"
else
    fail "HTTP->HTTPS redirect Location header points to HTTPS" "Location: ${redirect_location:-not found}"
fi

# =============================================================================
# 4. Security Headers - Frontend
# =============================================================================

section "4. Security Headers (Frontend - ${BASE_URL}/)"

frontend_headers=$(http_headers "${BASE_URL}/")

check_header() {
    local label="$1"
    local pattern="$2"
    local headers="$3"
    if echo "$headers" | grep -qi "$pattern"; then
        pass "${label} present"
    else
        fail "${label} present" "Header not found or value unexpected"
    fi
}

check_header "Strict-Transport-Security" "strict-transport-security:" "$frontend_headers"
check_header "X-Frame-Options" "x-frame-options:" "$frontend_headers"
check_header "X-Content-Type-Options" "x-content-type-options:" "$frontend_headers"
check_header "Referrer-Policy" "referrer-policy:" "$frontend_headers"
check_header "Content-Security-Policy" "content-security-policy:" "$frontend_headers"

# =============================================================================
# 5. Security Headers - API
# =============================================================================

section "5. Security Headers (API - ${API_URL}/api/health)"

api_headers=$(http_headers "${API_URL}/api/health")

check_header "Strict-Transport-Security" "strict-transport-security:" "$api_headers"
check_header "X-Frame-Options" "x-frame-options:" "$api_headers"
check_header "X-Content-Type-Options" "x-content-type-options:" "$api_headers"
check_header "Referrer-Policy" "referrer-policy:" "$api_headers"

# =============================================================================
# 6. Statamic CP Access
# =============================================================================

section "6. Statamic CP Access"

cp_status=$(http_status "${API_URL}/cp")
if [[ "$cp_status" == "200" || "$cp_status" == "302" ]]; then
    pass "GET ${API_URL}/cp returns HTTP ${cp_status} (200 or 302 expected)"
else
    fail "GET ${API_URL}/cp accessible (200 or 302)" "Got HTTP ${cp_status}"
fi

# =============================================================================
# 7. DNS Resolution
# =============================================================================

section "7. DNS Resolution"

frontend_dns=$(dig +short "${FRONTEND_HOST}" 2>/dev/null | head -5)
if [[ -n "$frontend_dns" ]]; then
    pass "${FRONTEND_HOST} resolves in DNS"
    echo "        -> ${frontend_dns}"
else
    fail "${FRONTEND_HOST} resolves in DNS" "dig returned no records"
fi

www_dns=$(dig +short "www.${FRONTEND_HOST}" 2>/dev/null | head -5)
if [[ -n "$www_dns" ]]; then
    pass "www.${FRONTEND_HOST} resolves in DNS"
else
    fail "www.${FRONTEND_HOST} resolves in DNS" "dig returned no records"
fi

api_dns=$(dig +short "${API_HOST}" 2>/dev/null | head -5)
if [[ -n "$api_dns" ]]; then
    pass "${API_HOST} resolves in DNS"
    echo "        -> ${api_dns}"
else
    fail "${API_HOST} resolves in DNS" "dig returned no records"
fi

# =============================================================================
# 8. TLS Certificate Validity
# =============================================================================

section "8. TLS Certificate Validity"

check_tls() {
    local host="$1"
    local port="${2:-443}"

    local expiry
    expiry=$(echo | openssl s_client -servername "$host" -connect "${host}:${port}" 2>/dev/null \
        | openssl x509 -noout -enddate 2>/dev/null \
        | cut -d= -f2)

    if [[ -z "$expiry" ]]; then
        fail "${host} TLS certificate retrievable" "Could not connect or parse certificate"
        return
    fi

    local expiry_epoch
    expiry_epoch=$(date -j -f "%b %d %T %Y %Z" "$expiry" "+%s" 2>/dev/null \
        || date --date="$expiry" "+%s" 2>/dev/null \
        || echo "0")

    local now_epoch
    now_epoch=$(date +%s)

    local days_remaining
    days_remaining=$(( (expiry_epoch - now_epoch) / 86400 ))

    if [[ "$days_remaining" -le 0 ]]; then
        fail "${host} TLS certificate not expired" "Certificate expired ${days_remaining} days ago (${expiry})"
    elif [[ "$days_remaining" -le "$TLS_WARN_DAYS" ]]; then
        fail "${host} TLS certificate not expiring within ${TLS_WARN_DAYS} days" \
            "Expires in ${days_remaining} days (${expiry}) - renew now"
    else
        pass "${host} TLS certificate valid for ${days_remaining} more days (${expiry})"
    fi
}

check_tls "$FRONTEND_HOST"
check_tls "$API_HOST"

# =============================================================================
# 9. Stripe Checkout (Test Mode Mock)
# =============================================================================

section "9. Stripe Checkout Endpoint"

# POST /api/checkout - verifies the endpoint is reachable and responds with
# a structured JSON error (not a 500 or 404). A 422 (validation error) is
# acceptable and confirms the route is wired up. A 401 or structured 400
# also confirms the endpoint exists and the controller is responding.
# We deliberately do NOT send a real Stripe payload here.

checkout_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{}' \
    "${BASE_URL}/api/checkout")

if [[ "$checkout_status" == "422" || "$checkout_status" == "400" || "$checkout_status" == "401" ]]; then
    pass "POST ${BASE_URL}/api/checkout reachable (${checkout_status} - endpoint wired up)"
elif [[ "$checkout_status" == "200" || "$checkout_status" == "201" ]]; then
    pass "POST ${BASE_URL}/api/checkout returned ${checkout_status}"
elif [[ "$checkout_status" == "429" ]]; then
    warn "POST ${BASE_URL}/api/checkout rate-limited (429) - endpoint likely fine but throttled"
else
    fail "POST ${BASE_URL}/api/checkout reachable" "Got HTTP ${checkout_status} (expected 400/401/422)"
fi

# =============================================================================
# 10. Stripe API Key Environment Check
# =============================================================================

section "10. Stripe Configuration"

if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
    if echo "$STRIPE_SECRET_KEY" | grep -q '^sk_live_'; then
        pass "STRIPE_SECRET_KEY is set to a live key"
    elif echo "$STRIPE_SECRET_KEY" | grep -q '^sk_test_'; then
        fail "STRIPE_SECRET_KEY is still a test key" \
            "Switch to sk_live_* before launch. Current key starts: ${STRIPE_SECRET_KEY:0:12}..."
    else
        warn "STRIPE_SECRET_KEY format unrecognised" "Expected sk_live_* or sk_test_*"
    fi
else
    warn "STRIPE_SECRET_KEY not set in environment" \
        "Cannot verify Stripe mode. Set STRIPE_SECRET_KEY to check."
fi

# =============================================================================
# 11. Royal Mail (Click & Drop) API Credentials
# =============================================================================

section "11. Royal Mail Click and Drop API"

if [[ -z "${ROYAL_MAIL_API_KEY:-}" ]]; then
    warn "ROYAL_MAIL_API_KEY not set in environment" \
        "Cannot verify Royal Mail credentials. Set ROYAL_MAIL_API_KEY to check."
else
    rm_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 \
        -H "Authorization: Bearer ${ROYAL_MAIL_API_KEY}" \
        -H "Accept: application/json" \
        "https://api.parcel.royalmail.com/api/v1/serviceAvailability" 2>/dev/null || true)

    if [[ "$rm_status" == "200" ]]; then
        pass "Royal Mail Click and Drop API credentials valid (200)"
    elif [[ "$rm_status" == "401" || "$rm_status" == "403" ]]; then
        fail "Royal Mail Click and Drop API credentials valid" \
            "Authentication failed (HTTP ${rm_status}) - check ROYAL_MAIL_API_KEY"
    elif [[ "$rm_status" == "000" ]]; then
        warn "Royal Mail API unreachable" "Network error or DNS failure"
    else
        warn "Royal Mail API returned HTTP ${rm_status}" \
            "Non-200 response - verify the endpoint and credentials manually"
    fi
fi

# =============================================================================
# 12. Resend Email Configuration
# =============================================================================

section "12. Resend Email Configuration"

if [[ -n "${RESEND_API_KEY:-}" ]]; then
    resend_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 \
        -H "Authorization: Bearer ${RESEND_API_KEY}" \
        "https://api.resend.com/domains" 2>/dev/null || true)

    if [[ "$resend_status" == "200" ]]; then
        pass "Resend API key valid - domain listing accessible"
    elif [[ "$resend_status" == "401" ]]; then
        fail "Resend API key valid" "Authentication failed (401) - check RESEND_API_KEY"
    else
        warn "Resend API returned HTTP ${resend_status}" "Verify credentials manually"
    fi
else
    warn "RESEND_API_KEY not set in environment" \
        "Cannot verify Resend credentials. Set RESEND_API_KEY to check."
fi

# =============================================================================
# 13. Litestream / R2 Backup Check
# =============================================================================

section "13. Litestream and R2 Backup"

if [[ -z "${R2_ACCESS_KEY_ID:-}" || -z "${R2_SECRET_ACCESS_KEY:-}" || -z "${R2_BUCKET:-}" || -z "${R2_ACCOUNT_ID:-}" ]]; then
    warn "R2 credentials not fully set in environment" \
        "Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_ACCOUNT_ID to verify backups."
else
    r2_endpoint="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

    # Check for at least one object in the daily-backups/ prefix using S3-compatible list API.
    # We use a minimal AWS Signature v4 via curl - if rclone or aws CLI is available prefer those,
    # but we stay self-contained here and just hit the health endpoint indirectly by checking the
    # API confirms litestream is replicating (the health endpoint does not expose this, so we warn).
    warn "R2 credentials present but backup verification requires aws CLI or rclone" \
        "Manually run: aws s3 ls s3://${R2_BUCKET}/daily-backups/ --endpoint-url ${r2_endpoint}"
fi

# =============================================================================
# Summary
# =============================================================================

TOTAL=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))

echo ""
echo "============================================="
echo -e "${BOLD}Results: ${PASS_COUNT}/${TOTAL} passed${RESET}"
if [[ "$WARN_COUNT" -gt 0 ]]; then
    echo -e "  ${YELLOW}${WARN_COUNT} warning(s) - review before launch${RESET}"
fi
if [[ "$FAIL_COUNT" -gt 0 ]]; then
    echo -e "  ${RED}${FAIL_COUNT} check(s) FAILED - do not launch${RESET}"
fi
echo "============================================="
echo ""

if [[ "$FAIL_COUNT" -gt 0 ]]; then
    exit 1
fi

exit 0
