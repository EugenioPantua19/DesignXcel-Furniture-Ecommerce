-- Add PublicId, Slug, and SKU columns to Products table
PRINT 'Starting to add columns to Products table...';

-- Add PublicId column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'PublicId')
BEGIN
    ALTER TABLE Products ADD PublicId UNIQUEIDENTIFIER NULL;
    PRINT 'Added PublicId column';
END
ELSE
BEGIN
    PRINT 'PublicId column already exists';
END

-- Add Slug column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Slug')
BEGIN
    ALTER TABLE Products ADD Slug NVARCHAR(255) NULL;
    PRINT 'Added Slug column';
END
ELSE
BEGIN
    PRINT 'Slug column already exists';
END

-- Add SKU column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'SKU')
BEGIN
    ALTER TABLE Products ADD SKU NVARCHAR(100) NULL;
    PRINT 'Added SKU column';
END
ELSE
BEGIN
    PRINT 'SKU column already exists';
END

-- Now populate the columns with data
PRINT 'Populating existing products with PublicId...';
UPDATE Products 
SET PublicId = NEWID()
WHERE PublicId IS NULL;

PRINT 'Populating existing products with Slug...';
UPDATE Products 
SET Slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Name, ' ', '-'), '''', ''), ',', ''), '.', ''), '/', ''))
WHERE Slug IS NULL OR Slug = '';

PRINT 'Populating existing products with SKU...';
UPDATE Products 
SET SKU = 'SKU-' + RIGHT('000000' + CAST(ProductID AS VARCHAR(10)), 6)
WHERE SKU IS NULL OR SKU = '';

-- Create indexes
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

-- Add unique constraints
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

PRINT 'Migration completed successfully!';
