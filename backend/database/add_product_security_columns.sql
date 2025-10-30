-- Migration: Add UUID and Slug columns to Products table
-- This migration adds public-facing identifiers to replace direct database ID exposure
-- Compatible with Azure SQL Database

-- Check if columns already exist to avoid errors
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'PublicId')
BEGIN
    -- Add UUID column for public-facing product identification
    ALTER TABLE Products 
    ADD PublicId UNIQUEIDENTIFIER DEFAULT NEWID();
    PRINT 'Added PublicId column';
END
ELSE
BEGIN
    PRINT 'PublicId column already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'Slug')
BEGIN
    -- Add slug column for SEO-friendly URLs
    ALTER TABLE Products 
    ADD Slug NVARCHAR(255);
    PRINT 'Added Slug column';
END
ELSE
BEGIN
    PRINT 'Slug column already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'SKU')
BEGIN
    -- Add SKU column for product identification
    ALTER TABLE Products 
    ADD SKU NVARCHAR(50);
    PRINT 'Added SKU column';
END
ELSE
BEGIN
    PRINT 'SKU column already exists';
END

-- Create indexes if they don't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_PublicId' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE INDEX IX_Products_PublicId ON Products(PublicId);
    PRINT 'Created IX_Products_PublicId index';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Slug' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE INDEX IX_Products_Slug ON Products(Slug);
    PRINT 'Created IX_Products_Slug index';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_SKU' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE INDEX IX_Products_SKU ON Products(SKU);
    PRINT 'Created IX_Products_SKU index';
END

-- Update existing products with generated values
-- Note: This will generate UUIDs, slugs, and SKUs for existing products
UPDATE Products 
SET 
    PublicId = NEWID(),
    Slug = LOWER(REPLACE(REPLACE(REPLACE(Name, ' ', '-'), '''', ''), '"', '')),
    SKU = UPPER(LEFT(Category, 3)) + '-' + 
         UPPER(LEFT(REPLACE(Name, ' ', ''), 4)) + '-' + 
         RIGHT('0000' + CAST(ProductID AS VARCHAR(4)), 4)
WHERE PublicId IS NULL OR Slug IS NULL OR SKU IS NULL;

PRINT 'Updated existing products with generated values';

-- Make PublicId NOT NULL after populating existing records
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'PublicId' AND IS_NULLABLE = 'YES')
BEGIN
    ALTER TABLE Products 
    ALTER COLUMN PublicId UNIQUEIDENTIFIER NOT NULL;
    PRINT 'Made PublicId NOT NULL';
END

-- Make Slug NOT NULL after populating existing records
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'Slug' AND IS_NULLABLE = 'YES')
BEGIN
    ALTER TABLE Products 
    ALTER COLUMN Slug NVARCHAR(255) NOT NULL;
    PRINT 'Made Slug NOT NULL';
END

-- Make SKU NOT NULL after populating existing records
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'SKU' AND IS_NULLABLE = 'YES')
BEGIN
    ALTER TABLE Products 
    ALTER COLUMN SKU NVARCHAR(50) NOT NULL;
    PRINT 'Made SKU NOT NULL';
END

-- Add unique constraints if they don't exist
IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_Products_PublicId')
BEGIN
    ALTER TABLE Products 
    ADD CONSTRAINT UQ_Products_PublicId UNIQUE (PublicId);
    PRINT 'Added UQ_Products_PublicId constraint';
END

IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_Products_Slug')
BEGIN
    ALTER TABLE Products 
    ADD CONSTRAINT UQ_Products_Slug UNIQUE (Slug);
    PRINT 'Added UQ_Products_Slug constraint';
END

IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_Products_SKU')
BEGIN
    ALTER TABLE Products 
    ADD CONSTRAINT UQ_Products_SKU UNIQUE (SKU);
    PRINT 'Added UQ_Products_SKU constraint';
END

PRINT 'Migration completed: Added PublicId, Slug, and SKU columns to Products table';
