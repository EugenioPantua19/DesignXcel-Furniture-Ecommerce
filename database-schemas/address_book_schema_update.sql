-- Address Book Schema Update for Multiple Addresses
-- This script ensures the CustomerAddresses table supports multiple addresses per customer

USE DesignXcelDB;
GO

-- Check if CustomerAddresses table exists and has the correct structure
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='CustomerAddresses' AND xtype='U')
BEGIN
    -- Create CustomerAddresses table if it doesn't exist
    CREATE TABLE CustomerAddresses
    (
        AddressID INT PRIMARY KEY IDENTITY,
        CustomerID INT FOREIGN KEY REFERENCES Customers(CustomerID),
        Label NVARCHAR(50),
        HouseNumber NVARCHAR(50),
        Street NVARCHAR(100),
        Barangay NVARCHAR(100),
        City NVARCHAR(100),
        Province NVARCHAR(100),
        Region NVARCHAR(100),
        PostalCode NVARCHAR(20),
        Country NVARCHAR(100) DEFAULT 'Philippines',
        IsDefault BIT DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE()
    );

    PRINT 'CustomerAddresses table created successfully.';
END
ELSE
BEGIN
    -- Check if all required columns exist
    IF NOT EXISTS (SELECT *
    FROM sys.columns
    WHERE object_id = OBJECT_ID('CustomerAddresses') AND name = 'Label')
    BEGIN
        ALTER TABLE CustomerAddresses ADD Label NVARCHAR(50);
        PRINT 'Added Label column to CustomerAddresses table.';
    END

    IF NOT EXISTS (SELECT *
    FROM sys.columns
    WHERE object_id = OBJECT_ID('CustomerAddresses') AND name = 'IsDefault')
    BEGIN
        ALTER TABLE CustomerAddresses ADD IsDefault BIT DEFAULT 0;
        PRINT 'Added IsDefault column to CustomerAddresses table.';
    END

    IF NOT EXISTS (SELECT *
    FROM sys.columns
    WHERE object_id = OBJECT_ID('CustomerAddresses') AND name = 'CreatedAt')
    BEGIN
        ALTER TABLE CustomerAddresses ADD CreatedAt DATETIME DEFAULT GETDATE();
        PRINT 'Added CreatedAt column to CustomerAddresses table.';
    END

    PRINT 'CustomerAddresses table structure verified and updated.';
END
GO

-- Create indexes for better performance
IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'IX_CustomerAddresses_CustomerID' AND object_id = OBJECT_ID('CustomerAddresses'))
BEGIN
    CREATE INDEX IX_CustomerAddresses_CustomerID ON CustomerAddresses(CustomerID);
    PRINT 'Created index on CustomerID.';
END

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'IX_CustomerAddresses_IsDefault' AND object_id = OBJECT_ID('CustomerAddresses'))
BEGIN
    CREATE INDEX IX_CustomerAddresses_IsDefault ON CustomerAddresses(IsDefault);
    PRINT 'Created index on IsDefault.';
END

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'IX_CustomerAddresses_CreatedAt' AND object_id = OBJECT_ID('CustomerAddresses'))
BEGIN
    CREATE INDEX IX_CustomerAddresses_CreatedAt ON CustomerAddresses(CreatedAt);
    PRINT 'Created index on CreatedAt.';
END
GO

-- Ensure there's a default address for existing customers (if they have addresses)
UPDATE ca
SET IsDefault = 1
FROM CustomerAddresses ca
    INNER JOIN (
    SELECT CustomerID, MIN(AddressID) as FirstAddressID
    FROM CustomerAddresses
    WHERE IsDefault = 0 OR IsDefault IS NULL
    GROUP BY CustomerID
) first_addr ON ca.CustomerID = first_addr.CustomerID AND ca.AddressID = first_addr.FirstAddressID
WHERE ca.IsDefault = 0 OR ca.IsDefault IS NULL;
GO

PRINT 'Address Book schema update completed successfully!';
PRINT 'Features enabled:';
PRINT '- Multiple addresses per customer (up to 2)';
PRINT '- Address labels (Home, Office, etc.)';
PRINT '- Default address selection';
PRINT '- Address management (add, edit, delete, set default)';
