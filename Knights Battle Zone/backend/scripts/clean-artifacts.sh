#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DRY_RUN=false

usage() {
  cat <<'EOF'
Usage: ./backend/scripts/clean-artifacts.sh [--dry-run]
EOF
}

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
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

paths_to_clean=(
  "frontend/dist"
  "frontend/coverage"
  "frontend/.vitest"
  "frontend/.eslintcache"
  "backend/target"
  "backend/judge-service/target"
)

remove_path() {
  local path="$1"
  if [[ ! -e "$path" ]]; then
    return
  fi
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[DRY-RUN] Remove $path"
    return
  fi
  rm -rf "$path"
  echo "Removed $path"
}

remove_logs() {
  local glob="$1"
  shopt -s nullglob
  local files=("$REPO_ROOT"/$glob)
  for file in "${files[@]}"; do
    [[ -f "$file" ]] || continue
    if [[ "$DRY_RUN" == "true" ]]; then
      echo "[DRY-RUN] Remove $file"
    else
      rm -f "$file"
      echo "Removed $file"
    fi
  done
}

echo "Cleaning workspace artifacts under: $REPO_ROOT"

for rel in "${paths_to_clean[@]}"; do
  remove_path "$REPO_ROOT/$rel"
done

remove_logs "frontend/*.log"
remove_logs "*.log"

echo "Artifact cleanup completed."
