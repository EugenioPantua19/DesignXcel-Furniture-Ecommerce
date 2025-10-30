-- Fix PublicId population for existing products
-- This script ensures all existing products have PublicId values

PRINT 'Fixing PublicId values for existing products...';

-- Update existing products that don't have PublicId
UPDATE Products 
SET PublicId = NEWID()
WHERE PublicId IS NULL;

PRINT 'Updated ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' products with PublicId values';

-- Now make the column NOT NULL
ALTER TABLE Products ALTER COLUMN PublicId UNIQUEIDENTIFIER NOT NULL;

PRINT 'Made PublicId NOT NULL';

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
IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_Products_PublicId')
BEGIN
    ALTER TABLE Products ADD CONSTRAINT UQ_Products_PublicId UNIQUE (PublicId);
    PRINT 'Added UQ_Products_PublicId constraint';
END

IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_Products_Slug')
BEGIN
    ALTER TABLE Products ADD CONSTRAINT UQ_Products_Slug UNIQUE (Slug);
    PRINT 'Added UQ_Products_Slug constraint';
END

IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_Products_SKU')
BEGIN
    ALTER TABLE Products ADD CONSTRAINT UQ_Products_SKU UNIQUE (SKU);
    PRINT 'Added UQ_Products_SKU constraint';
END

PRINT 'Migration completed successfully!';
PRINT 'All products now have PublicId, Slug, and SKU values';
