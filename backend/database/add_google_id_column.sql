-- Add GoogleId column to Customers table for Google OAuth integration
-- This script adds support for Google sign-in functionality

-- Check if GoogleId column already exists before adding it
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'GoogleId')
BEGIN
    ALTER TABLE Customers 
    ADD GoogleId NVARCHAR(255) NULL;
    
    PRINT 'GoogleId column added to Customers table successfully';
END
ELSE
BEGIN
    PRINT 'GoogleId column already exists in Customers table';
END

-- Add index on GoogleId for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes 
               WHERE name = 'IX_Customers_GoogleId' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE INDEX IX_Customers_GoogleId ON Customers(GoogleId);
    PRINT 'Index IX_Customers_GoogleId created successfully';
END
ELSE
BEGIN
    PRINT 'Index IX_Customers_GoogleId already exists';
END

-- Add EmailVerified column if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'EmailVerified')
BEGIN
    ALTER TABLE Customers 
    ADD EmailVerified BIT NOT NULL DEFAULT 0;
    
    PRINT 'EmailVerified column added to Customers table successfully';
END
ELSE
BEGIN
    PRINT 'EmailVerified column already exists in Customers table';
END

-- Update existing customers to have EmailVerified = 1 if they have a password hash
UPDATE Customers 
SET EmailVerified = 1 
WHERE PasswordHash IS NOT NULL AND EmailVerified = 0;

PRINT 'Database migration completed successfully for Google OAuth integration';
