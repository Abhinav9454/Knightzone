#!/usr/bin/env bash
set -euo pipefail

SCENARIO="${1:-platform_baseline.js}"
BASE_URL="${2:-http://localhost:8080}"
EMAIL="${3:-}"
PASSWORD="${4:-}"
PROBLEM_ID="${5:-9}"
TOKEN="${LOADTEST_TOKEN:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K6_ROOT="${SCRIPT_DIR}/k6"
RESULTS_ROOT="${SCRIPT_DIR}/results"
mkdir -p "${RESULTS_ROOT}"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
SUMMARY_FILE="${RESULTS_ROOT}/${SCENARIO%.js}-${TIMESTAMP}-summary.json"

ENV_ARGS=(
  -e "BASE_URL=${BASE_URL}"
  -e "LOADTEST_PROBLEM_ID=${PROBLEM_ID}"
  -e "K6_SUMMARY_EXPORT=/results/summary.json"
)

if [[ -n "${TOKEN}" ]]; then
  ENV_ARGS+=( -e "LOADTEST_TOKEN=${TOKEN}" )
else
  if [[ -z "${EMAIL}" || -z "${PASSWORD}" ]]; then
    echo "Provide LOADTEST_TOKEN env or pass EMAIL and PASSWORD args." >&2
    exit 1
  fi
  ENV_ARGS+=( -e "LOADTEST_EMAIL=${EMAIL}" -e "LOADTEST_PASSWORD=${PASSWORD}" )
fi

echo "Running k6 scenario '${SCENARIO}' against ${BASE_URL}"

docker run --rm -i \
  "${ENV_ARGS[@]}" \
  -v "${K6_ROOT}:/scripts" \
  -v "${RESULTS_ROOT}:/results" \
  grafana/k6 run "/scripts/${SCENARIO}"

if [[ -f "${RESULTS_ROOT}/summary.json" ]]; then
  mv "${RESULTS_ROOT}/summary.json" "${SUMMARY_FILE}"
  echo "Saved summary: ${SUMMARY_FILE}"
fi
