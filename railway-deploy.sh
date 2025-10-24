#!/bin/bash

# Railway Docker Deployment Script
echo "🚀 Deploying to Railway using Docker..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

# Link to project (if not already linked)
echo "🔗 Linking to Railway project..."
railway link

# Deploy using Docker
echo "🐳 Deploying with Docker..."
railway up

echo "✅ Deployment complete!"
