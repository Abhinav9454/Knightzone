# Frontend Build Script - PowerShell Version
# Professional build with optimizations and verification

$ErrorActionPreference = "Stop"
$frontendRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location -Path $frontendRoot

Write-Host "🚀 Starting Professional Frontend Build Process..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node environment
Write-Host "[1/6] Checking Node.js environment..." -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    exit 1
}

$nodeVersion = node -v
$npmVersion = npm -v
Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Step 2: Verify environment configuration
Write-Host "[2/6] Checking environment configuration..." -ForegroundColor Cyan
if (-not (Test-Path ".env.local") -and -not (Test-Path ".env")) {
    Write-Host "⚠ No .env file found. Using defaults." -ForegroundColor Yellow
    Write-Host "⚠ Copy .env.example to .env.local and configure as needed." -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Clean previous build
Write-Host "[3/6] Cleaning previous artifacts..." -ForegroundColor Cyan
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite" -ErrorAction SilentlyContinue
}
Write-Host "✓ Cleaned dist and cache" -ForegroundColor Green
Write-Host ""

# Step 4: Install dependencies
Write-Host "[4/6] Installing dependencies..." -ForegroundColor Cyan
npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dependency installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 5: Type checking
Write-Host "[5/6] Running TypeScript type checking..." -ForegroundColor Cyan
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Type checking failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Type checking passed" -ForegroundColor Green
Write-Host ""

# Step 6: Production build
Write-Host "[6/6] Building for production..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Production build completed" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Green
Write-Host "✓ Build completed successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Build output directory: ./dist"
Write-Host "Build ready for deployment"
Write-Host ""

# Display build statistics
if (Test-Path "dist") {
    $totalSize = (Get-ChildItem "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Total size: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review build artifacts: npm run preview"
    Write-Host "  2. Deploy to production: docker build -f Dockerfile.prod -t frontend:latest ."
    Write-Host "  3. Push to registry if needed"
    Write-Host ""
}
