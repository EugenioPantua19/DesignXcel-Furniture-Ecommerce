#!/bin/bash

# Railway Frontend Deployment Script
# This script ensures proper environment variable setup for Railway deployment

echo "🚀 Starting Railway Frontend Deployment..."

# Set environment variables for Railway
export REACT_APP_API_URL="https://designexcellinventory-production.up.railway.app"
export REACT_APP_ENVIRONMENT="production"
export REACT_APP_STRIPE_PUBLISHABLE_KEY="pk_test_51RCLlxPoc51pdmcaSH32LZIiLHJjHEmEkm3csrujxIKBcNa6gb6DG1KblYrBsRqtmWS5syIj9mT5P4UgWsprmQv500cFgYV6Sw"
export REACT_APP_APP_NAME="DesignXcel"
export REACT_APP_VERSION="1.0.0"
export REACT_APP_STRIPE_CURRENCY="PHP"
export REACT_APP_STRIPE_COUNTRY="PH"
export GENERATE_SOURCEMAP="false"
export FAST_REFRESH="false"
export CHOKIDAR_USEPOLLING="false"
export WATCHPACK_POLLING="false"
export REACT_APP_ENABLE_ANALYTICS="false"
export REACT_APP_ENABLE_ERROR_REPORTING="true"
export REACT_APP_ENABLE_PERFORMANCE_MONITORING="true"
export REACT_APP_ENABLE_HTTPS_ONLY="true"
export REACT_APP_ENABLE_CSP="true"
export REACT_APP_ENABLE_CODE_SPLITTING="true"
export REACT_APP_ENABLE_LAZY_LOADING="true"
export REACT_APP_ENABLE_SERVICE_WORKER="true"
export REACT_APP_DEBUG="false"
export REACT_APP_LOG_LEVEL="error"

echo "✅ Environment variables set for production"

# Copy Railway environment file to production
if [ -f ".env.railway" ]; then
    cp .env.railway .env.production
    echo "✅ Copied .env.railway to .env.production"
else
    echo "⚠️ .env.railway not found, using existing .env.production"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building application..."
npm run build

# Verify build
if [ -d "build" ]; then
    echo "✅ Build completed successfully"
    echo "📁 Build directory contents:"
    ls -la build/
else
    echo "❌ Build failed - no build directory found"
    exit 1
fi

# Check if API URL is in the built files
echo "🔍 Checking if API URL is properly embedded in build..."
if grep -r "designexcellinventory-production" build/static/js/ > /dev/null 2>&1; then
    echo "✅ API URL found in built files"
else
    echo "⚠️ API URL not found in built files - this might cause connection issues"
fi

echo "🎉 Railway Frontend Deployment preparation complete!"
echo "📋 Next steps:"
echo "   1. Deploy to Railway"
echo "   2. Verify environment variables are set in Railway dashboard"
echo "   3. Test API connectivity from deployed frontend"
