<#
PowerShell script to check Docker-based full-stack application connections.
Saves a summary of pass/fail for multiple checks.
Prerequisites: docker, mysql client (optional)
Usage: Open PowerShell as admin and run: .\backend\scripts\check_connections.ps1
#>

# Configuration
$containers = @{
  frontend = 'contest-frontend'
  backend  = 'contest-backend'
  mysql    = 'contest-mysql'
  judge    = 'contest-judge'
}

$frontendPort = 3000
$backendPort  = 8080
$mysqlHostPort = 3307
$mysqlUser = if ($env:CHECK_MYSQL_USER) { $env:CHECK_MYSQL_USER } else { 'contestuser' }
$mysqlPass = if ($env:CHECK_MYSQL_PASS) { $env:CHECK_MYSQL_PASS } elseif ($env:MYSQL_PASSWORD) { $env:MYSQL_PASSWORD } else { '' }
$mysqlDb   = if ($env:CHECK_MYSQL_DB) { $env:CHECK_MYSQL_DB } else { 'contestdb' }
$judgeToken = if ($env:CHECK_JUDGE_TOKEN) { $env:CHECK_JUDGE_TOKEN } elseif ($env:JUDGE_INTERNAL_TOKEN) { $env:JUDGE_INTERNAL_TOKEN } else { '' }

$results = @{}

function Write-Result($name, $ok, $msg) {
  $status = if ($ok) { 'PASS' } else { 'FAIL' }
  Write-Host "[$status] $name - $msg"
  $results[$name] = $ok
}

function Ensure-ConfigValue([string]$name, [string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) {
    Write-Result "Config:$name" $false "Missing required value. Set $name before running this script."
    return $false
  }
  return $true
}

function Get-HttpStatus($url, $method = "GET", $headers = @{}) {
  try {
    $response = Invoke-WebRequest -Uri $url -Method $method -Headers $headers -UseBasicParsing -ErrorAction Stop
    return [int]$response.StatusCode
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      return [int]$_.Exception.Response.StatusCode
    }
    return 0
  }
}

function Test-DockerAvailable {
  try {
    docker info *> $null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Get-DockerDesktopPath {
  $candidates = @(@(
    (Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "Docker\Docker\Docker Desktop.exe")
  ) | Where-Object { $_ -and (Test-Path $_) })

  if ($candidates.Count -gt 0) {
    return $candidates[0]
  }

  return $null
}

function Start-DockerDesktopAndWait([int]$timeoutSeconds = 120) {
  if (Test-DockerAvailable) {
    return $true
  }

  $desktopExe = Get-DockerDesktopPath
  if (-not $desktopExe) {
    return $false
  }

  try {
    Start-Process -FilePath $desktopExe | Out-Null
  } catch {
    return $false
  }

  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 2
    if (Test-DockerAvailable) {
      return $true
    }
  }

  return $false
}

function Check-ContainerRunning($containerName) {
  try {
    $inspect = docker inspect --format='{{.State.Status}}' $containerName 2>$null
    if ($LASTEXITCODE -ne 0) { return @{ok=$false; msg='Container not found'} }
    $status = $inspect.Trim()
    if ($status -eq 'running' -or $status -like 'running*' -or $status -eq 'up') {
      return @{ok=$true; msg="Status=$status"}
    } else {
      return @{ok=$false; msg="Status=$status"}
    }
  } catch {
    return @{ok=$false; msg=$_.Exception.Message}
  }
}

function Check-HostMySQL() {
  # Prefer host mysql client
  if (Get-Command mysql -ErrorAction SilentlyContinue) {
    try {
      $cmd = "mysql -h 127.0.0.1 -P $mysqlHostPort -u$mysqlUser -p$mysqlPass -D $mysqlDb -e ""SHOW TABLES;"""
      $out = cmd /c $cmd 2>&1
      if ($LASTEXITCODE -eq 0) { return @{ok=$true; msg='Connected via local mysql client'} }
      else { return @{ok=$false; msg="Local mysql client failed: $out"} }
    } catch {
      return @{ok=$false; msg=$_.Exception.Message}
    }
  } else {
    # Fallback: exec into mysql container and run mysql client there
    try {
      $out = docker exec $containers.mysql mysql -u$mysqlUser -p$mysqlPass -D $mysqlDb -e "SHOW TABLES;" 2>&1
      if ($LASTEXITCODE -eq 0) { return @{ok=$true; msg='Connected via mysql container client'} }
      else { return @{ok=$false; msg="Container mysql client failed: $out"} }
    } catch {
      return @{ok=$false; msg=$_.Exception.Message}
    }
  }
}

function Check-BackendDBFromContainer() {
  # Try backend's health endpoint from inside backend container
  try {
    $curlCmd = "curl -sS -f http://localhost:$backendPort/api/actuator/health || curl -sS -f http://localhost:$backendPort/actuator/health"
    $out = docker exec $containers.backend sh -c $curlCmd 2>&1
    if ($LASTEXITCODE -eq 0) { return @{ok=$true; msg='Backend container reports healthy (health endpoint)'} }
    else { return @{ok=$false; msg="Backend health inside container failed: $out"} }
  } catch {
    return @{ok=$false; msg=$_.Exception.Message}
  }
}

function Check-BackendHealth() {
  # From host -> backend
  $uris = @("http://localhost:$backendPort/api/actuator/health", "http://localhost:$backendPort/actuator/health")
  foreach ($u in $uris) {
    $status = Get-HttpStatus $u
    if ($status -eq 200) { return @{ok=$true; msg="$u returned 200"} }
  }
  return @{ok=$false; msg='No health endpoint returned 200'}
}

function Check-JudgeHealth() {
  try {
    $out = docker exec $containers.backend sh -c "curl -s -o /dev/null -w '%{http_code}' http://judge:5000/health" 2>&1
    $code = [int]($out.ToString().Trim())
    if ($LASTEXITCODE -eq 0 -and $code -eq 200) {
      return @{ok=$true; msg="Judge health returned 200 from backend container"}
    }
    else {
      return @{ok=$false; msg="Judge health check failed from backend container (HTTP $code)"}
    }
  } catch { return @{ok=$false; msg=$_.Exception.Message} }
}

function Check-Frontend() {
  $u = "http://localhost:$frontendPort/"
  try {
    $html = (Invoke-WebRequest -Uri $u -Method Get -UseBasicParsing -ErrorAction Stop).Content
    if ($html -match '<title' -or $html.Length -gt 0) { return @{ok=$true; msg='Frontend serving content'} }
    else { return @{ok=$false; msg='Empty response'} }
  } catch { return @{ok=$false; msg=$_.Exception.Message} }
}

function Check-CORS() {
  $url = "http://localhost:$backendPort/api/contests"
  try {
    $response = Invoke-WebRequest -Uri $url -Method Options -UseBasicParsing -Headers @{
      Origin = "http://localhost:$frontendPort"
      "Access-Control-Request-Method" = "GET"
    } -ErrorAction Stop
    if ($response.Headers["Access-Control-Allow-Origin"]) {
      return @{ok=$true; msg='CORS header present in OPTIONS response'}
    } else { return @{ok=$false; msg='CORS header missing in OPTIONS response'} }
  } catch { return @{ok=$false; msg=$_.Exception.Message} }
}

function Check-AuthFlow() {
  $registerUrl = "http://localhost:$backendPort/api/auth/register"
  $meUrl = "http://localhost:$backendPort/api/auth/me"
  try {
    $rand = Get-Random -Maximum 999999999
    $password = "Health@{0}Aa" -f ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
    $payload = @{
      name = "Health Check User"
      email = "healthcheck_$rand@example.com"
      password = $password
      college = "HealthCheck College"
      department = "QA"
    } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri $registerUrl -Method Post -Body $payload -ContentType 'application/json' -ErrorAction Stop
    if ($null -eq $resp) { return @{ok=$false; msg='Login request failed or no response'} }
    # try to find token field
    $token = $null
    if ($resp.PSObject.Properties.Name -contains 'token' -and $resp.token) {
      $token = $resp.token
    }
    elseif ($resp.PSObject.Properties.Name -contains 'accessToken' -and $resp.accessToken) {
      $token = $resp.accessToken
    }
    elseif ($resp.PSObject.Properties.Name -contains 'data' -and $resp.data) {
      $data = $resp.data
      if ($data.PSObject.Properties.Name -contains 'token' -and $data.token) {
        $token = $data.token
      }
    }
    if ($token) {
      # use token to access protected endpoint
      $headers = @{ Authorization = "Bearer $token" }
      $me = Invoke-RestMethod -Uri $meUrl -Headers $headers -Method Get -ErrorAction Stop
      if ($null -ne $me) { return @{ok=$true; msg='Register + token + /auth/me flow succeeded'; token=$token} }
      else { return @{ok=$false; msg='Registration succeeded but /auth/me failed'; token=$token} }
    } else { return @{ok=$false; msg='No token in login response'; token=$null} }
  } catch { return @{ok=$false; msg=$_.Exception.Message} }
}

function Check-ModuleApiHealth([string]$token) {
  if (-not $token) {
    return @(
      @{name='API:Placement'; ok=$false; msg='Skipped: no auth token'}
      @{name='API:Clubs'; ok=$false; msg='Skipped: no auth token'}
      @{name='API:Marketplace'; ok=$false; msg='Skipped: no auth token'}
    )
  }

  $headers = @{ Authorization = "Bearer $token" }
  $checks = @(
    @{name='API:Placement'; url="http://localhost:$backendPort/api/placement/jobs"; expected=@(200)},
    @{name='API:Clubs'; url="http://localhost:$backendPort/api/clubs"; expected=@(200)},
    @{name='API:Marketplace'; url="http://localhost:$backendPort/api/passages?sort=new&page=0&size=5"; expected=@(200)}
  )

  $resultsList = @()
  foreach ($check in $checks) {
    $status = Get-HttpStatus -url $check.url -method "GET" -headers $headers
    $ok = $check.expected -contains $status
    $resultsList += @{
      name = $check.name
      ok   = $ok
      msg  = if ($ok) { "HTTP $status" } else { "Unexpected HTTP $status from $($check.url)" }
    }
  }
  return $resultsList
}

function Check-JudgeExecution() {
  if ([string]::IsNullOrWhiteSpace($judgeToken)) {
    return @{ok=$true; msg='Skipped: set CHECK_JUDGE_TOKEN (or JUDGE_INTERNAL_TOKEN) to test protected judge execute endpoint'}
  }

  $payload = @{language='python'; code="print('hello')"; input=""} | ConvertTo-Json -Compress
  try {
    $escapedPayload = $payload.Replace("'", "''")
    $escapedToken = $judgeToken.Replace("'", "''")
    $cmd = "curl -s -X POST http://judge:5000/execute -H 'Content-Type: application/json' -H 'X-Judge-Token: $escapedToken' -d '$escapedPayload'"
    $respText = docker exec $containers.backend sh -c $cmd 2>&1
    if ($LASTEXITCODE -eq 0 -and $respText -match 'hello|stdout|output') {
      return @{ok=$true; msg='Judge execution returned expected output via internal token-authenticated call'}
    }
    return @{ok=$false; msg="Protected judge execution failed or unexpected response: $respText"}
  } catch { return @{ok=$false; msg='Judge execution request failed: ' + $_.Exception.Message} }
}

function Check-ContainerNetworkConnectivity() {
  $messages = @()
  # from frontend container -> backend service
  $c = $containers.frontend
  $frontendProbe = "if command -v curl >/dev/null 2>&1; then curl -fsS -o /dev/null 'http://backend:8080/api/actuator/health' || curl -fsS -o /dev/null 'http://backend:8080/actuator/health'; elif command -v wget >/dev/null 2>&1; then wget -q -O /dev/null 'http://backend:8080/api/actuator/health' || wget -q -O /dev/null 'http://backend:8080/actuator/health'; else exit 127; fi"
  $ok1 = $false
  try {
    docker exec $c sh -c $frontendProbe *> $null
    if ($LASTEXITCODE -eq 0) {
      $ok1 = $true
    }
  } catch {
    $ok1 = $false
  }
  $messages += @{ok=$ok1; msg="frontend->backend connectivity"}

  # from backend container -> judge
  $c2 = $containers.backend
  $backendProbe = "if command -v curl >/dev/null 2>&1; then curl -fsS -o /dev/null 'http://judge:5000/health'; elif command -v wget >/dev/null 2>&1; then wget -q -O /dev/null 'http://judge:5000/health'; else exit 127; fi"
  $ok2 = $false
  try {
    docker exec $c2 sh -c $backendProbe *> $null
    if ($LASTEXITCODE -eq 0) {
      $ok2 = $true
    }
  } catch {
    $ok2 = $false
  }
  $messages += @{ok=$ok2; msg="backend->judge connectivity"}

  return $messages
}

Write-Host "Starting connectivity checks...`n"
if (-not (Ensure-ConfigValue "CHECK_MYSQL_PASS or MYSQL_PASSWORD" $mysqlPass)) {
  Write-Host "Aborting due to missing required configuration."
  exit 2
}

if (-not (Test-DockerAvailable)) {
  Write-Warning "Docker daemon is not available. Trying to start Docker Desktop..."
  if (-not (Start-DockerDesktopAndWait)) {
    Write-Host "[FAIL] Docker:Daemon - Docker daemon unavailable. Start Docker Desktop and rerun script."
    exit 1
  }
}

# 1. Container status
foreach ($role in $containers.Keys) {
  $name = $containers[$role]
  $res = Check-ContainerRunning $name
  Write-Result "Container:$name" $res.ok $res.msg
}

# 2. DB from host
$res = Check-HostMySQL
Write-Result 'DB:HostConnectivity' $res.ok $res.msg

# 3. DB from backend container
$res = Check-BackendDBFromContainer
Write-Result 'DB:BackendConnectivity' $res.ok $res.msg

# 4. Backend health
$res = Check-BackendHealth
Write-Result 'Backend:Health' $res.ok $res.msg

# 5. Judge health
$res = Check-JudgeHealth
Write-Result 'Judge:Health' $res.ok $res.msg

# 6. Frontend accessibility
$res = Check-Frontend
Write-Result 'Frontend:Accessibility' $res.ok $res.msg

# 7. CORS
$res = Check-CORS
Write-Result 'Backend:CORS' $res.ok $res.msg

# 8. Auth flow
$res = Check-AuthFlow
Write-Result 'Auth:Login' $res.ok $res.msg

# 8b. Module API health checks (authenticated)
$apiChecks = Check-ModuleApiHealth $res.token
foreach ($ac in $apiChecks) {
  Write-Result $ac.name $ac.ok $ac.msg
}

# 9. Judge execution (optional)
$res = Check-JudgeExecution
Write-Result 'Judge:Execute' $res.ok $res.msg

# 10. Container network connectivity
$netResults = Check-ContainerNetworkConnectivity
foreach ($nr in $netResults) {
  Write-Result "Network:$($nr.msg)" $nr.ok $nr.msg
}

# Summary
$passed = ($results.Values | Where-Object { $_ -eq $true }).Count
$total = $results.Count
Write-Host "`nSummary: $passed / $total checks passed."
if ($passed -lt $total) {
  Write-Host "Failed checks details:" -ForegroundColor Red
  foreach ($k in $results.Keys) {
    if (-not $results[$k]) { Write-Host " - $k" }
  }
  Write-Host "`nTroubleshooting hints:" -ForegroundColor Yellow
  Write-Host " - If containers aren't running: run 'docker ps' and inspect logs with 'docker logs <container>'." 
  Write-Host " - For DB auth errors: verify credentials, check MySQL logs ('docker logs $($containers.mysql)')." 
  Write-Host " - For CORS issues: ensure backend allows Origin 'http://localhost:3000' and preflight OPTIONS responses." 
  Write-Host " - For service failures: check application logs, ensure proper env vars and DB connectivity." 
}
else {
  Write-Host "All checks passed." -ForegroundColor Green
}

# Return non-zero exit code if any failed
if ($passed -lt $total) { exit 1 } else { exit 0 }
