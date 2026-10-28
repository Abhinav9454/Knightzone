param(
  [ValidateSet("all", "smoke", "core", "clubs", "placement", "stream", "security")]
  [string]$Suite = "all",
  [switch]$SkipDockerCheck,
  [switch]$SkipResources
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Test-DockerAvailable {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    return $false
  }

  try {
    docker ps *> $null
    if ($LASTEXITCODE -ne 0) {
      return $false
    }

    $serverVersion = (docker version --format "{{.Server.Version}}" 2>$null | Out-String).Trim()
    if ([string]::IsNullOrWhiteSpace($serverVersion) -or $serverVersion -eq "<no value>") {
      return $false
    }

    return $true
  } catch {
    return $false
  }
}

function Set-TestcontainersEnvironment {
  if ($env:OS -ne "Windows_NT") {
    return
  }

  function Test-DockerHostEndpoint([string]$HostValue) {
    if ([string]::IsNullOrWhiteSpace($HostValue)) {
      return $false
    }
    try {
      $version = (docker --host $HostValue version --format "{{.Server.Version}}" 2>$null | Out-String).Trim()
      return -not [string]::IsNullOrWhiteSpace($version) -and $version -ne "<no value>"
    } catch {
      return $false
    }
  }

  $contextHost = $null
  try {
    $activeContext = (docker context show 2>$null | Out-String).Trim()
    if (-not [string]::IsNullOrWhiteSpace($activeContext)) {
      $contextHost = (docker context inspect $activeContext --format '{{(index .Endpoints "docker").Host}}' 2>$null | Out-String).Trim()
    }
  } catch {
    $contextHost = $null
  }

  $candidates = @()
  if (-not [string]::IsNullOrWhiteSpace($contextHost) -and $contextHost -notlike "*docker_cli*") {
    $candidates += $contextHost
  }
  $candidates += "npipe:////./pipe/dockerDesktopLinuxEngine"
  $candidates += "npipe:////./pipe/docker_engine"

  $selectedHost = $null
  foreach ($candidate in ($candidates | Select-Object -Unique)) {
    if (Test-DockerHostEndpoint $candidate) {
      $selectedHost = $candidate
      break
    }
  }

  if ($selectedHost) {
    $env:DOCKER_HOST = $selectedHost
  } elseif ([string]::IsNullOrWhiteSpace($env:DOCKER_HOST) -or $env:DOCKER_HOST -like "*docker_cli*") {
    # Last-resort fallback.
    $env:DOCKER_HOST = "npipe:////./pipe/dockerDesktopLinuxEngine"
  }

  if ([string]::IsNullOrWhiteSpace($env:TESTCONTAINERS_HOST_OVERRIDE)) {
    $env:TESTCONTAINERS_HOST_OVERRIDE = "host.docker.internal"
  }

  # Windows + Docker Desktop can intermittently fail Ryuk/check probes over host networking.
  # Keep local integration runs stable unless caller explicitly overrides these vars.
  if ([string]::IsNullOrWhiteSpace($env:TESTCONTAINERS_RYUK_DISABLED)) {
    $env:TESTCONTAINERS_RYUK_DISABLED = "true"
  }
  if ([string]::IsNullOrWhiteSpace($env:TESTCONTAINERS_CHECKS_DISABLE)) {
    $env:TESTCONTAINERS_CHECKS_DISABLE = "true"
  }

  Write-Host "Testcontainers Docker endpoint: $($env:DOCKER_HOST)" -ForegroundColor DarkGray
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

function Get-SkippedIntegrationCount([string]$backendDir, [string[]]$testClassNames) {
  $reportDir = Join-Path $backendDir "target\surefire-reports"
  if (-not (Test-Path $reportDir)) {
    return -1
  }

  $skipped = 0
  foreach ($testClass in $testClassNames) {
    $matchingReports = Get-ChildItem -Path $reportDir -Filter ("TEST-*{0}.xml" -f $testClass) -File -ErrorAction SilentlyContinue
    if (-not $matchingReports) {
      continue
    }

    foreach ($reportFile in $matchingReports) {
      try {
        [xml]$xml = Get-Content -Path $reportFile.FullName
        $value = $xml.testsuite.skipped
        if ($null -ne $value -and "$value" -ne "") {
          $skipped += [int]$value
        }
      } catch {
        Write-Warning "Could not parse surefire report: $($reportFile.FullName)"
      }
    }
  }

  return $skipped
}

function Get-TestClassNames([string]$backendDir) {
  $testRoot = Join-Path $backendDir "src\test\java"
  if (-not (Test-Path $testRoot)) {
    return @()
  }

  return Get-ChildItem -Path $testRoot -Recurse -Filter "*Test.java" -File |
    ForEach-Object { [System.IO.Path]::GetFileNameWithoutExtension($_.Name) }
}

function Get-TestsForSuite([string]$suiteName) {
  $suiteMap = @{
    core        = @("ControllerIntegrationTest")
    clubs       = @("ClubIntegrationTest")
    placement   = @("PlacementIntegrationTest")
    stream      = @("StreamIntegrationTest")
    security    = @("PlacementSecurityIntegrationTest")
    smoke       = @("ControllerIntegrationTest", "ClubIntegrationTest")
  }

  if ($suiteName -eq "all") {
    $all = @()
    foreach ($entry in $suiteMap.Values) {
      $all += $entry
    }
    return $all | Select-Object -Unique
  }

  return $suiteMap[$suiteName]
}

function Try-ClearSchemaTarget([string]$backendDir) {
  $schemaTarget = Join-Path $backendDir "target\classes\schema.sql"
  if (-not (Test-Path $schemaTarget)) {
    return $true
  }

  try {
    attrib -R $schemaTarget 2>$null | Out-Null
    Remove-Item -Force $schemaTarget -ErrorAction Stop
    return $true
  } catch {
    Write-Warning "Cannot remove file: $schemaTarget. Resource copy may fail due lock/ACL."
    return $false
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$backendDir = Join-Path $repoRoot "backend"

if (-not (Test-Path $backendDir)) {
  Write-Error "Backend directory not found: $backendDir"
  exit 1
}

if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
  Write-Error "Maven (mvn) not found in PATH."
  exit 1
}

if (-not $SkipDockerCheck) {
  Set-TestcontainersEnvironment
  if (-not (Test-DockerAvailable)) {
    Write-Warning "Docker daemon is not available. Trying to start Docker Desktop..."
    if (-not (Start-DockerDesktopAndWait)) {
      Write-Error "Docker daemon is still unavailable. Start Docker Desktop manually and retry, or pass -SkipDockerCheck."
      exit 1
    }
  }
}

$tests = Get-TestsForSuite $Suite
$availableTests = Get-TestClassNames $backendDir
$missingTests = @($tests | Where-Object { $_ -notin $availableTests })

if ($missingTests.Count -gt 0) {
  Write-Error "Missing test classes for suite '$Suite': $($missingTests -join ', ')"
  exit 1
}

$testSelector = $tests -join ","
$effectiveSkipResources = [bool]$SkipResources

Write-Host "Running integration suite: $Suite" -ForegroundColor Cyan
Write-Host "Tests: $testSelector" -ForegroundColor Gray

$schemaCleared = Try-ClearSchemaTarget $backendDir
if (-not $schemaCleared -and -not $effectiveSkipResources) {
  Write-Warning "Enabling fallback: -Dmaven.resources.skip=true"
  $effectiveSkipResources = $true
}

$mvnArgs = @("-Dtest=$testSelector")
if ($env:OS -eq "Windows_NT") {
  $mvnArgs += "-Ddocker.client.strategy=org.testcontainers.dockerclient.EnvironmentAndSystemPropertyClientProviderStrategy"
}
if ($effectiveSkipResources) {
  $mvnArgs += "-Dmaven.resources.skip=true"
}
$mvnArgs += "test"

Push-Location $backendDir
try {
  & mvn @mvnArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Maven test execution failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}

$skippedCount = Get-SkippedIntegrationCount -backendDir $backendDir -testClassNames $tests
if ($skippedCount -gt 0) {
  Write-Error "Integration suite '$Suite' completed but $skippedCount test(s) were skipped. Docker/Testcontainers is not fully healthy."
  exit 1
}
