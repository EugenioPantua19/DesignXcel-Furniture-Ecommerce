-- Create OTPVerification table for user registration and verification
-- This table stores OTP codes sent to users for registration verification

CREATE TABLE OTPVerification (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL,
    OTP NVARCHAR(10) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    IsUsed BIT NOT NULL DEFAULT 0,
    UsedAt DATETIME NULL,
    
    -- Index for performance
    INDEX IX_OTPVerification_Email (Email),
    INDEX IX_OTPVerification_ExpiresAt (ExpiresAt),
    INDEX IX_OTPVerification_OTP (OTP)
);

-- Add comments for documentation
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Stores OTP codes for user registration and email verification', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'OTPVerification';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'User email address', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'OTPVerification', 
    @level2type = N'COLUMN', @level2name = N'Email';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Verification OTP code', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'OTPVerification', 
    @level2type = N'COLUMN', @level2name = N'OTP';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'OTP expiration timestamp', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'OTPVerification', 
    @level2type = N'COLUMN', @level2name = N'ExpiresAt';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Whether the OTP has been used', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'OTPVerification', 
    @level2type = N'COLUMN', @level2name = N'IsUsed';

PRINT 'OTPVerification table created successfully!';
