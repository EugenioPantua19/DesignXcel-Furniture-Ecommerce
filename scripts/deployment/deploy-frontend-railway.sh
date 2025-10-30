#!/bin/bash

# Deploy Frontend to Railway
# This script ensures we deploy from the frontend directory

echo "🚀 Deploying DesignXcel Frontend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please login first:"
    echo "   railway login"
    exit 1
fi

echo "✅ Railway CLI found and logged in"

# Navigate to frontend directory
echo "📁 Navigating to frontend directory..."
cd frontend

# Deploy from frontend directory
echo "🚀 Deploying from frontend directory..."
railway up

echo "✅ Deployment initiated from frontend directory!"
