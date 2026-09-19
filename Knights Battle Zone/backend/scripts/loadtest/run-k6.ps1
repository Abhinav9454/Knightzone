param(
  [string]$Scenario = "platform_baseline.js",
  [string]$BaseUrl = "http://localhost:8080",
  [string]$Email = "",
  [string]$Password = "",
  [string]$Token = "",
  [int]$ProblemId = 9,
  [string]$ResultsDir = ""
)

$ErrorActionPreference = "Stop"

$scriptsRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$k6Root = Join-Path $scriptsRoot "k6"
if ($ResultsDir) {
  $resultsRoot = $ResultsDir
} else {
  $resultsRoot = Join-Path $scriptsRoot "results"
}
New-Item -ItemType Directory -Force -Path $resultsRoot | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$summaryPath = Join-Path $resultsRoot "$($Scenario.Replace('.js',''))-$timestamp-summary.json"

$envArgs = @(
  "-e", "BASE_URL=$BaseUrl",
  "-e", "LOADTEST_PROBLEM_ID=$ProblemId",
  "-e", "K6_SUMMARY_EXPORT=/results/summary.json"
)

if ($Token) {
  $envArgs += @("-e", "LOADTEST_TOKEN=$Token")
} else {
  if (-not $Email -or -not $Password) {
    throw "Provide either -Token or both -Email and -Password."
  }
  $envArgs += @("-e", "LOADTEST_EMAIL=$Email", "-e", "LOADTEST_PASSWORD=$Password")
}

Write-Host "Running k6 scenario '$Scenario' against $BaseUrl"

docker run --rm -i `
  @envArgs `
  -v "${k6Root}:/scripts" `
  -v "${resultsRoot}:/results" `
  grafana/k6 run "/scripts/$Scenario"

if (Test-Path (Join-Path $resultsRoot "summary.json")) {
  Move-Item -Force (Join-Path $resultsRoot "summary.json") $summaryPath
  Write-Host "Saved summary: $summaryPath"
}
