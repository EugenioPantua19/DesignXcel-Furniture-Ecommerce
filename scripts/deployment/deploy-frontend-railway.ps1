# Deploy Frontend to Railway
# This script ensures we deploy from the frontend directory

Write-Host "🚀 Deploying DesignXcel Frontend to Railway..." -ForegroundColor Green

# Check if Railway CLI is installed
try {
    $null = Get-Command railway -ErrorAction Stop
    Write-Host "✅ Railway CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    $null = railway whoami 2>$null
    Write-Host "✅ Logged in to Railway" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Railway. Please login first:" -ForegroundColor Red
    Write-Host "   railway login" -ForegroundColor Yellow
    exit 1
}

# Navigate to frontend directory
Write-Host "📁 Navigating to frontend directory..." -ForegroundColor Cyan
Set-Location frontend

# Deploy from frontend directory
Write-Host "🚀 Deploying from frontend directory..." -ForegroundColor Cyan
railway up

Write-Host "✅ Deployment initiated from frontend directory!" -ForegroundColor Green
