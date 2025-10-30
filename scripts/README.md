# Scripts Directory

This directory contains all deployment and utility scripts organized by purpose.

## 📁 Directory Structure

### 🚀 Deployment (`deployment/`)
Contains all deployment-related scripts:

#### PowerShell Scripts
- `deploy-backend-railway.ps1` - Deploy backend to Railway (PowerShell)
- `deploy-fixes-to-railway.ps1` - Deploy fixes to Railway (PowerShell)
- `deploy-frontend-railway.ps1` - Deploy frontend to Railway (PowerShell)

#### Bash Scripts
- `deploy-backend-railway.sh` - Deploy backend to Railway (Bash)
- `deploy-frontend-railway.sh` - Deploy frontend to Railway (Bash)
- `deploy-frontend.sh` - General frontend deployment script
- `railway-deploy.sh` - Railway deployment script

### 🛠️ Utilities (`utilities/`)
Contains utility and maintenance scripts:
- `cleanup-for-production.js` - Production cleanup script
- `create-test-customer.js` - Create test customer script
- `quick-test.js` - Quick testing script
- `test-cod-order.js` - Test Cash on Delivery orders
- `test-otp-registration.js` - Test OTP registration process
- `test-railway-endpoints.js` - Test Railway API endpoints

## 🚀 Quick Start

### Deploy to Railway
```bash
# Using PowerShell
./scripts/deployment/deploy-backend-railway.ps1
./scripts/deployment/deploy-frontend-railway.ps1

# Using Bash
./scripts/deployment/deploy-backend-railway.sh
./scripts/deployment/deploy-frontend-railway.sh
```

### Run Utilities
```bash
# Cleanup for production
node scripts/utilities/cleanup-for-production.js

# Test scripts
node scripts/utilities/create-test-customer.js
node scripts/utilities/quick-test.js
node scripts/utilities/test-cod-order.js
node scripts/utilities/test-otp-registration.js
node scripts/utilities/test-railway-endpoints.js
```

## 📋 Script Requirements

- **PowerShell Scripts**: Require PowerShell 5.1+ or PowerShell Core
- **Bash Scripts**: Require Bash shell (Linux/macOS/WSL)
- **Node.js Scripts**: Require Node.js runtime

## 🔧 Configuration

Make sure to configure the following before running deployment scripts:
- Railway CLI is installed and authenticated
- Environment variables are properly set
- Database connections are configured
- SMTP settings are configured

## 📚 Related Documentation

For detailed deployment instructions and troubleshooting, see:
- `../docs/deployment/` - Deployment guides
- `../docs/fixes/` - Common issues and fixes
- `../docs/setup/` - Service setup guides
