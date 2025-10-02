-- Walk In Orders Schema Update
-- This script renames the BulkOrders table to WalkInOrders and updates all related components

USE DesignXcelDB;
GO

-- Step 1: Rename the BulkOrders table to WalkInOrders
IF EXISTS (SELECT *
FROM sys.tables
WHERE name = 'BulkOrders')
BEGIN
    EXEC sp_rename 'BulkOrders', 'WalkInOrders';
    PRINT 'Table BulkOrders renamed to WalkInOrders successfully.';
END
ELSE
BEGIN
    PRINT 'Table BulkOrders does not exist. Creating WalkInOrders table...';

    -- Create WalkInOrders table if BulkOrders doesn't exist
    CREATE TABLE WalkInOrders
    (
        WalkInOrderID INT IDENTITY(1,1) PRIMARY KEY,
        CustomerName NVARCHAR(255) NOT NULL,
        Address NVARCHAR(MAX) NULL,
        ContactNumber NVARCHAR(100) NULL,
        ContactEmail NVARCHAR(255) NULL,
        OrderedProducts NVARCHAR(MAX) NULL,
        -- free-text/JSON description
        Discount DECIMAL(10,2) NULL DEFAULT(0),
        TotalAmount DECIMAL(10,2) NOT NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT('Processing'),
        ExpectedArrival DATETIME NULL,
        CompletedAt DATETIME NULL,
        CreatedAt DATETIME NOT NULL DEFAULT(GETDATE())
    );

    PRINT 'WalkInOrders table created successfully.';
END
GO

-- Step 2: Add status constraint (idempotent)
IF NOT EXISTS (
    SELECT 1
FROM sys.check_constraints
WHERE name = 'CHK_WalkInOrders_Status' AND parent_object_id = OBJECT_ID('WalkInOrders')
)
BEGIN
    ALTER TABLE WalkInOrders WITH NOCHECK
    ADD CONSTRAINT CHK_WalkInOrders_Status
    CHECK (Status IN ('Processing', 'On delivery', 'Completed'));

    PRINT 'Status constraint added to WalkInOrders table.';
END
ELSE
BEGIN
    PRINT 'Status constraint already exists on WalkInOrders table.';
END
GO

-- Step 3: Create helpful indexes
IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE name = 'IX_WalkInOrders_Status' AND object_id = OBJECT_ID('WalkInOrders'))
BEGIN
    CREATE INDEX IX_WalkInOrders_Status ON WalkInOrders(Status);
    PRINT 'Index IX_WalkInOrders_Status created.';
END
ELSE
BEGIN
    PRINT 'Index IX_WalkInOrders_Status already exists.';
END
GO

IF NOT EXISTS (SELECT 1
FROM sys.indexes
WHERE name = 'IX_WalkInOrders_CreatedAt' AND object_id = OBJECT_ID('WalkInOrders'))
BEGIN
    CREATE INDEX IX_WalkInOrders_CreatedAt ON WalkInOrders(CreatedAt DESC);
    PRINT 'Index IX_WalkInOrders_CreatedAt created.';
END
ELSE
BEGIN
    PRINT 'Index IX_WalkInOrders_CreatedAt already exists.';
END
GO

-- Step 4: Create a view for backward compatibility (optional)
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='vw_WalkInOrders' AND xtype='V')
BEGIN
    EXEC('CREATE VIEW vw_WalkInOrders AS
    SELECT 
        WalkInOrderID as BulkOrderID,  -- For backward compatibility
        CustomerName,
        Address,
        ContactNumber,
        ContactEmail,
        OrderedProducts,
        Discount,
        TotalAmount,
        Status,
        ExpectedArrival,
        CompletedAt,
        CreatedAt
    FROM WalkInOrders');

    PRINT 'View vw_WalkInOrders created for backward compatibility.';
END
ELSE
BEGIN
    PRINT 'View vw_WalkInOrders already exists.';
END
GO

-- Step 5: Create stored procedures for Walk In Orders management
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='sp_AddWalkInOrder' AND xtype='P')
BEGIN
    EXEC('CREATE PROCEDURE sp_AddWalkInOrder
        @CustomerName NVARCHAR(255),
        @Address NVARCHAR(MAX) = NULL,
        @ContactNumber NVARCHAR(100) = NULL,
        @ContactEmail NVARCHAR(255) = NULL,
        @OrderedProducts NVARCHAR(MAX) = NULL,
        @Discount DECIMAL(10,2) = 0,
        @TotalAmount DECIMAL(10,2),
        @ExpectedArrival DATETIME = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        INSERT INTO WalkInOrders (
            CustomerName, Address, ContactNumber, ContactEmail, 
            OrderedProducts, Discount, TotalAmount, ExpectedArrival
        )
        VALUES (
            @CustomerName, @Address, @ContactNumber, @ContactEmail,
            @OrderedProducts, @Discount, @TotalAmount, @ExpectedArrival
        );
        
        SELECT SCOPE_IDENTITY() as NewWalkInOrderID;
    END');

    PRINT 'Stored procedure sp_AddWalkInOrder created.';
END
ELSE
BEGIN
    PRINT 'Stored procedure sp_AddWalkInOrder already exists.';
END
GO

IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='sp_UpdateWalkInOrderStatus' AND xtype='P')
BEGIN
    EXEC('CREATE PROCEDURE sp_UpdateWalkInOrderStatus
        @WalkInOrderID INT,
        @Status NVARCHAR(50)
    AS
    BEGIN
        SET NOCOUNT ON;
        
        UPDATE WalkInOrders 
        SET Status = @Status,
            CompletedAt = CASE WHEN @Status = ''Completed'' THEN GETDATE() ELSE CompletedAt END
        WHERE WalkInOrderID = @WalkInOrderID;
        
        SELECT @@ROWCOUNT as RowsAffected;
    END');

    PRINT 'Stored procedure sp_UpdateWalkInOrderStatus created.';
END
ELSE
BEGIN
    PRINT 'Stored procedure sp_UpdateWalkInOrderStatus already exists.';
END
GO

IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='sp_GetWalkInOrders' AND xtype='P')
BEGIN
    EXEC('CREATE PROCEDURE sp_GetWalkInOrders
        @Status NVARCHAR(50) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        IF @Status IS NULL OR @Status = ''''
        BEGIN
            SELECT * FROM WalkInOrders ORDER BY CreatedAt DESC;
        END
        ELSE
        BEGIN
            SELECT * FROM WalkInOrders WHERE Status = @Status ORDER BY CreatedAt DESC;
        END
    END');

    PRINT 'Stored procedure sp_GetWalkInOrders created.';
END
ELSE
BEGIN
    PRINT 'Stored procedure sp_GetWalkInOrders already exists.';
END
GO

-- Step 6: Update any existing data if needed
-- This section can be used to migrate data or update existing records

PRINT 'Walk In Orders schema update completed successfully!';
PRINT 'Changes made:';
PRINT '1. Table BulkOrders renamed to WalkInOrders';
PRINT '2. Primary key renamed from BulkOrderID to WalkInOrderID';
PRINT '3. Status constraint updated';
PRINT '4. Indexes created/updated';
PRINT '5. View vw_WalkInOrders created for backward compatibility';
PRINT '6. Stored procedures created for Walk In Orders management';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Update backend code to use WalkInOrders table';
PRINT '2. Update all SQL queries to reference WalkInOrderID instead of BulkOrderID';
PRINT '3. Test the application thoroughly';
