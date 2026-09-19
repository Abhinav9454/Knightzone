param(
  [string]$BaseUrl = "http://localhost:8080",
  [string]$Email = "",
  [string]$Password = "",
  [string]$Token = "",
  [int]$ProblemId = 9,
  [string]$ResultsDir = "",
  [bool]$RunGoLiveGate = $true
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$runner = Join-Path $scriptDir "run-k6.ps1"

if (-not (Test-Path $runner)) {
  throw "Missing runner script: $runner"
}

if (-not $ResultsDir) {
  $ResultsDir = Join-Path $scriptDir "results"
}
New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null

$scenarios = @(
  "platform_baseline.js",
  "judge_spike.js",
  "combined_mixed.js",
  "long_soak.js"
)

foreach ($scenario in $scenarios) {
  Write-Host "[phase7] Running scenario: $scenario"
  $args = @{
    Scenario = $scenario
    BaseUrl = $BaseUrl
    ProblemId = $ProblemId
    ResultsDir = $ResultsDir
  }
  if ($Token) {
    $args["Token"] = $Token
  } else {
    if (-not $Email -or -not $Password) {
      throw "Provide either -Token or both -Email and -Password."
    }
    $args["Email"] = $Email
    $args["Password"] = $Password
  }
  & $runner @args
}

$aggregateScript = Join-Path $scriptDir "aggregate_k6_results.js"
if (Test-Path $aggregateScript) {
  Write-Host "[phase7] Aggregating k6 summaries"
  node $aggregateScript --results-dir $ResultsDir
}

if ($RunGoLiveGate) {
  $gateScript = Join-Path $scriptDir "..\ops\go_live_gate_50k.ps1"
  if (Test-Path $gateScript) {
    Write-Host "[phase7] Running go-live gate checks"
    & $gateScript -ResultsDir $ResultsDir
  } else {
    Write-Warning "[phase7] Go-live gate script not found: $gateScript"
  }
}

Write-Host "[phase7] Completed all scenarios."
