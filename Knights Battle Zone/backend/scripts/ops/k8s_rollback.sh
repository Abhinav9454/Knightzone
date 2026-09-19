#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:-production}"
DEPLOYMENT="${2:-contest-backend}"
TIMEOUT="${3:-180s}"

echo "[k8s-rollback] undo deployment=${DEPLOYMENT} in namespace=${NAMESPACE}"
kubectl -n "${NAMESPACE}" rollout undo "deployment/${DEPLOYMENT}"
kubectl -n "${NAMESPACE}" rollout status "deployment/${DEPLOYMENT}" --timeout="${TIMEOUT}"
kubectl -n "${NAMESPACE}" get deployment "${DEPLOYMENT}" -o wide
