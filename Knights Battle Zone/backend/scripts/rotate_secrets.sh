#!/usr/bin/env bash
set -euo pipefail

generate_secret() {
  openssl rand -base64 72 | tr -d '\n' | tr '/+' '_-' | cut -c1-64
}

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required to generate secrets."
  exit 1
fi

echo "JWT_SECRET=$(generate_secret)"
echo "TRACKER_TOKEN_SECRET=$(generate_secret)"
echo "JUDGE_INTERNAL_TOKEN=$(generate_secret)"
