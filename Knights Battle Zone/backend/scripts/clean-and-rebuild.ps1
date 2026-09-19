[CmdletBinding()]
param(
  [switch]$SkipPrune,
  [switch]$SkipFrontendInstall,
  [switch]$SkipBackendBuild,
  [switch]$SkipWorkspaceClean,
  [switch]$NoBuild,
  [switch]$Detach
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Assert-CommandExists([string]$commandName, [string]$hint) {
  if (-not (Get-Command $commandName -ErrorAction SilentlyContinue)) {
    throw "$commandName not found. $hint"
  }
}

function Test-DockerDaemon {
  try {
    docker info *> $null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

$script:DockerDesktopPath = $null

function Get-DockerDesktopPath {
  if ($script:DockerDesktopPath) {
    return $script:DockerDesktopPath
  }

  $candidates = @(@(
    (Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "Docker\Docker\Docker Desktop.exe")
  ) | Where-Object { $_ -and (Test-Path $_) })

  if ($candidates.Count -gt 0) {
    $script:DockerDesktopPath = $candidates[0]
  }

  return $script:DockerDesktopPath
}

function Start-DockerDesktopAndWait([int]$timeoutSeconds = 120) {
  if (Test-DockerDaemon) {
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
    if (Test-DockerDaemon) {
      return $true
    }
  }

  return $false
}

$script:UseComposeV2 = $false

function Initialize-Compose {
  Assert-CommandExists "docker" "Install Docker Desktop/Engine and ensure it is in PATH."

  if (-not (Test-DockerDaemon)) {
    Write-Warning "Docker daemon is not available. Trying to start Docker Desktop..."
    if (-not (Start-DockerDesktopAndWait)) {
      throw "Docker daemon is still unavailable. Start Docker manually and retry."
    }
  }

  try {
    docker compose version *> $null
    if ($LASTEXITCODE -eq 0) {
      $script:UseComposeV2 = $true
      return
    }
  } catch {}

  if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    $script:UseComposeV2 = $false
    return
  }

  throw "Neither 'docker compose' nor 'docker-compose' is available."
}

function Invoke-Compose([string[]]$args) {
  if ($script:UseComposeV2) {
    & docker compose @args
  } else {
    & docker-compose @args
  }

  if ($LASTEXITCODE -ne 0) {
    throw "Docker compose command failed: $($args -join ' ')"
  }
}

$projRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location -Path $projRoot

if (-not $SkipWorkspaceClean) {
  Write-Host "Cleaning workspace artifacts..." -ForegroundColor Cyan
  & (Join-Path $PSScriptRoot "clean-artifacts.ps1")
  if ($LASTEXITCODE -ne 0) {
    throw "Workspace artifact cleanup failed."
  }
} else {
  Write-Host "Skipping workspace artifact cleanup (--SkipWorkspaceClean)." -ForegroundColor Yellow
}

Initialize-Compose

Write-Host "Stopping and removing containers..." -ForegroundColor Cyan
Invoke-Compose @("down", "-v", "--remove-orphans")

if (-not $SkipPrune) {
  Write-Host "Pruning Docker system (images/containers)..." -ForegroundColor Cyan
  & docker system prune -a -f
  if ($LASTEXITCODE -ne 0) {
    throw "Docker system prune failed."
  }
} else {
  Write-Host "Skipping docker system prune (--SkipPrune)." -ForegroundColor Yellow
}

if (-not $SkipFrontendInstall) {
  Assert-CommandExists "npm" "Install Node.js and npm."
  Write-Host "Reinstalling frontend dependencies..." -ForegroundColor Cyan
  Push-Location frontend
  try {
    if (Test-Path node_modules) {
      Remove-Item -Recurse -Force node_modules
    }

    if (Test-Path package-lock.json) {
      & npm ci
    } else {
      & npm install
    }

    if ($LASTEXITCODE -ne 0) {
      throw "Frontend dependency installation failed."
    }
  } finally {
    Pop-Location
  }
} else {
  Write-Host "Skipping frontend dependency installation (--SkipFrontendInstall)." -ForegroundColor Yellow
}

if (-not $SkipBackendBuild) {
  Write-Host "Building backend (skip tests)..." -ForegroundColor Cyan
  Push-Location backend
  try {
    if (Test-Path mvnw.cmd) {
      & .\mvnw.cmd clean package -DskipTests
    }
    elseif (Get-Command mvn -ErrorAction SilentlyContinue) {
      & mvn clean package -DskipTests
    }
    else {
      throw "Maven not found. Install Maven or add Maven Wrapper."
    }

    if ($LASTEXITCODE -ne 0) {
      throw "Backend build failed."
    }
  } finally {
    Pop-Location
  }
} else {
  Write-Host "Skipping backend build (--SkipBackendBuild)." -ForegroundColor Yellow
}

$upArgs = @("up")
if (-not $NoBuild) {
  $upArgs += "--build"
}
if ($Detach) {
  $upArgs += "-d"
}

Write-Host "Starting Docker Compose stack: $($upArgs -join ' ')" -ForegroundColor Cyan
Invoke-Compose $upArgs

Write-Host "Clean and rebuild workflow completed." -ForegroundColor Green
