-- Update CustomerAddresses Country column size to NVARCHAR(255)
-- This allows encrypted data to fit properly

USE DesignXcellDB;
GO

-- Update Country column size
ALTER TABLE CustomerAddresses 
ALTER COLUMN Country NVARCHAR(255);
GO

PRINT 'Country column size updated to NVARCHAR(255)';
GO
