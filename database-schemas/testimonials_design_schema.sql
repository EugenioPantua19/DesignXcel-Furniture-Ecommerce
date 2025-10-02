-- Testimonials Design Schema
-- This table stores the design and layout customization settings for testimonials

IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='TestimonialsDesign' and xtype='U')
CREATE TABLE TestimonialsDesign
(
    ID INT PRIMARY KEY IDENTITY(1,1),
    Theme NVARCHAR(50) NOT NULL DEFAULT 'default',
    Layout NVARCHAR(50) NOT NULL DEFAULT 'grid',
    PerRow NVARCHAR(10) NOT NULL DEFAULT '3',
    Animation NVARCHAR(50) NOT NULL DEFAULT 'none',
    BgColor NVARCHAR(7) NOT NULL DEFAULT '#ffffff',
    TextColor NVARCHAR(7) NOT NULL DEFAULT '#333333',
    AccentColor NVARCHAR(7) NOT NULL DEFAULT '#ffc107',
    BorderRadius NVARCHAR(10) NOT NULL DEFAULT '8',
    ShowRating BIT NOT NULL DEFAULT 1,
    ShowImage BIT NOT NULL DEFAULT 1,
    ShowTitle BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Insert default values if table is empty
IF NOT EXISTS (SELECT *
FROM TestimonialsDesign)
INSERT INTO TestimonialsDesign
    (
    Theme, Layout, PerRow, Animation, BgColor, TextColor, AccentColor,
    BorderRadius, ShowRating, ShowImage, ShowTitle
    )
VALUES
    (
        'default', 'grid', '3', 'none', '#ffffff', '#333333', '#ffc107',
        '8', 1, 1, 1
);

-- Add indexes for better performance
CREATE INDEX IX_TestimonialsDesign_UpdatedAt ON TestimonialsDesign(UpdatedAt);
CREATE INDEX IX_TestimonialsDesign_Theme ON TestimonialsDesign(Theme);
