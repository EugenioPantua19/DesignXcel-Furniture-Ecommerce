-- Step 1: Add the columns to Products table
PRINT 'Step 1: Adding columns to Products table...';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'PublicId')
BEGIN
    ALTER TABLE Products ADD PublicId UNIQUEIDENTIFIER NULL;
    PRINT '✓ Added PublicId column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Slug')
BEGIN
    ALTER TABLE Products ADD Slug NVARCHAR(255) NULL;
    PRINT '✓ Added Slug column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'SKU')
BEGIN
    ALTER TABLE Products ADD SKU NVARCHAR(100) NULL;
    PRINT '✓ Added SKU column';
END

PRINT 'Step 1 completed!';
