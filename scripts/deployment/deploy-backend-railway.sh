#!/bin/bash

# Deploy Backend to Railway
# This script deploys the backend to a separate Railway project

echo "🚀 Deploying DesignXcel Backend to Railway..."

# Navigate to backend directory
cd backend

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please login first:"
    echo "railway login"
    exit 1
fi

# Deploy to Railway
echo "📦 Deploying backend to Railway..."
railway up

echo "✅ Backend deployment initiated!"
echo "🔗 Check your Railway dashboard for deployment status"
echo "📝 Note: You'll need to set up environment variables in Railway dashboard"
