# Railway Frontend Deployment Script (PowerShell)
# This script ensures proper environment variable setup for Railway deployment

Write-Host "🚀 Starting Railway Frontend Deployment..." -ForegroundColor Green

# Set environment variables for Railway
$env:REACT_APP_API_URL = "https://designexcellinventory-production.up.railway.app"
$env:REACT_APP_ENVIRONMENT = "production"
$env:REACT_APP_STRIPE_PUBLISHABLE_KEY = "pk_test_51RCLlxPoc51pdmcaSH32LZIiLHJjHEmEkm3csrujxIKBcNa6gb6DG1KblYrBsRqtmWS5syIj9mT5P4UgWsprmQv500cFgYV6Sw"
$env:REACT_APP_APP_NAME = "DesignXcel"
$env:REACT_APP_VERSION = "1.0.0"
$env:REACT_APP_STRIPE_CURRENCY = "PHP"
$env:REACT_APP_STRIPE_COUNTRY = "PH"
$env:GENERATE_SOURCEMAP = "false"
$env:FAST_REFRESH = "false"
$env:CHOKIDAR_USEPOLLING = "false"
$env:WATCHPACK_POLLING = "false"
$env:REACT_APP_ENABLE_ANALYTICS = "false"
$env:REACT_APP_ENABLE_ERROR_REPORTING = "true"
$env:REACT_APP_ENABLE_PERFORMANCE_MONITORING = "true"
$env:REACT_APP_ENABLE_HTTPS_ONLY = "true"
$env:REACT_APP_ENABLE_CSP = "true"
$env:REACT_APP_ENABLE_CODE_SPLITTING = "true"
$env:REACT_APP_ENABLE_LAZY_LOADING = "true"
$env:REACT_APP_ENABLE_SERVICE_WORKER = "true"
$env:REACT_APP_DEBUG = "false"
$env:REACT_APP_LOG_LEVEL = "error"

Write-Host "✅ Environment variables set for production" -ForegroundColor Green

# Copy Railway environment file to production
if (Test-Path ".env.railway") {
    Copy-Item ".env.railway" ".env.production" -Force
    Write-Host "✅ Copied .env.railway to .env.production" -ForegroundColor Green
} else {
    Write-Host "⚠️ .env.railway not found, using existing .env.production" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm ci

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Blue
npm run build

# Verify build
if (Test-Path "build") {
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
    Write-Host "📁 Build directory contents:" -ForegroundColor Blue
    Get-ChildItem build/ | Format-Table
} else {
    Write-Host "❌ Build failed - no build directory found" -ForegroundColor Red
    exit 1
}

# Check if API URL is in the built files
Write-Host "🔍 Checking if API URL is properly embedded in build..." -ForegroundColor Blue
$jsFiles = Get-ChildItem "build/static/js/*.js" -Recurse
$found = $false
foreach ($file in $jsFiles) {
    if ((Get-Content $file.FullName -Raw) -match "designexcellinventory-production") {
        $found = $true
        break
    }
}

if ($found) {
    Write-Host "✅ API URL found in built files" -ForegroundColor Green
} else {
    Write-Host "⚠️ API URL not found in built files - this might cause connection issues" -ForegroundColor Yellow
}

Write-Host "🎉 Railway Frontend Deployment preparation complete!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Blue
Write-Host "   1. Deploy to Railway" -ForegroundColor White
Write-Host "   2. Verify environment variables are set in Railway dashboard" -ForegroundColor White
Write-Host "   3. Test API connectivity from deployed frontend" -ForegroundColor White
