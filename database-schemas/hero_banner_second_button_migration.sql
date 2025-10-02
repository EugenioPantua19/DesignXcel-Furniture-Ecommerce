--- Hero Banner Second Button Migration Script
-- This script adds support for a second button in the hero banner

-- Step 1: Add new columns for second button
ALTER TABLE HeroBanner ADD Button2Text NVARCHAR(100) NULL;
ALTER TABLE HeroBanner ADD Button2Link NVARCHAR(200) NULL;
ALTER TABLE HeroBanner ADD Button2BgColor NVARCHAR(7) NULL;
ALTER TABLE HeroBanner ADD Button2TextColor NVARCHAR(7) NULL;

-- Step 2: Set default values for existing records
UPDATE HeroBanner 
SET 
    Button2Text = 'Custom Design',
    Button2Link = '/custom-furniture',
    Button2BgColor = '#6c757d',
    Button2TextColor = '#ffffff'
WHERE Button2Text IS NULL;

-- Step 3: Verify the migration
SELECT 
    MainHeading,
    DescriptionLine1,
    DescriptionLine2,
    ButtonText,
    ButtonLink,
    Button2Text,
    Button2Link,
    TextColor,
    ButtonBgColor,
    ButtonTextColor,
    Button2BgColor,
    Button2TextColor,
    HeroBannerImages,
    CreatedAt,
    UpdatedAt
FROM HeroBanner;
