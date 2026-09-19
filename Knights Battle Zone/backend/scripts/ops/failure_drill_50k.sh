#!/usr/bin/env bash
set -euo pipefail

RABBIT_OUTAGE_SECONDS="${RABBIT_OUTAGE_SECONDS:-20}"
JUDGE_OUTAGE_SECONDS="${JUDGE_OUTAGE_SECONDS:-20}"
MYSQL_OUTAGE_SECONDS="${MYSQL_OUTAGE_SECONDS:-20}"
HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-120}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
RESULTS_DIR="${REPO_ROOT}/backend/scripts/loadtest/results"
mkdir -p "${RESULTS_DIR}"

wait_container_healthy() {
  local container="$1"
  local timeout="$2"
  local deadline=$((SECONDS + timeout))

  while (( SECONDS < deadline )); do
    local running
    running="$(docker inspect -f '{{.State.Running}}' "${container}" 2>/dev/null || true)"
    if [[ "${running}" != "true" ]]; then
      sleep 2
      continue
    fi

    local health
    health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${container}" 2>/dev/null || true)"
    if [[ "${health}" == "healthy" || "${health}" == "none" ]]; then
      return 0
    fi
    sleep 2
  done
  return 1
}

invoke_drill() {
  local container="$1"
  local outage="$2"
  local timeout="$3"

  local started ended recovered mttr
  started="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  local begin_secs=$SECONDS

  docker stop "${container}" >/dev/null
  sleep "${outage}"
  docker start "${container}" >/dev/null

  if wait_container_healthy "${container}" "${timeout}"; then
    recovered="true"
  else
    recovered="false"
  fi

  ended="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  mttr=$((SECONDS - begin_secs))

  printf '%s|%s|%s|%s|%s\n' "${container}" "${outage}" "${recovered}" "${mttr}" "${started};${ended}"
}

cd "${REPO_ROOT}"
docker compose ps >/dev/null

STAMP="$(date -u +"%Y%m%d-%H%M%S")"
JSON_PATH="${RESULTS_DIR}/failure-drill-50k-${STAMP}.json"
MD_PATH="${RESULTS_DIR}/failure-drill-50k-${STAMP}.md"

RAW_OUTPUT=()
RAW_OUTPUT+=("$(invoke_drill contest-rabbitmq "${RABBIT_OUTAGE_SECONDS}" "${HEALTH_TIMEOUT_SECONDS}")")
RAW_OUTPUT+=("$(invoke_drill contest-judge "${JUDGE_OUTAGE_SECONDS}" "${HEALTH_TIMEOUT_SECONDS}")")
RAW_OUTPUT+=("$(invoke_drill contest-mysql "${MYSQL_OUTAGE_SECONDS}" "${HEALTH_TIMEOUT_SECONDS}")")

ALL_RECOVERED="true"
{
  echo "# Failure Drill 50K Report"
  echo
  echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo
  echo "| Container | Outage (s) | Recovered | MTTR (s) |"
  echo "|---|---:|---|---:|"
  for row in "${RAW_OUTPUT[@]}"; do
    IFS='|' read -r container outage recovered mttr _ <<<"${row}"
    echo "| ${container} | ${outage} | ${recovered} | ${mttr} |"
    if [[ "${recovered}" != "true" ]]; then
      ALL_RECOVERED="false"
    fi
  done
  echo
  echo "Overall recovered: ${ALL_RECOVERED}"
} > "${MD_PATH}"

{
  echo "{"
  echo "  \"generatedAt\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
  echo "  \"allRecovered\": ${ALL_RECOVERED},"
  echo "  \"drills\": ["
  for i in "${!RAW_OUTPUT[@]}"; do
    row="${RAW_OUTPUT[$i]}"
    IFS='|' read -r container outage recovered mttr span <<<"${row}"
    started="${span%%;*}"
    ended="${span##*;}"
    comma=","
    if [[ "$i" -eq $((${#RAW_OUTPUT[@]} - 1)) ]]; then
      comma=""
    fi
    cat <<EOF
    {
      "container": "${container}",
      "outageSeconds": ${outage},
      "recovered": ${recovered},
      "mttrSeconds": ${mttr},
      "startedAt": "${started}",
      "endedAt": "${ended}"
    }${comma}
EOF
  done
  echo "  ]"
  echo "}"
} > "${JSON_PATH}"

echo "Failure drill report generated:"
echo "  ${JSON_PATH}"
echo "  ${MD_PATH}"

if [[ "${ALL_RECOVERED}" != "true" ]]; then
  echo "One or more drills failed recovery checks." >&2
  exit 1
fi
