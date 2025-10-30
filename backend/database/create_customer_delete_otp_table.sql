-- Create CustomerDeleteOTP table for account deletion verification
-- This table stores OTP codes sent to customers for account deletion verification

CREATE TABLE CustomerDeleteOTP (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT NOT NULL,
    OTP NVARCHAR(6) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    IsUsed BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UsedAt DATETIME NULL,
    
    -- Foreign key constraint
    CONSTRAINT FK_CustomerDeleteOTP_CustomerID 
        FOREIGN KEY (CustomerID) 
        REFERENCES Customers(CustomerID) 
        ON DELETE CASCADE,
    
    -- Index for performance
    INDEX IX_CustomerDeleteOTP_CustomerID (CustomerID),
    INDEX IX_CustomerDeleteOTP_ExpiresAt (ExpiresAt),
    INDEX IX_CustomerDeleteOTP_OTP (OTP)
);

-- Add comments for documentation
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Stores OTP codes for customer account deletion verification', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'CustomerDeleteOTP';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Customer ID reference', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'CustomerDeleteOTP', 
    @level2type = N'COLUMN', @level2name = N'CustomerID';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'6-digit OTP code', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'CustomerDeleteOTP', 
    @level2type = N'COLUMN', @level2name = N'OTP';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'OTP expiration timestamp', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'CustomerDeleteOTP', 
    @level2type = N'COLUMN', @level2name = N'ExpiresAt';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Whether the OTP has been used', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'CustomerDeleteOTP', 
    @level2type = N'COLUMN', @level2name = N'IsUsed';
