# Deploy Backend to Railway (PowerShell)
# This script deploys the backend to a separate Railway project

Write-Host "🚀 Deploying DesignXcel Backend to Railway..." -ForegroundColor Green

# Navigate to backend directory
Set-Location backend

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
} catch {
    Write-Host "❌ Railway CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    railway whoami | Out-Null
} catch {
    Write-Host "❌ Not logged in to Railway. Please login first:" -ForegroundColor Red
    Write-Host "railway login" -ForegroundColor Yellow
    exit 1
}

# Deploy to Railway
Write-Host "📦 Deploying backend to Railway..." -ForegroundColor Blue
railway up

Write-Host "✅ Backend deployment initiated!" -ForegroundColor Green
Write-Host "🔗 Check your Railway dashboard for deployment status" -ForegroundColor Cyan
Write-Host "📝 Note: You'll need to set up environment variables in Railway dashboard" -ForegroundColor Yellow
