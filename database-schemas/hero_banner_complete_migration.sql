-- =====================================================
-- Hero Banner Complete Migration Script
-- Adds support for second button in hero banner
-- =====================================================

PRINT 'Starting Hero Banner Migration...';

-- Check if HeroBanner table exists
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HeroBanner' AND xtype='U')
BEGIN
    PRINT 'ERROR: HeroBanner table does not exist. Please run the initial schema first.';
    RETURN;
END

-- Check if columns already exist and add them if they don't
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

-- Set default values for existing records
PRINT 'Setting default values for existing records...';
UPDATE HeroBanner 
SET 
    Button2Text = 'Custom Design',
    Button2Link = '/custom-furniture',
    Button2BgColor = '#6c757d',
    Button2TextColor = '#ffffff'
WHERE Button2Text IS NULL;

PRINT 'Default values set successfully.';

-- Verify the migration
PRINT 'Verifying migration...';
SELECT 
    'Migration Verification' as Status,
    COUNT(*) as TotalRecords,
    COUNT(Button2Text) as RecordsWithButton2Text,
    COUNT(Button2Link) as RecordsWithButton2Link,
    COUNT(Button2BgColor) as RecordsWithButton2BgColor,
    COUNT(Button2TextColor) as RecordsWithButton2TextColor
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
PRINT 'The CMS now supports second button customization.';
