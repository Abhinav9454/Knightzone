param(
  [string]$Namespace = "production",
  [string]$Deployment = "contest-backend",
  [string]$Timeout = "180s"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Write-Host "[canary-verify] namespace=$Namespace deployment=$Deployment timeout=$Timeout"
kubectl -n $Namespace rollout status deployment/$Deployment --timeout=$Timeout
kubectl -n $Namespace get deployment $Deployment -o wide
