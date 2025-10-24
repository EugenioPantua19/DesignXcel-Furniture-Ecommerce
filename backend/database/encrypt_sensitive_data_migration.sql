-- =============================================================================
-- DATABASE ENCRYPTION MIGRATION SCRIPT
-- =============================================================================
-- This script adds encrypted columns (NVARCHAR(512)) to existing tables
-- and migrates existing sensitive data to encrypted format
-- 
-- IMPORTANT: Run this script during maintenance window
-- BACKUP YOUR DATABASE BEFORE RUNNING THIS SCRIPT
-- =============================================================================

PRINT 'Starting database encryption migration...';
PRINT 'Timestamp: ' + CONVERT(VARCHAR(25), GETDATE(), 120);

-- =============================================================================
-- 1. ADD ENCRYPTED COLUMNS TO USERS TABLE
-- =============================================================================

PRINT 'Adding encrypted columns to Users table...';

-- Add encrypted email column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'EmailEncrypted')
BEGIN
    ALTER TABLE Users 
    ADD EmailEncrypted NVARCHAR(512) NULL;
    PRINT 'EmailEncrypted column added to Users table';
END
ELSE
BEGIN
    PRINT 'EmailEncrypted column already exists in Users table';
END

-- Add email search hash column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'EmailSearchHash')
BEGIN
    ALTER TABLE Users 
    ADD EmailSearchHash NVARCHAR(512) NULL;
    PRINT 'EmailSearchHash column added to Users table';
END
ELSE
BEGIN
    PRINT 'EmailSearchHash column already exists in Users table';
END

-- Add encrypted full name column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'FullNameEncrypted')
BEGIN
    ALTER TABLE Users 
    ADD FullNameEncrypted NVARCHAR(512) NULL;
    PRINT 'FullNameEncrypted column added to Users table';
END
ELSE
BEGIN
    PRINT 'FullNameEncrypted column already exists in Users table';
END

-- Add full name search hash column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'FullNameSearchHash')
BEGIN
    ALTER TABLE Users 
    ADD FullNameSearchHash NVARCHAR(512) NULL;
    PRINT 'FullNameSearchHash column added to Users table';
END
ELSE
BEGIN
    PRINT 'FullNameSearchHash column already exists in Users table';
END

-- Add encrypted phone number column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'PhoneNumberEncrypted')
BEGIN
    ALTER TABLE Users 
    ADD PhoneNumberEncrypted NVARCHAR(512) NULL;
    PRINT 'PhoneNumberEncrypted column added to Users table';
END
ELSE
BEGIN
    PRINT 'PhoneNumberEncrypted column already exists in Users table';
END

-- Add UpdatedAt column if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'UpdatedAt')
BEGIN
    ALTER TABLE Users 
    ADD UpdatedAt DATETIME NULL;
    PRINT 'UpdatedAt column added to Users table';
END
ELSE
BEGIN
    PRINT 'UpdatedAt column already exists in Users table';
END

-- =============================================================================
-- 2. ADD ENCRYPTED COLUMNS TO CUSTOMERS TABLE
-- =============================================================================

PRINT 'Adding encrypted columns to Customers table...';

-- Add encrypted email column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'EmailEncrypted')
BEGIN
    ALTER TABLE Customers 
    ADD EmailEncrypted NVARCHAR(512) NULL;
    PRINT 'EmailEncrypted column added to Customers table';
END
ELSE
BEGIN
    PRINT 'EmailEncrypted column already exists in Customers table';
END

-- Add email search hash column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'EmailSearchHash')
BEGIN
    ALTER TABLE Customers 
    ADD EmailSearchHash NVARCHAR(512) NULL;
    PRINT 'EmailSearchHash column added to Customers table';
END
ELSE
BEGIN
    PRINT 'EmailSearchHash column already exists in Customers table';
END

-- Add encrypted full name column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'FullNameEncrypted')
BEGIN
    ALTER TABLE Customers 
    ADD FullNameEncrypted NVARCHAR(512) NULL;
    PRINT 'FullNameEncrypted column added to Customers table';
END
ELSE
BEGIN
    PRINT 'FullNameEncrypted column already exists in Customers table';
END

-- Add full name search hash column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'FullNameSearchHash')
BEGIN
    ALTER TABLE Customers 
    ADD FullNameSearchHash NVARCHAR(512) NULL;
    PRINT 'FullNameSearchHash column added to Customers table';
END
ELSE
BEGIN
    PRINT 'FullNameSearchHash column already exists in Customers table';
END

-- Add encrypted phone number column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'PhoneNumberEncrypted')
BEGIN
    ALTER TABLE Customers 
    ADD PhoneNumberEncrypted NVARCHAR(512) NULL;
    PRINT 'PhoneNumberEncrypted column added to Customers table';
END
ELSE
BEGIN
    PRINT 'PhoneNumberEncrypted column already exists in Customers table';
END

-- Add encrypted date of birth column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'DateOfBirthEncrypted')
BEGIN
    ALTER TABLE Customers 
    ADD DateOfBirthEncrypted NVARCHAR(512) NULL;
    PRINT 'DateOfBirthEncrypted column added to Customers table';
END
ELSE
BEGIN
    PRINT 'DateOfBirthEncrypted column already exists in Customers table';
END

-- Add UpdatedAt column if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'UpdatedAt')
BEGIN
    ALTER TABLE Customers 
    ADD UpdatedAt DATETIME NULL;
    PRINT 'UpdatedAt column added to Customers table';
END
ELSE
BEGIN
    PRINT 'UpdatedAt column already exists in Customers table';
END

-- =============================================================================
-- 3. ADD ENCRYPTED COLUMNS TO CUSTOMERADDRESSES TABLE
-- =============================================================================

PRINT 'Adding encrypted columns to CustomerAddresses table...';

-- Add encrypted house number column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'HouseNumberEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses 
    ADD HouseNumberEncrypted NVARCHAR(512) NULL;
    PRINT 'HouseNumberEncrypted column added to CustomerAddresses table';
END
ELSE
BEGIN
    PRINT 'HouseNumberEncrypted column already exists in CustomerAddresses table';
END

-- Add encrypted street column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'StreetEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses 
    ADD StreetEncrypted NVARCHAR(512) NULL;
    PRINT 'StreetEncrypted column added to CustomerAddresses table';
END
ELSE
BEGIN
    PRINT 'StreetEncrypted column already exists in CustomerAddresses table';
END

-- Add encrypted barangay column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'BarangayEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses 
    ADD BarangayEncrypted NVARCHAR(512) NULL;
    PRINT 'BarangayEncrypted column added to CustomerAddresses table';
END
ELSE
BEGIN
    PRINT 'BarangayEncrypted column already exists in CustomerAddresses table';
END

-- Add encrypted city column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'CityEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses 
    ADD CityEncrypted NVARCHAR(512) NULL;
    PRINT 'CityEncrypted column added to CustomerAddresses table';
END
ELSE
BEGIN
    PRINT 'CityEncrypted column already exists in CustomerAddresses table';
END

-- Add city search hash column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'CitySearchHash')
BEGIN
    ALTER TABLE CustomerAddresses 
    ADD CitySearchHash NVARCHAR(512) NULL;
    PRINT 'CitySearchHash column added to CustomerAddresses table';
END
ELSE
BEGIN
    PRINT 'CitySearchHash column already exists in CustomerAddresses table';
END

-- Add encrypted province column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'ProvinceEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses 
    ADD ProvinceEncrypted NVARCHAR(512) NULL;
    PRINT 'ProvinceEncrypted column added to CustomerAddresses table';
END
ELSE
BEGIN
    PRINT 'ProvinceEncrypted column already exists in CustomerAddresses table';
END

-- Add province search hash column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'ProvinceSearchHash')
BEGIN
    ALTER TABLE CustomerAddresses 
    ADD ProvinceSearchHash NVARCHAR(512) NULL;
    PRINT 'ProvinceSearchHash column added to CustomerAddresses table';
END
ELSE
BEGIN
    PRINT 'ProvinceSearchHash column already exists in CustomerAddresses table';
END

-- Add encrypted region column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'RegionEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses 
    ADD RegionEncrypted NVARCHAR(512) NULL;
    PRINT 'RegionEncrypted column added to CustomerAddresses table';
END
ELSE
BEGIN
    PRINT 'RegionEncrypted column already exists in CustomerAddresses table';
END

-- Add encrypted postal code column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'PostalCodeEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses 
    ADD PostalCodeEncrypted NVARCHAR(512) NULL;
    PRINT 'PostalCodeEncrypted column added to CustomerAddresses table';
END
ELSE
BEGIN
    PRINT 'PostalCodeEncrypted column already exists in CustomerAddresses table';
END

-- Add CreatedAt column if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'CreatedAt')
BEGIN
    ALTER TABLE CustomerAddresses 
    ADD CreatedAt DATETIME NULL DEFAULT(GETDATE());
    PRINT 'CreatedAt column added to CustomerAddresses table';
END
ELSE
BEGIN
    PRINT 'CreatedAt column already exists in CustomerAddresses table';
END

-- =============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

PRINT 'Creating indexes for encrypted columns...';

-- Users table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes 
               WHERE name = 'IX_Users_EmailSearchHash' AND object_id = OBJECT_ID('Users'))
BEGIN
    CREATE INDEX IX_Users_EmailSearchHash ON Users(EmailSearchHash);
    PRINT 'Index IX_Users_EmailSearchHash created';
END
ELSE
BEGIN
    PRINT 'Index IX_Users_EmailSearchHash already exists';
END

IF NOT EXISTS (SELECT * FROM sys.indexes 
               WHERE name = 'IX_Users_FullNameSearchHash' AND object_id = OBJECT_ID('Users'))
BEGIN
    CREATE INDEX IX_Users_FullNameSearchHash ON Users(FullNameSearchHash);
    PRINT 'Index IX_Users_FullNameSearchHash created';
END
ELSE
BEGIN
    PRINT 'Index IX_Users_FullNameSearchHash already exists';
END

-- Customers table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes 
               WHERE name = 'IX_Customers_EmailSearchHash' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE INDEX IX_Customers_EmailSearchHash ON Customers(EmailSearchHash);
    PRINT 'Index IX_Customers_EmailSearchHash created';
END
ELSE
BEGIN
    PRINT 'Index IX_Customers_EmailSearchHash already exists';
END

IF NOT EXISTS (SELECT * FROM sys.indexes 
               WHERE name = 'IX_Customers_FullNameSearchHash' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE INDEX IX_Customers_FullNameSearchHash ON Customers(FullNameSearchHash);
    PRINT 'Index IX_Customers_FullNameSearchHash created';
END
ELSE
BEGIN
    PRINT 'Index IX_Customers_FullNameSearchHash already exists';
END

-- CustomerAddresses table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes 
               WHERE name = 'IX_CustomerAddresses_CitySearchHash' AND object_id = OBJECT_ID('CustomerAddresses'))
BEGIN
    CREATE INDEX IX_CustomerAddresses_CitySearchHash ON CustomerAddresses(CitySearchHash);
    PRINT 'Index IX_CustomerAddresses_CitySearchHash created';
END
ELSE
BEGIN
    PRINT 'Index IX_CustomerAddresses_CitySearchHash already exists';
END

IF NOT EXISTS (SELECT * FROM sys.indexes 
               WHERE name = 'IX_CustomerAddresses_ProvinceSearchHash' AND object_id = OBJECT_ID('CustomerAddresses'))
BEGIN
    CREATE INDEX IX_CustomerAddresses_ProvinceSearchHash ON CustomerAddresses(ProvinceSearchHash);
    PRINT 'Index IX_CustomerAddresses_ProvinceSearchHash created';
END
ELSE
BEGIN
    PRINT 'Index IX_CustomerAddresses_ProvinceSearchHash already exists';
END

-- =============================================================================
-- 5. VERIFY COLUMN ADDITIONS
-- =============================================================================

PRINT 'Verifying column additions...';

-- Check Users table
SELECT 
    'Users' as TableName,
    COLUMN_NAME as ColumnName,
    DATA_TYPE as DataType,
    CHARACTER_MAXIMUM_LENGTH as MaxLength,
    IS_NULLABLE as IsNullable
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Users' 
    AND COLUMN_NAME LIKE '%Encrypted%' 
    OR COLUMN_NAME LIKE '%SearchHash%'
ORDER BY COLUMN_NAME;

-- Check Customers table
SELECT 
    'Customers' as TableName,
    COLUMN_NAME as ColumnName,
    DATA_TYPE as DataType,
    CHARACTER_MAXIMUM_LENGTH as MaxLength,
    IS_NULLABLE as IsNullable
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Customers' 
    AND COLUMN_NAME LIKE '%Encrypted%' 
    OR COLUMN_NAME LIKE '%SearchHash%'
ORDER BY COLUMN_NAME;

-- Check CustomerAddresses table
SELECT 
    'CustomerAddresses' as TableName,
    COLUMN_NAME as ColumnName,
    DATA_TYPE as DataType,
    CHARACTER_MAXIMUM_LENGTH as MaxLength,
    IS_NULLABLE as IsNullable
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'CustomerAddresses' 
    AND COLUMN_NAME LIKE '%Encrypted%' 
    OR COLUMN_NAME LIKE '%SearchHash%'
ORDER BY COLUMN_NAME;

PRINT 'Database schema migration completed successfully!';
PRINT 'Next step: Run the data migration script to encrypt existing data';
PRINT 'Timestamp: ' + CONVERT(VARCHAR(25), GETDATE(), 120);
