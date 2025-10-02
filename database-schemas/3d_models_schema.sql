-- 3D Models Schema for Microsoft SQL Server (MSSQL)
-- This schema adds support for 3D model files in the Products table

USE DesignXcelDB;
GO

-- Add Model3D column to Products table if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'Model3D')
BEGIN
    -- Add Model3D column
    ALTER TABLE Products 
    ADD Model3D NVARCHAR(500) NULL;
    
    PRINT 'Model3D column added to Products table';
END
ELSE
BEGIN
    PRINT 'Model3D column already exists in Products table';
END

-- Add Has3DModel column to Products table if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'Has3DModel')
BEGIN
    -- Add Has3DModel column
    ALTER TABLE Products 
    ADD Has3DModel BIT NOT NULL DEFAULT 0;
    
    PRINT 'Has3DModel column added to Products table';
END
ELSE
BEGIN
    PRINT 'Has3DModel column already exists in Products table';
END

-- Create index for better performance on 3D model queries
IF NOT EXISTS (SELECT * FROM sys.indexes 
               WHERE name = 'IX_Products_Has3DModel' AND object_id = OBJECT_ID('Products'))
BEGIN
    CREATE INDEX IX_Products_Has3DModel ON Products(Has3DModel);
    PRINT 'Index IX_Products_Has3DModel created successfully';
END
ELSE
BEGIN
    PRINT 'Index IX_Products_Has3DModel already exists';
END

-- Update existing products to set Has3DModel based on Model3D column
UPDATE Products 
SET Has3DModel = CASE WHEN Model3D IS NOT NULL AND Model3D != '' THEN 1 ELSE 0 END
WHERE Has3DModel IS NULL;

PRINT 'Updated Has3DModel values for existing products';

-- Verify the columns were added
SELECT 
    ProductID,
    Name,
    Model3D,
    Has3DModel,
    IsActive
FROM Products 
WHERE IsActive = 1
ORDER BY ProductID DESC;
