#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

SKIP_PRUNE=false
SKIP_FRONTEND_INSTALL=false
SKIP_BACKEND_BUILD=false
SKIP_WORKSPACE_CLEAN=false
NO_BUILD=false
DETACH=false

usage() {
  cat <<'EOF'
Usage: ./backend/scripts/clean-and-rebuild.sh [options]

Options:
  --skip-prune             Skip docker system prune -a -f
  --skip-frontend-install  Skip frontend dependency reinstall
  --skip-backend-build     Skip backend package build
  --skip-workspace-clean   Skip workspace artifact cleanup
  --no-build               Run compose up without --build
  --detach                 Run compose up in detached mode (-d)
  -h, --help               Show help
EOF
}

for arg in "$@"; do
  case "$arg" in
    --skip-prune) SKIP_PRUNE=true ;;
    --skip-frontend-install) SKIP_FRONTEND_INSTALL=true ;;
    --skip-backend-build) SKIP_BACKEND_BUILD=true ;;
    --skip-workspace-clean) SKIP_WORKSPACE_CLEAN=true ;;
    --no-build) NO_BUILD=true ;;
    --detach) DETACH=true ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      usage
      exit 1
      ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found. Install Docker and retry."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not available. Start Docker and retry."
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Neither 'docker compose' nor 'docker-compose' is available."
  exit 1
fi

run_compose() {
  "${COMPOSE_CMD[@]}" "$@"
}

cd "$REPO_ROOT"

if [[ "$SKIP_WORKSPACE_CLEAN" != "true" ]]; then
  echo "Cleaning workspace artifacts..."
  chmod +x backend/scripts/clean-artifacts.sh
  ./backend/scripts/clean-artifacts.sh
else
  echo "Skipping workspace artifact cleanup (--skip-workspace-clean)."
fi

echo "Stopping and removing containers..."
run_compose down -v --remove-orphans

if [[ "$SKIP_PRUNE" != "true" ]]; then
  echo "Pruning docker system (images/containers)..."
  docker system prune -a -f
else
  echo "Skipping docker system prune (--skip-prune)."
fi

if [[ "$SKIP_FRONTEND_INSTALL" != "true" ]]; then
  if ! command -v npm >/dev/null 2>&1; then
    echo "npm not found. Install Node.js and retry."
    exit 1
  fi

  echo "Reinstalling frontend dependencies..."
  cd "$REPO_ROOT/frontend"
  rm -rf node_modules
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
  cd "$REPO_ROOT"
else
  echo "Skipping frontend dependency installation (--skip-frontend-install)."
fi

if [[ "$SKIP_BACKEND_BUILD" != "true" ]]; then
  echo "Building backend with tests skipped..."
  cd "$REPO_ROOT/backend"
  if [[ -x ./mvnw ]]; then
    ./mvnw clean package -DskipTests
  elif command -v mvn >/dev/null 2>&1; then
    mvn clean package -DskipTests
  else
    echo "Maven not found. Install Maven or add Maven Wrapper."
    exit 1
  fi
  cd "$REPO_ROOT"
else
  echo "Skipping backend build (--skip-backend-build)."
fi

UP_ARGS=(up)
if [[ "$NO_BUILD" != "true" ]]; then
  UP_ARGS+=(--build)
fi
if [[ "$DETACH" == "true" ]]; then
  UP_ARGS+=(-d)
fi

echo "Starting Docker Compose stack: ${UP_ARGS[*]}"
run_compose "${UP_ARGS[@]}"

echo "Clean and rebuild workflow completed."
