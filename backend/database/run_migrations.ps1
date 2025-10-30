# Database Migration Script
# This script runs SQL migrations to create tables and add columns

param(
    [string]$Server = "DESKTOP-F4OI6BT\SQLEXPRESS",
    [string]$Database = "DesignXcellDB",
    [string]$Username = "DesignXcel",
    [string]$Password = "Azwrathfrozen22@"
)

# Import SQL Server module (if available)
Import-Module SqlServer -ErrorAction SilentlyContinue

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Migration Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server: $Server" -ForegroundColor Yellow
Write-Host "Database: $Database" -ForegroundColor Yellow
Write-Host ""

# SQL Server connection string
$connectionString = "Server=$Server;Database=$Database;User Id=$Username;Password=$Password;TrustServerCertificate=True;"

# Function to execute SQL script
function Execute-SqlScript {
    param(
        [string]$ScriptPath,
        [string]$Description
    )
    
    Write-Host "----------------------------------------" -ForegroundColor Green
    Write-Host "Executing: $Description" -ForegroundColor Green
    Write-Host "Script: $ScriptPath" -ForegroundColor Gray
    
    if (-not (Test-Path $ScriptPath)) {
        Write-Host "ERROR: Script not found: $ScriptPath" -ForegroundColor Red
        return $false
    }
    
    try {
        $sqlScript = Get-Content $ScriptPath -Raw
        
        # Execute SQL using sqlcmd
        $result = sqlcmd -S $Server -d $Database -U $Username -P $Password -Q $sqlScript 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: $Description completed" -ForegroundColor Green
            return $true
        } else {
            Write-Host "ERROR executing script:" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "ERROR: Failed to execute script" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
}

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Migration scripts to run
$migrations = @(
    @{
        Path = Join-Path $scriptDir "create_otpverification_table.sql"
        Description = "Create OTPVerification table"
    },
    @{
        Path = Join-Path $scriptDir "create_customer_delete_otp_table.sql"
        Description = "Create CustomerDeleteOTP table"
    },
    @{
        Path = Join-Path $scriptDir "add_product_columns.sql"
        Description = "Add PublicId, Slug, and SKU columns to Products table"
    }
)

# Track results
$successCount = 0
$failCount = 0

# Execute migrations
foreach ($migration in $migrations) {
    if (Execute-SqlScript -ScriptPath $migration.Path -Description $migration.Description) {
        $successCount++
    } else {
        $failCount++
    }
    Start-Sleep -Seconds 1
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Success: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "All migrations completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some migrations failed. Please check the errors above." -ForegroundColor Red
    exit 1
}
