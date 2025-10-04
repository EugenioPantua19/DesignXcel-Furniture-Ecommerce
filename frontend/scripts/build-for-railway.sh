#!/bin/bash

# Build script for Railway deployment
echo "Building React app for production..."

# Set environment variables
export REACT_APP_ENVIRONMENT=production
export GENERATE_SOURCEMAP=false

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the application
echo "Building application..."
npm run build

# Install serve globally for production serving
echo "Installing serve..."
npm install -g serve

echo "Build completed successfully!"
