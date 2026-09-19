#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
EMAIL="${2:-}"
PASSWORD="${3:-}"
PROBLEM_ID="${4:-9}"
TOKEN="${LOADTEST_TOKEN:-}"
RESULTS_DIR="${RESULTS_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/results}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="${SCRIPT_DIR}/run-k6.sh"

if [[ ! -f "${RUNNER}" ]]; then
  echo "[phase7] Missing runner script: ${RUNNER}" >&2
  exit 1
fi

mkdir -p "${RESULTS_DIR}"

scenarios=(
  "platform_baseline.js"
  "judge_spike.js"
  "combined_mixed.js"
  "long_soak.js"
)

for scenario in "${scenarios[@]}"; do
  echo "[phase7] Running scenario: ${scenario}"
  if [[ -n "${TOKEN}" ]]; then
    LOADTEST_TOKEN="${TOKEN}" "${RUNNER}" "${scenario}" "${BASE_URL}" "skip" "skip" "${PROBLEM_ID}"
  else
    if [[ -z "${EMAIL}" || -z "${PASSWORD}" ]]; then
      echo "Provide LOADTEST_TOKEN or EMAIL and PASSWORD args." >&2
      exit 1
    fi
    "${RUNNER}" "${scenario}" "${BASE_URL}" "${EMAIL}" "${PASSWORD}" "${PROBLEM_ID}"
  fi
done

if [[ -f "${SCRIPT_DIR}/aggregate_k6_results.js" ]]; then
  echo "[phase7] Aggregating k6 summaries"
  node "${SCRIPT_DIR}/aggregate_k6_results.js" --results-dir "${RESULTS_DIR}"
fi

echo "[phase7] Completed all scenarios."
