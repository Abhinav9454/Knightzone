[CmdletBinding()]
param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$pathsToClean = @(
  "frontend\dist",
  "frontend\coverage",
  "frontend\.vitest",
  "frontend\.eslintcache",
  "backend\target",
  "backend\judge-service\target"
)

$logPatterns = @(
  "frontend\*.log",
  "*.log"
)

function Remove-PathIfExists([string]$relativePath) {
  $fullPath = Join-Path $repoRoot $relativePath
  if (-not (Test-Path $fullPath)) {
    return
  }

  if ($DryRun) {
    Write-Host "[DRY-RUN] Remove $fullPath"
    return
  }

  Remove-Item -Path $fullPath -Recurse -Force -ErrorAction Stop
  Write-Host "Removed $fullPath"
}

function Remove-LogsByPattern([string]$pattern) {
  $matches = @(Get-ChildItem -Path (Join-Path $repoRoot $pattern) -File -ErrorAction SilentlyContinue)
  foreach ($file in $matches) {
    if ($DryRun) {
      Write-Host "[DRY-RUN] Remove $($file.FullName)"
      continue
    }
    Remove-Item -Path $file.FullName -Force -ErrorAction Stop
    Write-Host "Removed $($file.FullName)"
  }
}

Write-Host "Cleaning workspace artifacts under: $repoRoot" -ForegroundColor Cyan

foreach ($relativePath in $pathsToClean) {
  Remove-PathIfExists $relativePath
}

foreach ($pattern in $logPatterns) {
  Remove-LogsByPattern $pattern
}

Write-Host "Artifact cleanup completed." -ForegroundColor Green
