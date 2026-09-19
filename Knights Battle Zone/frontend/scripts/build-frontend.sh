#!/bin/bash

# Frontend Build Script
# Professional build with optimizations and verification

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$FRONTEND_ROOT"

echo "🚀 Starting Professional Frontend Build Process..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check Node environment
echo -e "${BLUE}[1/6]${NC} Checking Node.js environment..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓${NC} Node.js version: $NODE_VERSION"
echo -e "${GREEN}✓${NC} npm version: $NPM_VERSION"
echo ""

# Step 2: Verify environment configuration
echo -e "${BLUE}[2/6]${NC} Checking environment configuration..."
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠${NC} No .env file found. Using defaults."
    echo -e "${YELLOW}⚠${NC} Copy .env.example to .env.local and configure as needed."
fi
echo ""

# Step 3: Clean previous build
echo -e "${BLUE}[3/6]${NC} Cleaning previous artifacts..."
rm -rf dist node_modules/.vite
echo -e "${GREEN}✓${NC} Cleaned dist and cache"
echo ""

# Step 4: Install dependencies
echo -e "${BLUE}[4/6]${NC} Installing dependencies..."
npm ci --no-audit --no-fund
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Step 5: Type checking
echo -e "${BLUE}[5/6]${NC} Running TypeScript type checking..."
if npx tsc --noEmit; then
    echo -e "${GREEN}✓${NC} Type checking passed"
else
    echo -e "${RED}❌ Type checking failed${NC}"
    exit 1
fi
echo ""

# Step 6: Production build
echo -e "${BLUE}[6/6]${NC} Building for production..."
npm run build
echo -e "${GREEN}✓${NC} Production build completed"
echo ""

# Summary
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ Build completed successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Build output directory: ./dist"
echo "Build ready for deployment"
echo ""

# Display build statistics
if [ -d "dist" ]; then
    TOTAL_SIZE=$(du -sh dist | cut -f1)
    echo -e "Total size: ${YELLOW}$TOTAL_SIZE${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review build artifacts: npm run preview"
    echo "  2. Deploy to production: docker build -f Dockerfile.prod -t frontend:latest ."
    echo "  3. Push to registry if needed"
    echo ""
fi
