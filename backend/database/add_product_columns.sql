-- Add PublicId, Slug, and SKU columns to Products table
-- This script adds the required columns for product security and URL-friendly access

PRINT 'Adding PublicId, Slug, and SKU columns to Products table...';

-- Check if columns don't exist before adding
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'PublicId')
BEGIN
    ALTER TABLE Products ADD PublicId UNIQUEIDENTIFIER NULL;
    PRINT 'Added PublicId column';
END
ELSE
BEGIN
    PRINT 'PublicId column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Slug')
BEGIN
    ALTER TABLE Products ADD Slug NVARCHAR(255) NULL;
    PRINT 'Added Slug column';
END
ELSE
BEGIN
    PRINT 'Slug column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'SKU')
BEGIN
    ALTER TABLE Products ADD SKU NVARCHAR(100) NULL;
    PRINT 'Added SKU column';
END
ELSE
BEGIN
    PRINT 'SKU column already exists';
END

-- Generate PublicId for existing products that don't have one
UPDATE Products 
SET PublicId = NEWID()
WHERE PublicId IS NULL;

PRINT 'Updated existing products with PublicId values';

-- Generate Slug from Name for existing products
UPDATE Products 
SET Slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(Name, ' ', '-'), '''', ''), ',', ''), '.', ''))
WHERE Slug IS NULL OR Slug = '';

PRINT 'Updated existing products with Slug values';

-- Generate SKU for existing products that don't have one
UPDATE Products 
SET SKU = 'SKU-' + RIGHT('000000' + CAST(ProductID AS VARCHAR(10)), 6)
WHERE SKU IS NULL OR SKU = '';

PRINT 'Updated existing products with SKU values';

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

-- Add unique constraints if they don't exist
IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_Products_PublicId' AND parent_object_id = OBJECT_ID('Products'))
BEGIN
    ALTER TABLE Products ADD CONSTRAINT UQ_Products_PublicId UNIQUE (PublicId);
    PRINT 'Added UQ_Products_PublicId constraint';
END

IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_Products_Slug' AND parent_object_id = OBJECT_ID('Products'))
BEGIN
    ALTER TABLE Products ADD CONSTRAINT UQ_Products_Slug UNIQUE (Slug);
    PRINT 'Added UQ_Products_Slug constraint';
END

IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_Products_SKU' AND parent_object_id = OBJECT_ID('Products'))
BEGIN
    ALTER TABLE Products ADD CONSTRAINT UQ_Products_SKU UNIQUE (SKU);
    PRINT 'Added UQ_Products_SKU constraint';
END

-- Add comments for documentation
IF NOT EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('Products') AND minor_id = 0 AND name = 'MS_Description')
BEGIN
    EXEC sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'Public unique identifier for secure product access', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE', @level1name = N'Products', 
        @level2type = N'COLUMN', @level2name = N'PublicId';
END

IF NOT EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('Products') AND minor_id = 0 AND name = 'MS_Description_Slug')
BEGIN
    EXEC sp_addextendedproperty 
        @name = N'MS_Description_Slug', 
        @value = N'URL-friendly identifier for product', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE', @level1name = N'Products', 
        @level2type = N'COLUMN', @level2name = N'Slug';
END

IF NOT EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('Products') AND minor_id = 0 AND name = 'MS_Description_SKU')
BEGIN
    EXEC sp_addextendedproperty 
        @name = N'MS_Description_SKU', 
        @value = N'Stock Keeping Unit identifier', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE', @level1name = N'Products', 
        @level2type = N'COLUMN', @level2name = N'SKU';
END

PRINT 'Migration completed successfully!';
PRINT 'All products now have PublicId, Slug, and SKU values';
