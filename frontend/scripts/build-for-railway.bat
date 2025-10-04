@echo off
echo Building React app for production...

REM Set environment variables
set REACT_APP_ENVIRONMENT=production
set GENERATE_SOURCEMAP=false

REM Install dependencies
echo Installing dependencies...
npm ci

REM Build the application
echo Building application...
npm run build

REM Install serve globally for production serving
echo Installing serve...
npm install -g serve

echo Build completed successfully!
