param(
  [switch]$VerboseReport
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$rootGit = Join-Path $repoRoot ".git"

function Write-Status([string]$status, [string]$message) {
  Write-Host "[$status] $message"
}

function Test-GitRepository([string]$path) {
  try {
    git -C $path rev-parse --is-inside-work-tree *> $null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

$nestedGitDirs = @(Get-ChildItem -Path $repoRoot -Recurse -Directory -Force -Filter ".git" |
  Where-Object { $_.FullName -ne $rootGit })

$isRootRepo = Test-GitRepository $repoRoot

if ($isRootRepo) {
  Write-Status "PASS" "Root repository detected: $repoRoot"
} else {
  Write-Status "WARN" "Root is not a Git repository: $repoRoot"
}

if ($nestedGitDirs.Count -eq 0) {
  Write-Status "PASS" "No nested .git directories detected."
  exit 0
}

Write-Status "WARN" "Nested Git directories found:"
$nestedGitDirs | ForEach-Object { Write-Host " - $($_.FullName)" }

if (-not $isRootRepo -and $nestedGitDirs.Count -eq 1 -and $nestedGitDirs[0].FullName -eq (Join-Path $repoRoot "backend\.git")) {
  Write-Status "FAIL" "Repository is backend-only; monorepo root is unmanaged by Git."
  Write-Host "Recommended next steps:"
  Write-Host "  1) Keep backend-only repo intentionally: git -C `"$repoRoot\\backend`" <command>"
  Write-Host "  2) Or make root canonical: git -C `"$repoRoot`" init"
  Write-Host "  3) After choosing a model, update CI to use the same repo root."
  exit 1
}

if ($VerboseReport) {
  foreach ($gitDir in $nestedGitDirs) {
    $owner = Split-Path -Parent $gitDir.FullName
    if (Test-GitRepository $owner) {
      $branch = (git -C $owner rev-parse --abbrev-ref HEAD 2>$null | Out-String).Trim()
      if ([string]::IsNullOrWhiteSpace($branch)) { $branch = "unknown" }
      Write-Host "   repo: $owner | branch: $branch"
    }
  }
}

Write-Status "FAIL" "Git topology is split (root + nested repos). Decide canonical repo root before CI release."
exit 1
