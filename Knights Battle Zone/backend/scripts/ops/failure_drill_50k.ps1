Param(
  [int]$RabbitOutageSeconds = 20,
  [int]$JudgeOutageSeconds = 20,
  [int]$MysqlOutageSeconds = 20,
  [int]$HealthTimeoutSeconds = 120
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$resultsDir = Join-Path $repoRoot "backend\scripts\loadtest\results"
New-Item -ItemType Directory -Force -Path $resultsDir | Out-Null

function Wait-ContainerHealthy {
  param(
    [Parameter(Mandatory = $true)][string]$ContainerName,
    [Parameter(Mandatory = $true)][int]$TimeoutSeconds
  )

  $deadline = (Get-Date).AddSeconds([Math]::Max(5, $TimeoutSeconds))
  while ((Get-Date) -lt $deadline) {
    $running = (docker inspect -f "{{.State.Running}}" $ContainerName 2>$null)
    if ($running -ne "true") {
      Start-Sleep -Seconds 2
      continue
    }

    $health = (docker inspect -f "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" $ContainerName 2>$null)
    if ($health -eq "healthy" -or $health -eq "none") {
      return $true
    }
    Start-Sleep -Seconds 2
  }
  return $false
}

function Invoke-Drill {
  param(
    [Parameter(Mandatory = $true)][string]$ContainerName,
    [Parameter(Mandatory = $true)][int]$OutageSeconds,
    [Parameter(Mandatory = $true)][int]$TimeoutSeconds
  )

  $start = Get-Date
  docker stop $ContainerName | Out-Null
  Start-Sleep -Seconds ([Math]::Max(5, $OutageSeconds))
  docker start $ContainerName | Out-Null

  $recovered = Wait-ContainerHealthy -ContainerName $ContainerName -TimeoutSeconds $TimeoutSeconds
  $end = Get-Date
  $mttr = [Math]::Round((New-TimeSpan -Start $start -End $end).TotalSeconds, 2)

  return [PSCustomObject]@{
    container = $ContainerName
    outageSeconds = $OutageSeconds
    recovered = $recovered
    mttrSeconds = $mttr
    startedAt = $start.ToString("o")
    endedAt = $end.ToString("o")
  }
}

Write-Host "Starting 50k failure drills..." -ForegroundColor Cyan
Push-Location $repoRoot
try {
  docker compose ps | Out-Null

  $report = [PSCustomObject]@{
    generatedAt = (Get-Date).ToString("o")
    drills = @()
  }

  $report.drills += Invoke-Drill -ContainerName "contest-rabbitmq" -OutageSeconds $RabbitOutageSeconds -TimeoutSeconds $HealthTimeoutSeconds
  $report.drills += Invoke-Drill -ContainerName "contest-judge" -OutageSeconds $JudgeOutageSeconds -TimeoutSeconds $HealthTimeoutSeconds
  $report.drills += Invoke-Drill -ContainerName "contest-mysql" -OutageSeconds $MysqlOutageSeconds -TimeoutSeconds $HealthTimeoutSeconds

  $allRecovered = ($report.drills | Where-Object { -not $_.recovered }).Count -eq 0
  $report | Add-Member -NotePropertyName "allRecovered" -NotePropertyValue $allRecovered

  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $jsonPath = Join-Path $resultsDir "failure-drill-50k-$stamp.json"
  $mdPath = Join-Path $resultsDir "failure-drill-50k-$stamp.md"

  $report | ConvertTo-Json -Depth 6 | Set-Content -Path $jsonPath -Encoding UTF8

  $lines = @(
    "# Failure Drill 50K Report"
    ""
    "Generated: $($report.generatedAt)"
    ""
    "| Container | Outage (s) | Recovered | MTTR (s) |"
    "|---|---:|---|---:|"
  )
  foreach ($drill in $report.drills) {
    $lines += "| $($drill.container) | $($drill.outageSeconds) | $($drill.recovered) | $($drill.mttrSeconds) |"
  }
  $lines += ""
  $lines += "Overall recovered: $($report.allRecovered)"
  $lines | Set-Content -Path $mdPath -Encoding UTF8

  Write-Host "Failure drill report generated:"
  Write-Host "  $jsonPath"
  Write-Host "  $mdPath"
  if (-not $allRecovered) {
    throw "One or more drills failed recovery checks."
  }
}
finally {
  Pop-Location
}
