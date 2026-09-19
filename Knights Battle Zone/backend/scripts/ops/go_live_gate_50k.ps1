param(
  [string]$ResultsDir = "",
  [string]$ReportPath = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ResultsDir) {
  $ResultsDir = Join-Path $scriptDir "..\loadtest\results"
}
$gateScript = Join-Path $scriptDir "go_live_gate_50k.js"

if (-not (Test-Path $gateScript)) {
  throw "Missing gate script: $gateScript"
}

if (-not (Test-Path $ResultsDir)) {
  throw "Results directory not found: $ResultsDir. Run backend/scripts/loadtest/run-phase7.ps1 first."
}

Write-Host "[go-live-gate] running with results dir $ResultsDir"
if (-not $ReportPath) {
  $ReportPath = Join-Path (Resolve-Path $ResultsDir).Path "go-live-gate-report.json"
}
node $gateScript --results-dir (Resolve-Path $ResultsDir).Path --out $ReportPath
