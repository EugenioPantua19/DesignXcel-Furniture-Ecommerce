-- Orders Schema Fix
-- This script ensures the Orders table has the correct structure for the orders flow

USE DesignXcelDB;
GO

-- Check if Orders table exists, if not create it
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Orders')
BEGIN
    CREATE TABLE Orders (
        OrderID INT IDENTITY(1,1) PRIMARY KEY,
        CustomerID INT NOT NULL,
        OrderDate DATETIME NOT NULL DEFAULT GETDATE(),
        Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        TotalAmount DECIMAL(10,2) NOT NULL,
        PaymentMethod NVARCHAR(50) NOT NULL,
        Currency NVARCHAR(10) DEFAULT 'PHP',
        PaymentDate DATETIME NULL,
        ShippingAddressID INT NULL,
        DeliveryType NVARCHAR(20) NOT NULL DEFAULT 'pickup',
        DeliveryCost DECIMAL(10,2) NOT NULL DEFAULT 0,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        
        -- Foreign key constraints
        CONSTRAINT FK_Orders_Customers FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
        CONSTRAINT FK_Orders_Addresses FOREIGN KEY (ShippingAddressID) REFERENCES CustomerAddresses(AddressID),
        
        -- Check constraints
        CONSTRAINT CHK_Orders_Status CHECK (Status IN ('Pending', 'Processing', 'Shipping', 'Delivered', 'Completed', 'Cancelled')),
        CONSTRAINT CHK_Orders_PaymentMethod CHECK (PaymentMethod IN ('Cash on Delivery', 'Credit Card', 'Debit Card', 'PayPal', 'Stripe')),
        CONSTRAINT CHK_Orders_DeliveryType CHECK (DeliveryType = 'pickup' OR DeliveryType LIKE 'rate_%'),
        CONSTRAINT CHK_Orders_TotalAmount CHECK (TotalAmount >= 0),
        CONSTRAINT CHK_Orders_DeliveryCost CHECK (DeliveryCost >= 0)
    );
    
    PRINT 'Orders table created successfully.';
END
ELSE
BEGIN
    PRINT 'Orders table already exists. Checking and adding missing columns...';
    
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'DeliveryType')
    BEGIN
        ALTER TABLE Orders ADD DeliveryType NVARCHAR(20) NOT NULL DEFAULT 'pickup';
        PRINT 'Added DeliveryType column.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'DeliveryCost')
    BEGIN
        ALTER TABLE Orders ADD DeliveryCost DECIMAL(10,2) NOT NULL DEFAULT 0;
        PRINT 'Added DeliveryCost column.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'CreatedAt')
    BEGIN
        ALTER TABLE Orders ADD CreatedAt DATETIME NOT NULL DEFAULT GETDATE();
        PRINT 'Added CreatedAt column.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'UpdatedAt')
    BEGIN
        ALTER TABLE Orders ADD UpdatedAt DATETIME NOT NULL DEFAULT GETDATE();
        PRINT 'Added UpdatedAt column.';
    END
    
    -- Add foreign key constraints if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Orders_Customers')
    BEGIN
        ALTER TABLE Orders ADD CONSTRAINT FK_Orders_Customers FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID);
        PRINT 'Added FK_Orders_Customers constraint.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Orders_Addresses')
    BEGIN
        ALTER TABLE Orders ADD CONSTRAINT FK_Orders_Addresses FOREIGN KEY (ShippingAddressID) REFERENCES CustomerAddresses(AddressID);
        PRINT 'Added FK_Orders_Addresses constraint.';
    END
    
    -- Add check constraints if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_Orders_Status')
    BEGIN
        ALTER TABLE Orders ADD CONSTRAINT CHK_Orders_Status CHECK (Status IN ('Pending', 'Processing', 'Shipping', 'Delivered', 'Completed', 'Cancelled'));
        PRINT 'Added CHK_Orders_Status constraint.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_Orders_DeliveryType')
    BEGIN
        ALTER TABLE Orders ADD CONSTRAINT CHK_Orders_DeliveryType CHECK (DeliveryType = 'pickup' OR DeliveryType LIKE 'rate_%');
        PRINT 'Added CHK_Orders_DeliveryType constraint.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_Orders_TotalAmount')
    BEGIN
        ALTER TABLE Orders ADD CONSTRAINT CHK_Orders_TotalAmount CHECK (TotalAmount >= 0);
        PRINT 'Added CHK_Orders_TotalAmount constraint.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_Orders_DeliveryCost')
    BEGIN
        ALTER TABLE Orders ADD CONSTRAINT CHK_Orders_DeliveryCost CHECK (DeliveryCost >= 0);
        PRINT 'Added CHK_Orders_DeliveryCost constraint.';
    END
END
GO

-- Check if OrderItems table exists, if not create it
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderItems')
BEGIN
    CREATE TABLE OrderItems (
        OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
        OrderID INT NOT NULL,
        ProductID INT NOT NULL,
        Quantity INT NOT NULL,
        PriceAtPurchase DECIMAL(10,2) NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        
        -- Foreign key constraints
        CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
        
        -- Check constraints
        CONSTRAINT CHK_OrderItems_Quantity CHECK (Quantity > 0),
        CONSTRAINT CHK_OrderItems_Price CHECK (PriceAtPurchase >= 0)
    );
    
    PRINT 'OrderItems table created successfully.';
END
ELSE
BEGIN
    PRINT 'OrderItems table already exists. Checking and adding missing columns...';
    
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderItems') AND name = 'CreatedAt')
    BEGIN
        ALTER TABLE OrderItems ADD CreatedAt DATETIME NOT NULL DEFAULT GETDATE();
        PRINT 'Added CreatedAt column to OrderItems.';
    END
    
    -- Add foreign key constraints if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_OrderItems_Orders')
    BEGIN
        ALTER TABLE OrderItems ADD CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE;
        PRINT 'Added FK_OrderItems_Orders constraint.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_OrderItems_Products')
    BEGIN
        ALTER TABLE OrderItems ADD CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID);
        PRINT 'Added FK_OrderItems_Products constraint.';
    END
    
    -- Add check constraints if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_OrderItems_Quantity')
    BEGIN
        ALTER TABLE OrderItems ADD CONSTRAINT CHK_OrderItems_Quantity CHECK (Quantity > 0);
        PRINT 'Added CHK_OrderItems_Quantity constraint.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_OrderItems_Price')
    BEGIN
        ALTER TABLE OrderItems ADD CONSTRAINT CHK_OrderItems_Price CHECK (PriceAtPurchase >= 0);
        PRINT 'Added CHK_OrderItems_Price constraint.';
    END
END
GO

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_CustomerID' AND object_id = OBJECT_ID('Orders'))
BEGIN
    CREATE INDEX IX_Orders_CustomerID ON Orders(CustomerID);
    PRINT 'Created index IX_Orders_CustomerID.';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_Status' AND object_id = OBJECT_ID('Orders'))
BEGIN
    CREATE INDEX IX_Orders_Status ON Orders(Status);
    PRINT 'Created index IX_Orders_Status.';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_OrderDate' AND object_id = OBJECT_ID('Orders'))
BEGIN
    CREATE INDEX IX_Orders_OrderDate ON Orders(OrderDate DESC);
    PRINT 'Created index IX_Orders_OrderDate.';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_OrderItems_OrderID' AND object_id = OBJECT_ID('OrderItems'))
BEGIN
    CREATE INDEX IX_OrderItems_OrderID ON OrderItems(OrderID);
    PRINT 'Created index IX_OrderItems_OrderID.';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_OrderItems_ProductID' AND object_id = OBJECT_ID('OrderItems'))
BEGIN
    CREATE INDEX IX_OrderItems_ProductID ON OrderItems(ProductID);
    PRINT 'Created index IX_OrderItems_ProductID.';
END
GO

-- Create a trigger to update UpdatedAt column
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Orders_UpdateTimestamp')
BEGIN
    EXEC('CREATE TRIGGER TR_Orders_UpdateTimestamp
    ON Orders
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE Orders 
        SET UpdatedAt = GETDATE()
        WHERE OrderID IN (SELECT OrderID FROM inserted);
    END');
    PRINT 'Created trigger TR_Orders_UpdateTimestamp.';
END
GO

PRINT 'Orders schema fix completed successfully!';
PRINT 'Changes made:';
PRINT '1. Ensured Orders table has correct structure';
PRINT '2. Ensured OrderItems table has correct structure';
PRINT '3. Added proper foreign key constraints';
PRINT '4. Added check constraints for data validation';
PRINT '5. Created performance indexes';
PRINT '6. Added update timestamp trigger';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Test order creation functionality';
PRINT '2. Test order status updates';
PRINT '3. Verify order history display';
