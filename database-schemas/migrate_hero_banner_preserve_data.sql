-- =====================================================
-- Migrate Hero Banner Table (Preserve Data)
-- This script will migrate the existing HeroBanner table to the new structure
-- while preserving all existing data
-- =====================================================

PRINT 'Starting Hero Banner Migration (Preserve Data)...';

-- Check if HeroBanner table exists
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HeroBanner' AND xtype='U')
BEGIN
    PRINT 'ERROR: HeroBanner table does not exist. Cannot migrate.';
    RETURN;
END

-- Create a backup table with current data
PRINT 'Creating backup table...';
SELECT * INTO HeroBanner_Backup FROM HeroBanner;
PRINT 'Backup table created successfully.';

-- Add missing columns if they don't exist
PRINT 'Adding missing columns...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2Text')
BEGIN
    PRINT 'Adding Button2Text column...';
    ALTER TABLE HeroBanner ADD Button2Text NVARCHAR(100) NULL;
    PRINT 'Button2Text column added successfully.';
END
ELSE
BEGIN
    PRINT 'Button2Text column already exists.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2Link')
BEGIN
    PRINT 'Adding Button2Link column...';
    ALTER TABLE HeroBanner ADD Button2Link NVARCHAR(200) NULL;
    PRINT 'Button2Link column added successfully.';
END
ELSE
BEGIN
    PRINT 'Button2Link column already exists.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2BgColor')
BEGIN
    PRINT 'Adding Button2BgColor column...';
    ALTER TABLE HeroBanner ADD Button2BgColor NVARCHAR(7) NULL;
    PRINT 'Button2BgColor column added successfully.';
END
ELSE
BEGIN
    PRINT 'Button2BgColor column already exists.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'Button2TextColor')
BEGIN
    PRINT 'Adding Button2TextColor column...';
    ALTER TABLE HeroBanner ADD Button2TextColor NVARCHAR(7) NULL;
    PRINT 'Button2TextColor column added successfully.';
END
ELSE
BEGIN
    PRINT 'Button2TextColor column already exists.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'HeroBannerImages')
BEGIN
    PRINT 'Adding HeroBannerImages column...';
    ALTER TABLE HeroBanner ADD HeroBannerImages NVARCHAR(MAX) NULL;
    PRINT 'HeroBannerImages column added successfully.';
END
ELSE
BEGIN
    PRINT 'HeroBannerImages column already exists.';
END

-- Migrate existing single image data to new format (if HeroBannerImage column exists)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HeroBanner' AND COLUMN_NAME = 'HeroBannerImage')
BEGIN
    PRINT 'Migrating single image data to multiple images format...';
    UPDATE HeroBanner 
    SET HeroBannerImages = CASE 
        WHEN HeroBannerImage IS NOT NULL THEN '["' + HeroBannerImage + '"]'
        ELSE NULL
    END
    WHERE HeroBannerImages IS NULL;
    PRINT 'Image data migration completed.';
END

-- Set default values for new columns where they are NULL
PRINT 'Setting default values for new columns...';
UPDATE HeroBanner 
SET 
    Button2Text = ISNULL(Button2Text, 'Custom Design'),
    Button2Link = ISNULL(Button2Link, '/custom-furniture'),
    Button2BgColor = ISNULL(Button2BgColor, '#6c757d'),
    Button2TextColor = ISNULL(Button2TextColor, '#ffffff')
WHERE Button2Text IS NULL OR Button2Link IS NULL OR Button2BgColor IS NULL OR Button2TextColor IS NULL;

-- Set default values for existing columns if they are NULL
UPDATE HeroBanner 
SET 
    MainHeading = ISNULL(MainHeading, 'Premium Office Furniture Solutions'),
    DescriptionLine1 = ISNULL(DescriptionLine1, 'Transform your workspace with our premium collection of office furniture'),
    DescriptionLine2 = ISNULL(DescriptionLine2, 'Discover our premium collection of office furniture designed for modern professionals'),
    ButtonText = ISNULL(ButtonText, 'SHOP NOW'),
    ButtonLink = ISNULL(ButtonLink, '/products'),
    TextColor = ISNULL(TextColor, '#ffffff'),
    ButtonBgColor = ISNULL(ButtonBgColor, '#ffc107'),
    ButtonTextColor = ISNULL(ButtonTextColor, '#333333')
WHERE MainHeading IS NULL OR DescriptionLine1 IS NULL OR DescriptionLine2 IS NULL
   OR ButtonText IS NULL OR ButtonLink IS NULL OR TextColor IS NULL
   OR ButtonBgColor IS NULL OR ButtonTextColor IS NULL;

-- Create indexes if they don't exist
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

-- Verify the migration
PRINT 'Verifying migration...';
SELECT 
    'Migration Verification' as Status,
    COUNT(*) as TotalRecords,
    COUNT(Button2Text) as RecordsWithButton2Text,
    COUNT(Button2Link) as RecordsWithButton2Link,
    COUNT(Button2BgColor) as RecordsWithButton2BgColor,
    COUNT(Button2TextColor) as RecordsWithButton2TextColor,
    COUNT(HeroBannerImages) as RecordsWithImages
FROM HeroBanner;

-- Show sample data
PRINT 'Sample data after migration:';
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

PRINT 'Hero Banner migration completed successfully!';
PRINT 'All existing data has been preserved and new columns have been added.';
PRINT 'You can now use the updated hero banner functionality with both buttons.';
