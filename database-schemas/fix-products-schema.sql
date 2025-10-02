-- Fix Products table schema by adding missing IsFeatured column
-- This script adds the IsFeatured column that the API queries expect

USE DesignXcelDB;
GO

-- Check if IsFeatured column exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'IsFeatured')
BEGIN
    -- Add IsFeatured column
    ALTER TABLE Products 
    ADD IsFeatured BIT NOT NULL DEFAULT 0;
    
    PRINT 'IsFeatured column added to Products table';
END
ELSE
BEGIN
    PRINT 'IsFeatured column already exists in Products table';
END

-- Update some products to be featured (optional)
UPDATE Products 
SET IsFeatured = 1 
WHERE ProductID IN (SELECT TOP 3 ProductID FROM Products WHERE IsActive = 1 ORDER BY DateAdded DESC);

PRINT 'Updated some products to be featured';

-- Verify the column was added
SELECT 
    ProductID,
    Name,
    IsActive,
    IsFeatured,
    DateAdded
FROM Products 
WHERE IsActive = 1
ORDER BY IsFeatured DESC, DateAdded DESC;
