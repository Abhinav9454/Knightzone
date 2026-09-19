param(
  [string]$Namespace = "production",
  [string]$Deployment = "contest-backend",
  [string]$Timeout = "180s"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Write-Host "[k8s-rollback] undo deployment=$Deployment in namespace=$Namespace"
kubectl -n $Namespace rollout undo deployment/$Deployment
kubectl -n $Namespace rollout status deployment/$Deployment --timeout=$Timeout
kubectl -n $Namespace get deployment $Deployment -o wide
