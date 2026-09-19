param(
  [string]$BaseUrl = "http://localhost:8080",
  [int]$HealthTimeoutSeconds = 180,
  [switch]$SkipDockerStatus
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
  param([string]$Message)
  Write-Host "[runtime-smoke] $Message"
}

function Wait-ForJsonHealth {
  param(
    [string]$Url,
    [int]$TimeoutSeconds
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $resp = Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec 5
      if ($resp.status -eq "UP") {
        return $true
      }
    } catch {
      # keep polling
    }
    Start-Sleep -Seconds 2
  }

  return $false
}

function Invoke-Json {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body,
    [hashtable]$Headers
  )
  $params = @{
    Method = $Method
    Uri = $Url
    TimeoutSec = 10
  }
  if ($Body -ne $null) {
    $params["ContentType"] = "application/json"
    $params["Body"] = ($Body | ConvertTo-Json -Depth 8)
  }
  if ($Headers) {
    $params["Headers"] = $Headers
  }
  return Invoke-RestMethod @params
}

$apiBase = $BaseUrl.TrimEnd("/")
$healthUrl = "$apiBase/api/health"

if (-not $SkipDockerStatus) {
  Write-Step "Checking docker compose status"
  docker compose ps
}

Write-Step "Waiting for backend health: $healthUrl"
if (-not (Wait-ForJsonHealth -Url $healthUrl -TimeoutSeconds $HealthTimeoutSeconds)) {
  throw "Backend health did not become UP within timeout."
}

$now = Get-Date -Format "yyyyMMddHHmmss"
$email = "smoke_${now}@unifiedcode.local"
$password = "SmokePass!${now}"
$registerBody = @{
  name = "Smoke User $now"
  email = $email
  password = $password
  role = "STUDENT"
}

Write-Step "Registering smoke user: $email"
$registerResp = Invoke-Json -Method "POST" -Url "$apiBase/api/auth/register" -Body $registerBody -Headers @{}
if (-not $registerResp.token) {
  throw "Registration failed to return token."
}

Write-Step "Logging in smoke user"
$loginResp = Invoke-Json -Method "POST" -Url "$apiBase/api/auth/login" -Body @{ email = $email; password = $password } -Headers @{}
if (-not $loginResp.token) {
  throw "Login failed to return token."
}

$authHeaders = @{ Authorization = "Bearer $($loginResp.token)" }

Write-Step "Validating /api/auth/me"
$me = Invoke-Json -Method "GET" -Url "$apiBase/api/auth/me" -Body $null -Headers $authHeaders
if ($me.email -ne $email) {
  throw "Auth/me mismatch. Expected $email got $($me.email)"
}

Write-Step "Validating dashboard summary"
$summary = Invoke-Json -Method "GET" -Url "$apiBase/api/dashboard/summary" -Body $null -Headers $authHeaders
if ($null -eq $summary.currentRating) {
  throw "Dashboard summary missing currentRating."
}

Write-Step "Checking contest list API"
$contests = Invoke-Json -Method "GET" -Url "$apiBase/api/contests?page=0&size=5" -Body $null -Headers $authHeaders
if ($null -eq $contests.content) {
  throw "Contest list response missing content array."
}

Write-Step "Runtime smoke passed."
Write-Host ("[runtime-smoke] user={0} contests={1}" -f $email, ($contests.content | Measure-Object).Count)
