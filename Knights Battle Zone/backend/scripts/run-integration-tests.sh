#!/usr/bin/env bash
set -euo pipefail

SUITE="${1:-all}"
SKIP_DOCKER_CHECK="${SKIP_DOCKER_CHECK:-false}"
SKIP_RESOURCES="${SKIP_RESOURCES:-false}"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: ./backend/scripts/run-integration-tests.sh [all|smoke|core|clubs|marketplace|placement|stream|security]"
  echo "Env flags: SKIP_DOCKER_CHECK=true SKIP_RESOURCES=true"
  exit 0
fi

case "$SUITE" in
  all|smoke|core|clubs|marketplace|placement|stream|security) ;;
  *)
    echo "Invalid suite: $SUITE"
    echo "Usage: ./backend/scripts/run-integration-tests.sh [all|smoke|core|clubs|marketplace|placement|stream|security]"
    exit 1
    ;;
esac

set_testcontainers_env() {
  case "${OSTYPE:-unknown}" in
    msys*|cygwin*|win32*)
      local active_context=""
      local context_host=""
      active_context="$(docker context show 2>/dev/null || true)"
      if [[ -n "$active_context" ]]; then
        context_host="$(docker context inspect "$active_context" --format '{{(index .Endpoints "docker").Host}}' 2>/dev/null || true)"
      fi

      # Prefer active context endpoint (Docker Desktop Linux engine pipe).
      if [[ -n "$context_host" && "$context_host" != *docker_cli* ]]; then
        export DOCKER_HOST="$context_host"
      elif [[ -z "${DOCKER_HOST:-}" || "${DOCKER_HOST:-}" == *docker_cli* ]]; then
        export DOCKER_HOST="npipe:////./pipe/dockerDesktopLinuxEngine"
      fi
      if [[ -z "${TESTCONTAINERS_HOST_OVERRIDE:-}" ]]; then
        export TESTCONTAINERS_HOST_OVERRIDE="host.docker.internal"
      fi
      echo "Testcontainers Docker endpoint: ${DOCKER_HOST}" >&2
      ;;
  esac
}

test_docker_ready() {
  command -v docker >/dev/null 2>&1 || return 1
  docker ps >/dev/null 2>&1 || return 1
  local server_version
  server_version="$(docker version --format '{{.Server.Version}}' 2>/dev/null || true)"
  [[ -n "$server_version" && "$server_version" != "<no value>" ]]
}

if [[ "$SKIP_DOCKER_CHECK" != "true" ]]; then
  set_testcontainers_env
  if ! test_docker_ready; then
    echo "Docker daemon is not available."
    case "${OSTYPE:-unknown}" in
      linux*) echo "Try: sudo systemctl start docker" ;;
      darwin*) echo "Start Docker Desktop.app and retry." ;;
      msys*|cygwin*|win32*) echo "Start Docker Desktop (Windows) and retry." ;;
      *) echo "Start Docker daemon and retry." ;;
    esac
    exit 1
  fi
fi

case "$SUITE" in
  core) TEST_SELECTOR="ControllerIntegrationTest" ;;
  clubs) TEST_SELECTOR="ClubIntegrationTest" ;;
  marketplace) TEST_SELECTOR="MarketplaceIntegrationTest" ;;
  placement) TEST_SELECTOR="PlacementIntegrationTest" ;;
  stream) TEST_SELECTOR="StreamIntegrationTest" ;;
  security) TEST_SELECTOR="PlacementSecurityIntegrationTest" ;;
  smoke) TEST_SELECTOR="ControllerIntegrationTest,ClubIntegrationTest" ;;
  *) TEST_SELECTOR="ControllerIntegrationTest,ClubIntegrationTest,MarketplaceIntegrationTest,PlacementIntegrationTest,StreamIntegrationTest,PlacementSecurityIntegrationTest" ;;
esac

echo "Running integration suite: $SUITE"
echo "Tests: $TEST_SELECTOR"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT/backend"

SCHEMA_TARGET="target/classes/schema.sql"
if [[ -f "$SCHEMA_TARGET" ]]; then
  chmod u+w "$SCHEMA_TARGET" >/dev/null 2>&1 || true
  if ! rm -f "$SCHEMA_TARGET"; then
    echo "Warning: Cannot remove file: $REPO_ROOT/backend/$SCHEMA_TARGET"
    if [[ "$SKIP_RESOURCES" != "true" ]]; then
      echo "Enabling fallback: SKIP_RESOURCES=true"
      SKIP_RESOURCES=true
    fi
  fi
fi

if ! command -v mvn >/dev/null 2>&1; then
  echo "Maven (mvn) not found in PATH."
  exit 1
fi

IFS=',' read -r -a TEST_NAMES <<< "$TEST_SELECTOR"
for test_name in "${TEST_NAMES[@]}"; do
  if ! find "src/test/java" -type f -name "${test_name}.java" | grep -q .; then
    echo "Missing test class for suite '$SUITE': ${test_name}"
    exit 1
  fi
done

MVN_ARGS=(-Dtest="$TEST_SELECTOR")
if [[ "$SKIP_RESOURCES" == "true" ]]; then
MVN_ARGS+=(-Dmaven.resources.skip=true)
fi
MVN_ARGS+=(test)

mvn "${MVN_ARGS[@]}"

skipped_total=0
for test_name in "${TEST_NAMES[@]}"; do
  while IFS= read -r report_file; do
    skipped="$(grep -o 'skipped="[0-9]*"' "$report_file" | head -n1 | sed -E 's/[^0-9]//g' || true)"
    skipped="${skipped:-0}"
    skipped_total=$((skipped_total + skipped))
  done < <(find "target/surefire-reports" -type f -name "TEST-*${test_name}.xml" 2>/dev/null)
done

if [[ "$skipped_total" -gt 0 ]]; then
  echo "Integration suite '$SUITE' completed but ${skipped_total} test(s) were skipped."
  echo "Docker/Testcontainers is not fully healthy; fix daemon readiness and rerun."
  exit 1
fi
