-- =============================================================================
-- DATABASE ENCRYPTION ROLLBACK SCRIPT
-- =============================================================================
-- This script removes encrypted columns and restores original data
-- 
-- WARNING: This will permanently delete encrypted data!
-- Only run this if you need to rollback the encryption migration
-- =============================================================================

PRINT 'Starting database encryption rollback...';
PRINT 'WARNING: This will permanently delete encrypted data!';
PRINT 'Timestamp: ' + CONVERT(VARCHAR(25), GETDATE(), 120);

-- =============================================================================
-- 1. REMOVE INDEXES FIRST
-- =============================================================================

PRINT 'Removing indexes for encrypted columns...';

-- Remove Users table indexes
IF EXISTS (SELECT * FROM sys.indexes 
           WHERE name = 'IX_Users_EmailSearchHash' AND object_id = OBJECT_ID('Users'))
BEGIN
    DROP INDEX IX_Users_EmailSearchHash ON Users;
    PRINT 'Index IX_Users_EmailSearchHash dropped';
END

IF EXISTS (SELECT * FROM sys.indexes 
           WHERE name = 'IX_Users_FullNameSearchHash' AND object_id = OBJECT_ID('Users'))
BEGIN
    DROP INDEX IX_Users_FullNameSearchHash ON Users;
    PRINT 'Index IX_Users_FullNameSearchHash dropped';
END

-- Remove Customers table indexes
IF EXISTS (SELECT * FROM sys.indexes 
           WHERE name = 'IX_Customers_EmailSearchHash' AND object_id = OBJECT_ID('Customers'))
BEGIN
    DROP INDEX IX_Customers_EmailSearchHash ON Customers;
    PRINT 'Index IX_Customers_EmailSearchHash dropped';
END

IF EXISTS (SELECT * FROM sys.indexes 
           WHERE name = 'IX_Customers_FullNameSearchHash' AND object_id = OBJECT_ID('Customers'))
BEGIN
    DROP INDEX IX_Customers_FullNameSearchHash ON Customers;
    PRINT 'Index IX_Customers_FullNameSearchHash dropped';
END

-- Remove CustomerAddresses table indexes
IF EXISTS (SELECT * FROM sys.indexes 
           WHERE name = 'IX_CustomerAddresses_CitySearchHash' AND object_id = OBJECT_ID('CustomerAddresses'))
BEGIN
    DROP INDEX IX_CustomerAddresses_CitySearchHash ON CustomerAddresses;
    PRINT 'Index IX_CustomerAddresses_CitySearchHash dropped';
END

IF EXISTS (SELECT * FROM sys.indexes 
           WHERE name = 'IX_CustomerAddresses_ProvinceSearchHash' AND object_id = OBJECT_ID('CustomerAddresses'))
BEGIN
    DROP INDEX IX_CustomerAddresses_ProvinceSearchHash ON CustomerAddresses;
    PRINT 'Index IX_CustomerAddresses_ProvinceSearchHash dropped';
END

-- =============================================================================
-- 2. REMOVE ENCRYPTED COLUMNS FROM USERS TABLE
-- =============================================================================

PRINT 'Removing encrypted columns from Users table...';

-- Remove encrypted email column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'EmailEncrypted')
BEGIN
    ALTER TABLE Users DROP COLUMN EmailEncrypted;
    PRINT 'EmailEncrypted column removed from Users table';
END

-- Remove email search hash column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'EmailSearchHash')
BEGIN
    ALTER TABLE Users DROP COLUMN EmailSearchHash;
    PRINT 'EmailSearchHash column removed from Users table';
END

-- Remove encrypted full name column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'FullNameEncrypted')
BEGIN
    ALTER TABLE Users DROP COLUMN FullNameEncrypted;
    PRINT 'FullNameEncrypted column removed from Users table';
END

-- Remove full name search hash column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'FullNameSearchHash')
BEGIN
    ALTER TABLE Users DROP COLUMN FullNameSearchHash;
    PRINT 'FullNameSearchHash column removed from Users table';
END

-- Remove encrypted phone number column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'PhoneNumberEncrypted')
BEGIN
    ALTER TABLE Users DROP COLUMN PhoneNumberEncrypted;
    PRINT 'PhoneNumberEncrypted column removed from Users table';
END

-- =============================================================================
-- 3. REMOVE ENCRYPTED COLUMNS FROM CUSTOMERS TABLE
-- =============================================================================

PRINT 'Removing encrypted columns from Customers table...';

-- Remove encrypted email column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'EmailEncrypted')
BEGIN
    ALTER TABLE Customers DROP COLUMN EmailEncrypted;
    PRINT 'EmailEncrypted column removed from Customers table';
END

-- Remove email search hash column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'EmailSearchHash')
BEGIN
    ALTER TABLE Customers DROP COLUMN EmailSearchHash;
    PRINT 'EmailSearchHash column removed from Customers table';
END

-- Remove encrypted full name column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'FullNameEncrypted')
BEGIN
    ALTER TABLE Customers DROP COLUMN FullNameEncrypted;
    PRINT 'FullNameEncrypted column removed from Customers table';
END

-- Remove full name search hash column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'FullNameSearchHash')
BEGIN
    ALTER TABLE Customers DROP COLUMN FullNameSearchHash;
    PRINT 'FullNameSearchHash column removed from Customers table';
END

-- Remove encrypted phone number column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'PhoneNumberEncrypted')
BEGIN
    ALTER TABLE Customers DROP COLUMN PhoneNumberEncrypted;
    PRINT 'PhoneNumberEncrypted column removed from Customers table';
END

-- Remove encrypted date of birth column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'DateOfBirthEncrypted')
BEGIN
    ALTER TABLE Customers DROP COLUMN DateOfBirthEncrypted;
    PRINT 'DateOfBirthEncrypted column removed from Customers table';
END

-- =============================================================================
-- 4. REMOVE ENCRYPTED COLUMNS FROM CUSTOMERADDRESSES TABLE
-- =============================================================================

PRINT 'Removing encrypted columns from CustomerAddresses table...';

-- Remove encrypted house number column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'HouseNumberEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses DROP COLUMN HouseNumberEncrypted;
    PRINT 'HouseNumberEncrypted column removed from CustomerAddresses table';
END

-- Remove encrypted street column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'StreetEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses DROP COLUMN StreetEncrypted;
    PRINT 'StreetEncrypted column removed from CustomerAddresses table';
END

-- Remove encrypted barangay column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'BarangayEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses DROP COLUMN BarangayEncrypted;
    PRINT 'BarangayEncrypted column removed from CustomerAddresses table';
END

-- Remove encrypted city column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'CityEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses DROP COLUMN CityEncrypted;
    PRINT 'CityEncrypted column removed from CustomerAddresses table';
END

-- Remove city search hash column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'CitySearchHash')
BEGIN
    ALTER TABLE CustomerAddresses DROP COLUMN CitySearchHash;
    PRINT 'CitySearchHash column removed from CustomerAddresses table';
END

-- Remove encrypted province column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'ProvinceEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses DROP COLUMN ProvinceEncrypted;
    PRINT 'ProvinceEncrypted column removed from CustomerAddresses table';
END

-- Remove province search hash column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'ProvinceSearchHash')
BEGIN
    ALTER TABLE CustomerAddresses DROP COLUMN ProvinceSearchHash;
    PRINT 'ProvinceSearchHash column removed from CustomerAddresses table';
END

-- Remove encrypted region column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'RegionEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses DROP COLUMN RegionEncrypted;
    PRINT 'RegionEncrypted column removed from CustomerAddresses table';
END

-- Remove encrypted postal code column
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'CustomerAddresses' AND COLUMN_NAME = 'PostalCodeEncrypted')
BEGIN
    ALTER TABLE CustomerAddresses DROP COLUMN PostalCodeEncrypted;
    PRINT 'PostalCodeEncrypted column removed from CustomerAddresses table';
END

-- =============================================================================
-- 5. VERIFY ROLLBACK
-- =============================================================================

PRINT 'Verifying rollback completion...';

-- Check Users table
SELECT 
    'Users' as TableName,
    COLUMN_NAME as ColumnName,
    DATA_TYPE as DataType
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Users' 
    AND (COLUMN_NAME LIKE '%Encrypted%' OR COLUMN_NAME LIKE '%SearchHash%')
ORDER BY COLUMN_NAME;

-- Check Customers table
SELECT 
    'Customers' as TableName,
    COLUMN_NAME as ColumnName,
    DATA_TYPE as DataType
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Customers' 
    AND (COLUMN_NAME LIKE '%Encrypted%' OR COLUMN_NAME LIKE '%SearchHash%')
ORDER BY COLUMN_NAME;

-- Check CustomerAddresses table
SELECT 
    'CustomerAddresses' as TableName,
    COLUMN_NAME as ColumnName,
    DATA_TYPE as DataType
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'CustomerAddresses' 
    AND (COLUMN_NAME LIKE '%Encrypted%' OR COLUMN_NAME LIKE '%SearchHash%')
ORDER BY COLUMN_NAME;

PRINT 'Database encryption rollback completed successfully!';
PRINT 'All encrypted columns have been removed from the database.';
PRINT 'Timestamp: ' + CONVERT(VARCHAR(25), GETDATE(), 120);
