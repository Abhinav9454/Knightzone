#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
ENV_FILE="${PROJECT_ROOT}/.env"

echo "[preflight] Using project root: ${PROJECT_ROOT}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[preflight] ERROR: .env file missing at ${ENV_FILE}" >&2
  exit 1
fi

required_keys=(
  JWT_SECRET
  TRACKER_TOKEN_SECRET
  JUDGE_INTERNAL_TOKEN
  MYSQL_DATABASE
  MYSQL_USER
  MYSQL_PASSWORD
  MYSQL_ROOT_PASSWORD
  CORS_ALLOWED_ORIGINS
)

for key in "${required_keys[@]}"; do
  if ! grep -qE "^${key}=" "${ENV_FILE}"; then
    echo "[preflight] ERROR: missing ${key} in .env" >&2
    exit 1
  fi
  value="$(grep -E "^${key}=" "${ENV_FILE}" | tail -n1 | cut -d'=' -f2-)"
  if [[ -z "${value// }" ]]; then
    echo "[preflight] ERROR: empty value for ${key}" >&2
    exit 1
  fi
done

echo "[preflight] Validating docker compose syntax"
(cd "${PROJECT_ROOT}" && docker compose config -q)

echo "[preflight] Preflight checks passed for 50k phase baseline."
