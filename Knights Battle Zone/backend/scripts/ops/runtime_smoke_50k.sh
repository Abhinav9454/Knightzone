#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-180}"
SKIP_DOCKER_STATUS="${SKIP_DOCKER_STATUS:-false}"

log() {
  echo "[runtime-smoke] $*"
}

wait_for_health() {
  local url="$1"
  local timeout="$2"
  local deadline=$((SECONDS + timeout))
  while (( SECONDS < deadline )); do
    if curl -fsS --max-time 5 "$url" | grep -q '"status"[[:space:]]*:[[:space:]]*"UP"'; then
      return 0
    fi
    sleep 2
  done
  return 1
}

json_field() {
  local key="$1"
  python3 - "$key" <<'PY'
import json
import sys

key = sys.argv[1]
payload = json.load(sys.stdin)
value = payload.get(key, "")
if value is None:
    value = ""
print(value)
PY
}

api_base="${BASE_URL%/}"
health_url="${api_base}/api/health"

if [[ "$SKIP_DOCKER_STATUS" != "true" ]]; then
  log "Checking docker compose status"
  docker compose ps >/dev/null
fi

log "Waiting for backend health: $health_url"
if ! wait_for_health "$health_url" "$HEALTH_TIMEOUT_SECONDS"; then
  echo "[runtime-smoke] ERROR: backend health did not become UP in time." >&2
  exit 1
fi

now="$(date +%Y%m%d%H%M%S)"
email="smoke_${now}@unifiedcode.local"
password="SmokePass!${now}"

log "Registering smoke user: $email"
register_payload="$(cat <<JSON
{"name":"Smoke User ${now}","email":"${email}","password":"${password}","role":"STUDENT"}
JSON
)"
register_resp="$(curl -fsS --max-time 10 -H "Content-Type: application/json" -d "$register_payload" "${api_base}/api/auth/register")"
register_token="$(printf '%s' "$register_resp" | json_field token)"
if [[ -z "$register_token" ]]; then
  echo "[runtime-smoke] ERROR: registration token missing." >&2
  exit 1
fi

log "Logging in smoke user"
login_payload="$(cat <<JSON
{"email":"${email}","password":"${password}"}
JSON
)"
login_resp="$(curl -fsS --max-time 10 -H "Content-Type: application/json" -d "$login_payload" "${api_base}/api/auth/login")"
token="$(printf '%s' "$login_resp" | json_field token)"
if [[ -z "$token" ]]; then
  echo "[runtime-smoke] ERROR: login token missing." >&2
  exit 1
fi

log "Validating /api/auth/me"
me_resp="$(curl -fsS --max-time 10 -H "Authorization: Bearer ${token}" "${api_base}/api/auth/me")"
me_email="$(printf '%s' "$me_resp" | json_field email)"
if [[ "$me_email" != "$email" ]]; then
  echo "[runtime-smoke] ERROR: auth/me email mismatch. expected=${email} actual=${me_email}" >&2
  exit 1
fi

log "Validating dashboard summary"
dashboard_resp="$(curl -fsS --max-time 10 -H "Authorization: Bearer ${token}" "${api_base}/api/dashboard/summary")"
rating="$(printf '%s' "$dashboard_resp" | json_field currentRating)"
if [[ -z "$rating" ]]; then
  echo "[runtime-smoke] ERROR: dashboard currentRating missing." >&2
  exit 1
fi

log "Checking contest list API"
contests_resp="$(curl -fsS --max-time 10 -H "Authorization: Bearer ${token}" "${api_base}/api/contests?page=0&size=5")"
if ! printf '%s' "$contests_resp" | grep -q '"content"'; then
  echo "[runtime-smoke] ERROR: contests payload missing content." >&2
  exit 1
fi

log "Runtime smoke passed."
echo "[runtime-smoke] user=${email}"
