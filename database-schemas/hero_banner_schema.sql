-- Hero Banner Schema
-- This table stores the hero banner content and image customization settings

IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='HeroBanner' and xtype='U')
CREATE TABLE HeroBanner
(
    ID INT PRIMARY KEY IDENTITY(1,1),
    MainHeading NVARCHAR(200) NOT NULL DEFAULT 'Premium Office Furniture Solutions',
    DescriptionLine1 NVARCHAR(300) NULL,
    DescriptionLine2 NVARCHAR(300) NULL,
    ButtonText NVARCHAR(100) NOT NULL DEFAULT 'SHOP NOW',
    ButtonLink NVARCHAR(200) NOT NULL DEFAULT '/products',
    TextColor NVARCHAR(7) NOT NULL DEFAULT '#ffffff',
    ButtonBgColor NVARCHAR(7) NOT NULL DEFAULT '#ffc107',
    ButtonTextColor NVARCHAR(7) NOT NULL DEFAULT '#333333',
    HeroBannerImage NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Insert default values if table is empty
IF NOT EXISTS (SELECT *
FROM HeroBanner)
INSERT INTO HeroBanner
    (
    MainHeading, DescriptionLine1, DescriptionLine2, ButtonText, ButtonLink,
    TextColor, ButtonBgColor, ButtonTextColor
    )
VALUES
    (
        'Premium Office Furniture Solutions',
        'Transform your workspace with our premium collection of office furniture',
        'Discover our premium collection of office furniture designed for modern professionals',
        'SHOP NOW',
        '/products',
        '#ffffff',
        '#ffc107',
        '#333333'
);

-- Add indexes for better performance
CREATE INDEX IX_HeroBanner_UpdatedAt ON HeroBanner(UpdatedAt);
CREATE INDEX IX_HeroBanner_MainHeading ON HeroBanner(MainHeading);
