#!/bin/bash

# Database Migration Script for Product Security Enhancement
# This script adds UUID, Slug, and SKU columns to the Products table

echo "Starting Product Security Migration..."

# Database connection details (updated with your actual values)
DB_SERVER="designxcell-server.database.windows.net"
DB_NAME="DesignXcellDB"
DB_USER="designxcell"
DB_PASSWORD="Azwrath22@"

# SQL Server connection string
CONNECTION_STRING="Server=$DB_SERVER;Database=$DB_NAME;User Id=$DB_USER;Password=$DB_PASSWORD;TrustServerCertificate=true;"

echo "Connecting to database: $DB_NAME"

# Run the migration SQL file
sqlcmd -S "$DB_SERVER" -d "$DB_NAME" -U "$DB_USER" -P "$DB_PASSWORD" -i "backend/database/add_product_security_columns.sql"

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo "✅ Added PublicId, Slug, and SKU columns to Products table"
    echo "✅ Created necessary indexes and constraints"
    echo ""
    echo "Next steps:"
    echo "1. Update your application to use the new public identifiers"
    echo "2. Test the new slug-based URLs"
    echo "3. Verify that product IDs are no longer exposed in the UI"
else
    echo "❌ Migration failed!"
    echo "Please check the error messages above and fix any issues."
    exit 1
fi

echo ""
echo "Migration script completed."
