# PowerShell script to deploy fixes to Railway
# This script deploys the COD and OTP fixes to Railway

Write-Host "🚀 Deploying fixes to Railway..." -ForegroundColor Green

# Navigate to backend directory
Set-Location "backend"

Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check if Railway CLI is installed
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI found: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g @railway/cli" -ForegroundColor Yellow
    Write-Host "   Then run: railway login" -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Railway
try {
    $railwayStatus = railway whoami
    Write-Host "✅ Logged in to Railway as: $railwayStatus" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Railway. Please run: railway login" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Deploying backend fixes..." -ForegroundColor Yellow

# Deploy to Railway
try {
    railway up --detach
    Write-Host "✅ Backend deployment initiated successfully!" -ForegroundColor Green
    Write-Host "📋 Deployment URL: https://designexcellinventory-production.up.railway.app" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "🧪 Testing deployed endpoints..." -ForegroundColor Yellow

# Test the deployed endpoints
try {
    $healthResponse = Invoke-WebRequest -Uri "https://designexcellinventory-production.up.railway.app/api/health" -Method GET
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Server is running and healthy!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Server health check failed, but deployment may still be in progress" -ForegroundColor Yellow
}

Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Wait 2-3 minutes for deployment to fully complete" -ForegroundColor White
Write-Host "   2. Test COD order creation" -ForegroundColor White
Write-Host "   3. Test OTP email sending" -ForegroundColor White
Write-Host "   4. Check Railway logs if issues persist" -ForegroundColor White

# Return to original directory
Set-Location ".."
