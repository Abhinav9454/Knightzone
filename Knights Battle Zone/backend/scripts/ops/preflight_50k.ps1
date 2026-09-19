param(
    [string]$ProjectRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[preflight] $Message"
}

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )
    if (-not $Condition) {
        throw $Message
    }
}

Write-Step "Using project root: $ProjectRoot"

$envFile = Join-Path $ProjectRoot ".env"
Assert-True (Test-Path $envFile) ".env file is missing at $envFile"

$requiredKeys = @(
    "JWT_SECRET",
    "TRACKER_TOKEN_SECRET",
    "JUDGE_INTERNAL_TOKEN",
    "MYSQL_DATABASE",
    "MYSQL_USER",
    "MYSQL_PASSWORD",
    "MYSQL_ROOT_PASSWORD",
    "CORS_ALLOWED_ORIGINS"
)

$raw = Get-Content $envFile
$pairs = @{}
foreach ($line in $raw) {
    if ($line -match "^\s*#" -or $line -notmatch "=") { continue }
    $parts = $line.Split("=", 2)
    if ($parts.Count -eq 2) {
        $pairs[$parts[0].Trim()] = $parts[1].Trim()
    }
}

foreach ($key in $requiredKeys) {
    Assert-True ($pairs.ContainsKey($key)) "Missing required key in .env: $key"
    Assert-True (-not [string]::IsNullOrWhiteSpace($pairs[$key])) "Empty required key in .env: $key"
}

Write-Step "Validating docker compose syntax"
Push-Location $ProjectRoot
try {
    docker compose config -q | Out-Null
} finally {
    Pop-Location
}

Write-Step "Preflight checks passed for 50k phase baseline."
