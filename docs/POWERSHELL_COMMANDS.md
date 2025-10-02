# PowerShell Commands Guide

Since you're using PowerShell (which doesn't support the `&&` operator), use these commands instead:

## Starting the Backend Server

```powershell
# Navigate to backend directory
cd backend

# Start the server
npm start
```

## Starting the Frontend Application

Open a **new PowerShell window** and run:

```powershell
# Navigate to frontend directory
cd frontend

# Start the React application
npm start
```

## Alternative: Using Command Prompt

If you prefer to use Command Prompt (cmd), you can use the `&&` operator:

```cmd
# For backend
cd backend && npm start

# For frontend (in a new window)
cd frontend && npm start
```

## Running Both Simultaneously

### Option 1: Two Separate PowerShell Windows

1. Open first PowerShell window → `cd backend` → `npm start`
2. Open second PowerShell window → `cd frontend` → `npm start`

### Option 2: Using PowerShell Jobs

```powershell
# Start backend in background
Start-Job -ScriptBlock { cd backend; npm start }

# Start frontend in current window
cd frontend
npm start
```

### Option 3: Using Windows Terminal (Recommended)

If you have Windows Terminal installed, you can open multiple tabs:

1. Open Windows Terminal
2. Press `Ctrl+Shift+T` to open a new tab
3. In first tab: `cd backend` → `npm start`
4. In second tab: `cd frontend` → `npm start`

## Testing the Application

After both servers are running:

1. **Backend**: Should be running on `http://localhost:5000`
2. **Frontend**: Should be running on `http://localhost:3000`
3. **Database**: Make sure your SQL Server is running

## Troubleshooting

### If you get permission errors:

```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### If npm commands don't work:

```powershell
# Check if Node.js is installed
node --version
npm --version

# If not installed, download from: https://nodejs.org/
```

### If ports are already in use:

```powershell
# Check what's using port 5000
netstat -ano | findstr :5000

# Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process if needed (replace PID with actual process ID)
taskkill /PID <PID> /F
```

## Quick Start Script

You can create a PowerShell script to start both servers:

```powershell
# Create a file called start-servers.ps1
@"
Write-Host "Starting DesignXcel servers..." -ForegroundColor Green

# Start backend
Start-Job -ScriptBlock {
    Set-Location backend
    npm start
}

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend
Set-Location frontend
npm start
"@ | Out-File -FilePath "start-servers.ps1" -Encoding UTF8

# Run the script
.\start-servers.ps1
```

## Environment Setup

Make sure you have the required environment variables set:

```powershell
# Check if .env file exists in backend
Get-Content backend\.env

# If it doesn't exist, create one with your database settings
@"
DB_USER=your_username
DB_PASSWORD=your_password
DB_SERVER=localhost
DB_NAME=DesignXcelDB
PORT=5000
"@ | Out-File -FilePath "backend\.env" -Encoding UTF8
```

## Database Connection Test

To test if your database connection is working:

```powershell
# Navigate to project root
cd ..

# Run the database test
node test-reviews-setup.js
```

This should show you if the database schema is properly set up and if the connection is working.
