#!/usr/bin/env bash
# Bash script to check Docker-based full-stack application connections
# Usage: bash backend/scripts/check_connections.sh

set -euo pipefail

# Configuration
FRONTEND_CONTAINER=contest-frontend
BACKEND_CONTAINER=contest-backend
MYSQL_CONTAINER=contest-mysql
JUDGE_CONTAINER=contest-judge

FRONTEND_PORT=3000
BACKEND_PORT=8080
MYSQL_HOST_PORT=3307
MYSQL_USER="${CHECK_MYSQL_USER:-contestuser}"
MYSQL_PASS="${CHECK_MYSQL_PASS:-${MYSQL_PASSWORD:-}}"
MYSQL_DB="${CHECK_MYSQL_DB:-contestdb}"
JUDGE_TOKEN="${CHECK_JUDGE_TOKEN:-${JUDGE_INTERNAL_TOKEN:-}}"
AUTH_TOKEN=""

declare -A results

function pass() { echo "[PASS] $1 - $2"; results["$1"]=1; }
function fail() { echo "[FAIL] $1 - $2"; results["$1"]=0; }

function require_config() {
  local key="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    fail "Config:$key" "Missing required value. Export $key before running this script."
    return 1
  fi
  return 0
}

function check_container() {
  local name="$1"
  if docker inspect --format='{{.State.Status}}' "$name" >/dev/null 2>&1; then
    status=$(docker inspect --format='{{.State.Status}}' "$name" 2>/dev/null | tr -d '\r' )
    if [[ "$status" == "running" || "$status" == up* ]]; then
      pass "Container:$name" "Status=$status"
    else
      fail "Container:$name" "Status=$status"
    fi
  else
    fail "Container:$name" "Not found"
  fi
}

function check_db_host() {
  # Prefer local mysql client
  if command -v mysql >/dev/null 2>&1; then
    if mysql -h 127.0.0.1 -P $MYSQL_HOST_PORT -u$MYSQL_USER -p"$MYSQL_PASS" $MYSQL_DB -e 'SHOW TABLES;' >/dev/null 2>&1; then
      pass "DB:HostConnectivity" "Connected via local mysql client"
      return
    else
      fail "DB:HostConnectivity" "Local mysql client connection failed"
      return
    fi
  fi

  # Fallback: exec into mysql container
  if docker exec "$MYSQL_CONTAINER" mysql -u$MYSQL_USER -p"$MYSQL_PASS" -D $MYSQL_DB -e 'SHOW TABLES;' >/dev/null 2>&1; then
    pass "DB:HostConnectivity" "Connected via mysql client in container"
  else
    fail "DB:HostConnectivity" "Could not connect from host or container client"
  fi
}

function check_backend_db_from_container() {
  # Try backend's health endpoint from inside backend container
  if docker exec "$BACKEND_CONTAINER" sh -c "curl -s -f http://localhost:$BACKEND_PORT/api/actuator/health || curl -s -f http://localhost:$BACKEND_PORT/actuator/health" >/dev/null 2>&1; then
    pass "DB:BackendConnectivity" "Backend container health endpoint OK (likely DB reachable)"
  else
    fail "DB:BackendConnectivity" "Backend container cannot reach its health endpoint"
  fi
}

function check_backend_health() {
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BACKEND_PORT/api/actuator/health" | grep -q '^200$'; then
    pass "Backend:Health" "api/actuator/health returned 200"
    return
  fi
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BACKEND_PORT/actuator/health" | grep -q '^200$'; then
    pass "Backend:Health" "/actuator/health returned 200"
    return
  fi
  fail "Backend:Health" "No health endpoint returned 200"
}

function check_judge_health() {
  code=$(docker exec "$BACKEND_CONTAINER" sh -c "curl -s -o /dev/null -w '%{http_code}' http://judge:5000/health" 2>/dev/null | tr -d '\r')
  if [[ "$code" == "200" ]]; then
    pass "Judge:Health" "Judge /health returned 200 from backend container"
  else
    fail "Judge:Health" "Judge /health check failed from backend container (HTTP $code)"
  fi
}

function check_frontend() {
  html=$(curl -s "http://localhost:$FRONTEND_PORT/" || true)
  if [[ -n "$html" && ( "$html" == *"<title"* || ${#html} -gt 0 ) ]]; then
    pass "Frontend:Accessibility" "Frontend returned content"
  else
    fail "Frontend:Accessibility" "No content from frontend"
  fi
}

function check_cors() {
  headers=$(curl -s -i -X OPTIONS "http://localhost:$BACKEND_PORT/api/contests" -H "Origin: http://localhost:$FRONTEND_PORT" -H "Access-Control-Request-Method: GET" || true)
  if echo "$headers" | grep -qi "Access-Control-Allow-Origin"; then
    pass "Backend:CORS" "Access-Control-Allow-Origin header present"
  else
    fail "Backend:CORS" "No CORS header in OPTIONS response"
  fi
}

function check_auth_flow() {
  ts=$(date +%s)
  register_email="healthcheck_${ts}@example.com"
  register_pass="Health@${ts}Aa"
  register_payload=$(printf '{"name":"Health Check User","email":"%s","password":"%s","college":"Health College","department":"QA"}' "$register_email" "$register_pass")

  login=$(curl -s -X POST "http://localhost:$BACKEND_PORT/api/auth/register" -H "Content-Type: application/json" -d "$register_payload") || true
  token=""
  if command -v jq >/dev/null 2>&1; then
    token=$(echo "$login" | jq -r '.token // .accessToken // .data.token // empty') || true
  else
    token=$(echo "$login" | grep -o '"token"\s*:\s*"[^"]\+"' | head -n1 | sed -E 's/.*:\s*"([^"]+)"/\1/' || true)
  fi
  if [[ -n "$token" && "$token" != "null" ]]; then
    AUTH_TOKEN="$token"
    me_status=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $token" "http://localhost:$BACKEND_PORT/api/auth/me" || true)
    if [[ "$me_status" == "200" ]]; then
      pass "Auth:Login" "Register returned token and /auth/me is accessible"
    else
      fail "Auth:Login" "Token received but /auth/me returned HTTP $me_status"
    fi
  else
    fail "Auth:Login" "Registration failed or no token returned; response: $login"
  fi
}

function check_module_apis() {
  if [[ -z "$AUTH_TOKEN" ]]; then
    echo "[SKIP] API:Placement - Skipped: no auth token"
    results["API:Placement"]=2
    echo "[SKIP] API:Clubs - Skipped: no auth token"
    results["API:Clubs"]=2
    return
  fi

  function _check_api_with_token() {
    local name="$1"
    local url="$2"
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $AUTH_TOKEN" "$url" || echo "000")
    if [[ "$code" == "200" ]]; then
      pass "$name" "HTTP 200"
    else
      fail "$name" "Unexpected HTTP $code from $url"
    fi
  }

  _check_api_with_token "API:Placement" "http://localhost:$BACKEND_PORT/api/placement/jobs"
  _check_api_with_token "API:Clubs" "http://localhost:$BACKEND_PORT/api/clubs"
}

function check_judge_execute() {
  if [[ -z "$JUDGE_TOKEN" ]]; then
    echo "[SKIP] Judge:Execute - set CHECK_JUDGE_TOKEN (or JUDGE_INTERNAL_TOKEN) to test protected execute endpoint"
    results["Judge:Execute"]=2
    return
  fi

  payload='{"language":"python","code":"print(\"hello\")","input":""}'
  resp=$(docker exec "$BACKEND_CONTAINER" sh -c "curl -s -X POST http://judge:5000/execute -H 'Content-Type: application/json' -H 'X-Judge-Token: $JUDGE_TOKEN' -d '$payload'" 2>/dev/null || true)
  if [[ -n "$resp" && ( "$resp" == *"hello"* || "$resp" == *"stdout"* || "$resp" == *"output"* ) ]]; then
    pass "Judge:Execute" "Judge returned execution output through protected internal call"
  else
    fail "Judge:Execute" "Protected judge execute call failed or returned unexpected output. Response: $resp"
  fi
}

function check_container_networks() {
  # from frontend container try to reach backend by several service names
  names=("contest-backend" "backend")
  ok=0
  for n in "${names[@]}"; do
    code=$(docker exec "$FRONTEND_CONTAINER" sh -c "curl -s -o /dev/null -w '%{http_code}' http://$n:8080/api/actuator/health || curl -s -o /dev/null -w '%{http_code}' http://$n:8080/actuator/health" 2>/dev/null | tr -d '\r')
    if [[ "$code" == "200" ]]; then
      ok=1
      break
    fi
  done
  if [[ $ok -eq 1 ]]; then pass "Network:frontend->backend" "frontend container can reach backend by internal name"; else fail "Network:frontend->backend" "frontend container cannot reach backend by internal names (${names[*]})"; fi

  # from backend container try judge
  names2=("contest-judge" "judge")
  ok2=0
  for n in "${names2[@]}"; do
    code2=$(docker exec "$BACKEND_CONTAINER" sh -c "curl -s -o /dev/null -w '%{http_code}' http://$n:5000/health" 2>/dev/null | tr -d '\r')
    if [[ "$code2" == "200" ]]; then
      ok2=1
      break
    fi
  done
  if [[ $ok2 -eq 1 ]]; then pass "Network:backend->judge" "backend container can reach judge by internal name"; else fail "Network:backend->judge" "backend container cannot reach judge by internal names (${names2[*]})"; fi
}

# Run checks
if ! require_config "CHECK_MYSQL_PASS or MYSQL_PASSWORD" "$MYSQL_PASS"; then
  echo "Aborting due to missing required configuration."
  exit 2
fi

check_container "$FRONTEND_CONTAINER"
check_container "$BACKEND_CONTAINER"
check_container "$MYSQL_CONTAINER"
check_container "$JUDGE_CONTAINER"

check_db_host
check_backend_db_from_container
check_backend_health
check_judge_health
check_frontend
check_cors
check_auth_flow
check_module_apis
check_judge_execute
check_container_networks

# Summary
passed=0; failed=0; skipped=0
for k in "${!results[@]}"; do
  v=${results[$k]}
  if [[ $v -eq 1 ]]; then ((passed++)); elif [[ $v -eq 0 ]]; then ((failed++)); else ((skipped++)); fi
done

echo "\nSummary: $passed passed, $failed failed, $skipped skipped." 
if [[ $failed -gt 0 ]]; then
  echo "Troubleshooting hints:"
  echo " - If containers aren't running: run 'docker ps' and 'docker logs <name>' to inspect logs."
  echo " - For DB issues: verify credentials, check 'docker logs $MYSQL_CONTAINER' and ensure port $MYSQL_HOST_PORT mapped correctly."
  echo " - For CORS: ensure backend allows Origin 'http://localhost:3000' and responds to OPTIONS preflight."
  echo " - For auth: confirm admin user exists and backend auth endpoint path matches '/api/auth/login'. Adjust script if different."
  exit 1
else
  echo "All checks passed or skipped optional tests."; exit 0
fi
