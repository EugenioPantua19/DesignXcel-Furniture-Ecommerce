-- Hero Banner Migration Script
-- This script updates the HeroBanner table to support multiple images

-- Step 1: Add new column for multiple images
ALTER TABLE HeroBanner ADD HeroBannerImages NVARCHAR(MAX);

-- Step 2: Migrate existing single image data to new format
UPDATE HeroBanner 
SET HeroBannerImages = CASE 
    WHEN HeroBannerImage IS NOT NULL THEN '["' + HeroBannerImage + '"]'
    ELSE NULL
END;

-- Step 3: Drop the old single image column (optional - uncomment if you want to remove it)
-- ALTER TABLE HeroBanner DROP COLUMN HeroBannerImage;

-- Step 4: Verify the migration
SELECT 
    MainHeading,
    DescriptionLine1,
    DescriptionLine2,
    ButtonText,
    ButtonLink,
    TextColor,
    ButtonBgColor,
    ButtonTextColor,
    HeroBannerImage as OldImage,
    HeroBannerImages as NewImages,
    CreatedAt,
    UpdatedAt
FROM HeroBanner; 