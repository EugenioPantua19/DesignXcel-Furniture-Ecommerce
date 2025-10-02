-- =====================================================
-- Hero Banner Fixed Schema
-- Complete schema with all required columns for hero banner functionality
-- =====================================================

PRINT 'Starting Hero Banner Schema Fix...';

-- Drop existing table if it exists (WARNING: This will delete all data)
-- Uncomment the next line only if you want to completely recreate the table
-- DROP TABLE IF EXISTS HeroBanner;

-- Create the HeroBanner table with all required columns
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HeroBanner' AND xtype='U')
BEGIN
    PRINT 'Creating HeroBanner table...';
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
    PRINT 'HeroBanner table created successfully.';
END
ELSE
BEGIN
    PRINT 'HeroBanner table already exists. Checking for missing columns...';
    
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2Text')
    BEGIN
        PRINT 'Adding Button2Text column...';
        ALTER TABLE HeroBanner ADD Button2Text NVARCHAR(100) NULL;
        PRINT 'Button2Text column added successfully.';
    END
    
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2Link')
    BEGIN
        PRINT 'Adding Button2Link column...';
        ALTER TABLE HeroBanner ADD Button2Link NVARCHAR(200) NULL;
        PRINT 'Button2Link column added successfully.';
    END
    
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2BgColor')
    BEGIN
        PRINT 'Adding Button2BgColor column...';
        ALTER TABLE HeroBanner ADD Button2BgColor NVARCHAR(7) NULL;
        PRINT 'Button2BgColor column added successfully.';
    END
    
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2TextColor')
    BEGIN
        PRINT 'Adding Button2TextColor column...';
        ALTER TABLE HeroBanner ADD Button2TextColor NVARCHAR(7) NULL;
        PRINT 'Button2TextColor column added successfully.';
    END
    
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'HeroBannerImages')
    BEGIN
        PRINT 'Adding HeroBannerImages column...';
        ALTER TABLE HeroBanner ADD HeroBannerImages NVARCHAR(MAX) NULL;
        PRINT 'HeroBannerImages column added successfully.';
    END
END

-- Set default values for existing records that have NULL values
PRINT 'Setting default values for existing records...';
UPDATE HeroBanner 
SET 
    Button2Text = ISNULL(Button2Text, 'Custom Design'),
    Button2Link = ISNULL(Button2Link, '/custom-furniture'),
    Button2BgColor = ISNULL(Button2BgColor, '#6c757d'),
    Button2TextColor = ISNULL(Button2TextColor, '#ffffff'),
    MainHeading = ISNULL(MainHeading, 'Premium Office Furniture Solutions'),
    DescriptionLine1 = ISNULL(DescriptionLine1, 'Transform your workspace with our premium collection of office furniture'),
    DescriptionLine2 = ISNULL(DescriptionLine2, 'Discover our premium collection of office furniture designed for modern professionals'),
    ButtonText = ISNULL(ButtonText, 'SHOP NOW'),
    ButtonLink = ISNULL(ButtonLink, '/products'),
    TextColor = ISNULL(TextColor, '#ffffff'),
    ButtonBgColor = ISNULL(ButtonBgColor, '#ffc107'),
    ButtonTextColor = ISNULL(ButtonTextColor, '#333333')
WHERE Button2Text IS NULL OR Button2Link IS NULL OR Button2BgColor IS NULL OR Button2TextColor IS NULL
   OR MainHeading IS NULL OR DescriptionLine1 IS NULL OR DescriptionLine2 IS NULL
   OR ButtonText IS NULL OR ButtonLink IS NULL OR TextColor IS NULL
   OR ButtonBgColor IS NULL OR ButtonTextColor IS NULL;

-- Insert default record if table is empty
IF NOT EXISTS (SELECT * FROM HeroBanner)
BEGIN
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
END

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HeroBanner_UpdatedAt')
BEGIN
    PRINT 'Creating index IX_HeroBanner_UpdatedAt...';
    CREATE INDEX IX_HeroBanner_UpdatedAt ON HeroBanner(UpdatedAt);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HeroBanner_MainHeading')
BEGIN
    PRINT 'Creating index IX_HeroBanner_MainHeading...';
    CREATE INDEX IX_HeroBanner_MainHeading ON HeroBanner(MainHeading);
END

-- Verify the schema
PRINT 'Verifying schema...';
SELECT 
    'Schema Verification' as Status,
    COUNT(*) as TotalRecords,
    COUNT(Button2Text) as RecordsWithButton2Text,
    COUNT(Button2Link) as RecordsWithButton2Link,
    COUNT(Button2BgColor) as RecordsWithButton2BgColor,
    COUNT(Button2TextColor) as RecordsWithButton2TextColor,
    COUNT(HeroBannerImages) as RecordsWithImages
FROM HeroBanner;

-- Show sample data
PRINT 'Sample data after schema fix:';
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

PRINT 'Hero Banner schema fix completed successfully!';
PRINT 'The table now supports:';
PRINT '- Main heading and descriptions';
PRINT '- Two customizable buttons with text, links, and colors';
PRINT '- Multiple hero banner images (JSON array)';
PRINT '- Text and button color customization';
PRINT '- Proper timestamps and indexing';
