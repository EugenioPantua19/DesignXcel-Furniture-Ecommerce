-- Header Offer Bar Database Schema for MSSQL
-- This table stores the settings for the promotional banner at the top of the website

CREATE TABLE HeaderOfferBar
(
    ID INT IDENTITY(1,1) PRIMARY KEY,
    OfferText NVARCHAR(500) NOT NULL,
    ButtonText NVARCHAR(100) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'active',
    -- 'active', 'inactive', 'scheduled'
    BackgroundColor NVARCHAR(7) NOT NULL DEFAULT '#ffc107',
    -- Hex color code
    TextColor NVARCHAR(7) NOT NULL DEFAULT '#ffffff',
    -- Hex color code
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Insert default header offer bar settings
INSERT INTO HeaderOfferBar
    (OfferText, ButtonText, StartDate, EndDate, Status, BackgroundColor, TextColor)
VALUES
    (
        'SPECIAL OFFER Get 25% off premium office furniture collections - Limited time offer ending soon!',
        'Shop Now',
        GETDATE(),
        DATEADD(month, 1, GETDATE()), -- End date 1 month from now
        'active',
        '#ffc107',
        '#ffffff'
);

-- Create index for better performance
CREATE INDEX IX_HeaderOfferBar_Status ON HeaderOfferBar(Status);
CREATE INDEX IX_HeaderOfferBar_Dates ON HeaderOfferBar(StartDate, EndDate); 