-- Populate data for Product Security Enhancement
-- This script populates the newly added columns with generated values

PRINT 'Starting data population for Product Security Enhancement...';

-- Update existing products with generated slugs
UPDATE Products 
SET Slug = LOWER(REPLACE(REPLACE(REPLACE(Name, ' ', '-'), '''', ''), '"', ''))
WHERE Slug IS NULL;

PRINT 'Updated ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' products with slugs';

-- Update existing products with generated SKUs
UPDATE Products 
SET SKU = UPPER(LEFT(Category, 3)) + '-' + 
         UPPER(LEFT(REPLACE(Name, ' ', ''), 4)) + '-' + 
         RIGHT('0000' + CAST(ProductID AS VARCHAR(4)), 4)
WHERE SKU IS NULL;

PRINT 'Updated ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' products with SKUs';

-- Make columns NOT NULL
ALTER TABLE Products ALTER COLUMN PublicId UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE Products ALTER COLUMN Slug NVARCHAR(255) NOT NULL;
ALTER TABLE Products ALTER COLUMN SKU NVARCHAR(50) NOT NULL;

PRINT 'Made all columns NOT NULL';

-- Create indexes
CREATE INDEX IX_Products_PublicId ON Products(PublicId);
CREATE INDEX IX_Products_Slug ON Products(Slug);
CREATE INDEX IX_Products_SKU ON Products(SKU);

PRINT 'Created indexes';

-- Add unique constraints
ALTER TABLE Products ADD CONSTRAINT UQ_Products_PublicId UNIQUE (PublicId);
ALTER TABLE Products ADD CONSTRAINT UQ_Products_Slug UNIQUE (Slug);
ALTER TABLE Products ADD CONSTRAINT UQ_Products_SKU UNIQUE (SKU);

PRINT 'Added unique constraints';
PRINT 'Data population completed successfully!';
