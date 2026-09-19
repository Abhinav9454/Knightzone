#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

status() {
  echo "[$1] $2"
}

is_git_repo() {
  local path="$1"
  git -C "$path" rev-parse --is-inside-work-tree >/dev/null 2>&1
}

ROOT_IS_REPO=false
if is_git_repo "$REPO_ROOT"; then
  ROOT_IS_REPO=true
  status PASS "Root repository detected: $REPO_ROOT"
else
  status WARN "Root is not a Git repository: $REPO_ROOT"
fi

mapfile -t NESTED_GIT < <(find "$REPO_ROOT" -type d -name .git ! -path "$REPO_ROOT/.git")

if [[ ${#NESTED_GIT[@]} -eq 0 ]]; then
  status PASS "No nested .git directories detected."
  exit 0
fi

status WARN "Nested Git directories found:"
for git_dir in "${NESTED_GIT[@]}"; do
  echo " - $git_dir"
done

if [[ "$ROOT_IS_REPO" == "false" && ${#NESTED_GIT[@]} -eq 1 && "${NESTED_GIT[0]}" == "$REPO_ROOT/backend/.git" ]]; then
  status FAIL "Repository is backend-only; monorepo root is unmanaged by Git."
  echo "Recommended next step:"
  echo "  1) Keep backend repo as-is and run git with: git -C backend <command>"
  echo "  2) Or migrate to root repo (requires history migration planning)."
  exit 1
fi

status FAIL "Git topology is split (root + nested repos). Decide canonical repo root before CI release."
exit 1
