-- Step 3: Create indexes and unique constraints
PRINT 'Step 3: Creating indexes and constraints...';

-- Create indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_PublicId' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE INDEX IX_Products_PublicId ON Products(PublicId);
    PRINT '✓ Created IX_Products_PublicId index';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Slug' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE INDEX IX_Products_Slug ON Products(Slug);
    PRINT '✓ Created IX_Products_Slug index';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_SKU' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE INDEX IX_Products_SKU ON Products(SKU);
    PRINT '✓ Created IX_Products_SKU index';
END

-- Add unique constraints
IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_Products_PublicId' AND parent_object_id = OBJECT_ID('Products'))
BEGIN
    ALTER TABLE Products ADD CONSTRAINT UQ_Products_PublicId UNIQUE (PublicId);
    PRINT '✓ Added UQ_Products_PublicId unique constraint';
END

IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_Products_Slug' AND parent_object_id = OBJECT_ID('Products'))
BEGIN
    ALTER TABLE Products ADD CONSTRAINT UQ_Products_Slug UNIQUE (Slug);
    PRINT '✓ Added UQ_Products_Slug unique constraint';
END

IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_Products_SKU' AND parent_object_id = OBJECT_ID('Products'))
BEGIN
    ALTER TABLE Products ADD CONSTRAINT UQ_Products_SKU UNIQUE (SKU);
    PRINT '✓ Added UQ_Products_SKU unique constraint';
END

PRINT 'Step 3 completed!';
PRINT '';
PRINT 'Migration completed successfully!';
