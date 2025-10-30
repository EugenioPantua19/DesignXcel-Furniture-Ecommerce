# Database Migration Script for Product Security Enhancement (PowerShell)
# This script adds UUID, Slug, and SKU columns to the Products table

Write-Host "Starting Product Security Migration..." -ForegroundColor Green

# Database connection details (updated with your actual values)
$DB_SERVER = "designxcell-server.database.windows.net"
$DB_NAME = "DesignXcellDB"
$DB_USER = "designxcell"
$DB_PASSWORD = "Azwrath22@"

Write-Host "Connecting to database: $DB_NAME" -ForegroundColor Yellow

# Run the migration SQL file
try {
    sqlcmd -S $DB_SERVER -d $DB_NAME -U $DB_USER -P $DB_PASSWORD -i "backend\database\add_product_security_columns_fixed.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host "✅ Added PublicId, Slug, and SKU columns to Products table" -ForegroundColor Green
        Write-Host "✅ Created necessary indexes and constraints" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Update your application to use the new public identifiers" -ForegroundColor White
        Write-Host "2. Test the new slug-based URLs" -ForegroundColor White
        Write-Host "3. Verify that product IDs are no longer exposed in the UI" -ForegroundColor White
    } else {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host "Please check the error messages above and fix any issues." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running migration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Migration script completed." -ForegroundColor Green
