-- Header Banner Schema
-- This table stores the color customization settings for different header sections

IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='HeaderBanner' and xtype='U')
CREATE TABLE HeaderBanner
(
    ID INT PRIMARY KEY IDENTITY(1,1),
    ContactBgColor NVARCHAR(7) NOT NULL DEFAULT '#f8f9fa',
    ContactTextColor NVARCHAR(7) NOT NULL DEFAULT '#6c757d',
    MainBgColor NVARCHAR(7) NOT NULL DEFAULT '#ffffff',
    MainTextColor NVARCHAR(7) NOT NULL DEFAULT '#333333',
    NavBgColor NVARCHAR(7) NOT NULL DEFAULT '#343a40',
    NavTextColor NVARCHAR(7) NOT NULL DEFAULT '#ffffff',
    NavHoverColor NVARCHAR(7) NOT NULL DEFAULT '#007bff',
    SearchBorderColor NVARCHAR(7) NOT NULL DEFAULT '#ffc107',
    SearchBtnColor NVARCHAR(7) NOT NULL DEFAULT '#ffc107',
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Insert default values if table is empty
IF NOT EXISTS (SELECT *
FROM HeaderBanner)
INSERT INTO HeaderBanner
    (
    ContactBgColor, ContactTextColor,
    MainBgColor, MainTextColor,
    NavBgColor, NavTextColor, NavHoverColor,
    SearchBorderColor, SearchBtnColor
    )
VALUES
    (
        '#f8f9fa', '#6c757d',
        '#ffffff', '#333333',
        '#343a40', '#ffffff', '#007bff',
        '#ffc107', '#ffc107'
);

-- Add indexes for better performance
CREATE INDEX IX_HeaderBanner_UpdatedAt ON HeaderBanner(UpdatedAt);
