#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${1:-${SCRIPT_DIR}/../loadtest/results}"
REPORT_PATH="${2:-${RESULTS_DIR}/go-live-gate-report.json}"
GATE_SCRIPT="${SCRIPT_DIR}/go_live_gate_50k.js"

if [[ ! -f "${GATE_SCRIPT}" ]]; then
  echo "Missing gate script: ${GATE_SCRIPT}" >&2
  exit 1
fi

echo "[go-live-gate] running with results dir ${RESULTS_DIR}"
node "${GATE_SCRIPT}" --results-dir "${RESULTS_DIR}" --out "${REPORT_PATH}"
