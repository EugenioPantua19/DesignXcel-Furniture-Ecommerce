#!/bin/bash

# Deploy frontend to Railway
echo "🚀 Deploying DesignXcel Frontend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

# Change to frontend directory
echo "📁 Changing to frontend directory..."
cd frontend

# Link to project (if not already linked)
echo "🔗 Linking to Railway project..."
railway link

# Deploy from frontend directory
echo "🐳 Deploying frontend..."
railway up

echo "✅ Frontend deployment complete!"
