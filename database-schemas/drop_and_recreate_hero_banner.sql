-- =====================================================
-- Drop and Recreate Hero Banner Table
-- This script will safely drop the existing HeroBanner table and recreate it
-- WARNING: This will delete all existing hero banner data
-- =====================================================

PRINT 'Starting Hero Banner Table Recreation...';

-- Check if HeroBanner table exists
IF EXISTS (SELECT * FROM sysobjects WHERE name='HeroBanner' AND xtype='U')
BEGIN
    PRINT 'HeroBanner table exists. Dropping existing table...';
    
    -- Drop the existing table
    DROP TABLE HeroBanner;
    PRINT 'Existing HeroBanner table dropped successfully.';
END
ELSE
BEGIN
    PRINT 'HeroBanner table does not exist. Proceeding with creation...';
END

-- Create the new HeroBanner table with all required columns
PRINT 'Creating new HeroBanner table...';
CREATE TABLE HeroBanner (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    MainHeading NVARCHAR(255) NULL,
    DescriptionLine1 NVARCHAR(MAX) NULL,
    DescriptionLine2 NVARCHAR(MAX) NULL,
    ButtonText NVARCHAR(100) NULL,
    ButtonLink NVARCHAR(200) NULL,
    Button2Text NVARCHAR(100) NULL,
    Button2Link NVARCHAR(200) NULL,
    Button2BgColor NVARCHAR(7) NULL,
    Button2TextColor NVARCHAR(7) NULL,
    TextColor NVARCHAR(7) NULL,
    ButtonBgColor NVARCHAR(7) NULL,
    ButtonTextColor NVARCHAR(7) NULL,
    HeroBannerImages NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);
PRINT 'New HeroBanner table created successfully.';

-- Insert default record
PRINT 'Inserting default hero banner record...';
INSERT INTO HeroBanner (
    MainHeading, DescriptionLine1, DescriptionLine2, ButtonText, ButtonLink,
    Button2Text, Button2Link, Button2BgColor, Button2TextColor,
    TextColor, ButtonBgColor, ButtonTextColor, HeroBannerImages
) VALUES (
    'Premium Office Furniture Solutions',
    'Transform your workspace with our premium collection of office furniture',
    'Discover our premium collection of office furniture designed for modern professionals',
    'SHOP NOW',
    '/products',
    'Custom Design',
    '/custom-furniture',
    '#6c757d',
    '#ffffff',
    '#ffffff',
    '#ffc107',
    '#333333',
    NULL
);
PRINT 'Default hero banner record inserted successfully.';

-- Create indexes for better performance
PRINT 'Creating indexes...';
CREATE INDEX IX_HeroBanner_UpdatedAt ON HeroBanner(UpdatedAt);
CREATE INDEX IX_HeroBanner_MainHeading ON HeroBanner(MainHeading);
PRINT 'Indexes created successfully.';

-- Verify the new table
PRINT 'Verifying new table structure...';
SELECT 
    'Table Recreation Verification' as Status,
    COUNT(*) as TotalRecords,
    COUNT(Button2Text) as RecordsWithButton2Text,
    COUNT(Button2Link) as RecordsWithButton2Link,
    COUNT(Button2BgColor) as RecordsWithButton2BgColor,
    COUNT(Button2TextColor) as RecordsWithButton2TextColor,
    COUNT(HeroBannerImages) as RecordsWithImages
FROM HeroBanner;

-- Show the new table structure
PRINT 'New table structure:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'HeroBanner'
ORDER BY ORDINAL_POSITION;

-- Show sample data
PRINT 'Sample data in new table:';
SELECT TOP 1
    ID,
    MainHeading,
    DescriptionLine1,
    DescriptionLine2,
    ButtonText,
    ButtonLink,
    Button2Text,
    Button2Link,
    Button2BgColor,
    Button2TextColor,
    TextColor,
    ButtonBgColor,
    ButtonTextColor,
    CASE 
        WHEN HeroBannerImages IS NOT NULL THEN 'Images Present'
        ELSE 'No Images'
    END as ImageStatus,
    CreatedAt,
    UpdatedAt
FROM HeroBanner;

PRINT 'Hero Banner table recreation completed successfully!';
PRINT 'The new table includes:';
PRINT '- All original columns (MainHeading, DescriptionLine1, DescriptionLine2, etc.)';
PRINT '- Button2 support (Button2Text, Button2Link, Button2BgColor, Button2TextColor)';
PRINT '- Multiple images support (HeroBannerImages as JSON)';
PRINT '- Proper timestamps and indexing';
PRINT '- Default values for all fields';
