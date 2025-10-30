-- Step-by-step migration for Product Security Enhancement
-- This script handles the migration in separate steps to avoid column reference issues

PRINT 'Starting Product Security Migration - Step by Step...';

-- Step 1: Add columns if they don't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'PublicId')
BEGIN
    ALTER TABLE Products ADD PublicId UNIQUEIDENTIFIER DEFAULT NEWID();
    PRINT 'Step 1: Added PublicId column';
END
ELSE
BEGIN
    PRINT 'Step 1: PublicId column already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'Slug')
BEGIN
    ALTER TABLE Products ADD Slug NVARCHAR(255);
    PRINT 'Step 2: Added Slug column';
END
ELSE
BEGIN
    PRINT 'Step 2: Slug column already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'SKU')
BEGIN
    ALTER TABLE Products ADD SKU NVARCHAR(50);
    PRINT 'Step 3: Added SKU column';
END
ELSE
BEGIN
    PRINT 'Step 3: SKU column already exists';
END

PRINT 'All columns added successfully!';
PRINT 'Migration completed - columns are ready for data population.';
