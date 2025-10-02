-- Product Discounts Schema for Microsoft SQL Server (MSSQL)
-- This schema supports discount management for featured products

-- Create ProductDiscounts table
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='ProductDiscounts' AND xtype='U')
BEGIN
    CREATE TABLE ProductDiscounts
    (
        DiscountID INT IDENTITY(1,1) PRIMARY KEY,
        ProductID INT NOT NULL,
        DiscountType NVARCHAR(20) NOT NULL CHECK (DiscountType IN ('percentage', 'fixed')),
        DiscountValue DECIMAL(10,2) NOT NULL,
        StartDate DATETIME2 NOT NULL,
        EndDate DATETIME2 NOT NULL,
        IsActive BIT NOT NULL DEFAULT(1),
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        CreatedBy INT NULL,
        -- UserID who created the discount

        -- Foreign key constraints
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
        FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) ON DELETE SET NULL,

        -- Ensure only one active discount per product at a time
        CONSTRAINT UQ_ProductActiveDiscount UNIQUE (ProductID, IsActive)
        WHERE IsActive = 1
    );

        PRINT 'ProductDiscounts table created successfully.';
    END
ELSE
BEGIN
        PRINT 'ProductDiscounts table already exists.';
    END
GO

    -- Create indexes for better performance
    IF NOT EXISTS (SELECT *
    FROM sys.indexes
    WHERE name='IX_ProductDiscounts_ProductID' AND object_id = OBJECT_ID('ProductDiscounts'))
    CREATE INDEX IX_ProductDiscounts_ProductID ON ProductDiscounts(ProductID);
GO

    IF NOT EXISTS (SELECT *
    FROM sys.indexes
    WHERE name='IX_ProductDiscounts_IsActive' AND object_id = OBJECT_ID('ProductDiscounts'))
    CREATE INDEX IX_ProductDiscounts_IsActive ON ProductDiscounts(IsActive);
GO

    IF NOT EXISTS (SELECT *
    FROM sys.indexes
    WHERE name='IX_ProductDiscounts_Dates' AND object_id = OBJECT_ID('ProductDiscounts'))
    CREATE INDEX IX_ProductDiscounts_Dates ON ProductDiscounts(StartDate, EndDate);
GO

    IF NOT EXISTS (SELECT *
    FROM sys.indexes
    WHERE name='IX_ProductDiscounts_CreatedAt' AND object_id = OBJECT_ID('ProductDiscounts'))
    CREATE INDEX IX_ProductDiscounts_CreatedAt ON ProductDiscounts(CreatedAt DESC);
GO

    -- Create a view for products with their current discounts
    IF NOT EXISTS (SELECT *
    FROM sysobjects
    WHERE name='vw_ProductsWithDiscounts' AND xtype='V')
BEGIN
        EXEC('CREATE VIEW vw_ProductsWithDiscounts AS
    SELECT 
        p.ProductID,
        p.Name,
        p.Description,
        p.Price as OriginalPrice,
        p.StockQuantity,
        p.Category,
        p.ImageURL,
        p.DateAdded,
        p.IsActive,
        p.IsFeatured,
        p.Dimensions,
        pd.DiscountID,
        pd.DiscountType,
        pd.DiscountValue,
        pd.StartDate as DiscountStartDate,
        pd.EndDate as DiscountEndDate,
        pd.IsActive as DiscountIsActive,
        pd.CreatedAt as DiscountCreatedAt,
        CASE 
            WHEN pd.DiscountType = ''percentage'' THEN 
                p.Price - (p.Price * pd.DiscountValue / 100)
            WHEN pd.DiscountType = ''fixed'' THEN 
                GREATEST(p.Price - pd.DiscountValue, 0)
            ELSE p.Price
        END as DiscountedPrice,
        CASE 
            WHEN pd.DiscountType = ''percentage'' THEN 
                p.Price * pd.DiscountValue / 100
            WHEN pd.DiscountType = ''fixed'' THEN 
                LEAST(pd.DiscountValue, p.Price)
            ELSE 0
        END as DiscountAmount
    FROM Products p
    LEFT JOIN ProductDiscounts pd ON p.ProductID = pd.ProductID 
        AND pd.IsActive = 1 
        AND GETDATE() BETWEEN pd.StartDate AND pd.EndDate
    WHERE p.IsActive = 1');

        PRINT 'View vw_ProductsWithDiscounts created successfully.';
    END
ELSE
BEGIN
        PRINT 'View vw_ProductsWithDiscounts already exists.';
    END
GO

    -- Create stored procedure for adding a product discount
    IF NOT EXISTS (SELECT *
    FROM sysobjects
    WHERE name='sp_AddProductDiscount' AND xtype='P')
BEGIN
        EXEC('CREATE PROCEDURE sp_AddProductDiscount
        @ProductID INT,
        @DiscountType NVARCHAR(20),
        @DiscountValue DECIMAL(10,2),
        @StartDate DATETIME2,
        @EndDate DATETIME2,
        @CreatedBy INT = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        BEGIN TRY
            BEGIN TRANSACTION;
            
            -- Validate inputs
            IF @DiscountValue <= 0
            BEGIN
                RAISERROR(''Discount value must be greater than 0'', 16, 1);
                RETURN;
            END
            
            IF @DiscountType = ''percentage'' AND @DiscountValue > 100
            BEGIN
                RAISERROR(''Percentage discount cannot exceed 100%'', 16, 1);
                RETURN;
            END
            
            IF @StartDate >= @EndDate
            BEGIN
                RAISERROR(''Start date must be before end date'', 16, 1);
                RETURN;
            END
            
            -- Deactivate any existing active discount for this product
            UPDATE ProductDiscounts 
            SET IsActive = 0, UpdatedAt = GETDATE()
            WHERE ProductID = @ProductID AND IsActive = 1;
            
            -- Insert new discount
            INSERT INTO ProductDiscounts (
                ProductID, DiscountType, DiscountValue, 
                StartDate, EndDate, CreatedBy
            )
            VALUES (
                @ProductID, @DiscountType, @DiscountValue, 
                @StartDate, @EndDate, @CreatedBy
            );
            
            COMMIT TRANSACTION;
            
            SELECT SCOPE_IDENTITY() as NewDiscountID;
            
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0
                ROLLBACK TRANSACTION;
            
            THROW;
        END CATCH
    END');

        PRINT 'Stored procedure sp_AddProductDiscount created successfully.';
    END
ELSE
BEGIN
        PRINT 'Stored procedure sp_AddProductDiscount already exists.';
    END
GO

    -- Create stored procedure for removing a product discount
    IF NOT EXISTS (SELECT *
    FROM sysobjects
    WHERE name='sp_RemoveProductDiscount' AND xtype='P')
BEGIN
        EXEC('CREATE PROCEDURE sp_RemoveProductDiscount
        @ProductID INT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        UPDATE ProductDiscounts 
        SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE ProductID = @ProductID AND IsActive = 1;
        
        SELECT @@ROWCOUNT as RowsAffected;
    END');

        PRINT 'Stored procedure sp_RemoveProductDiscount created successfully.';
    END
ELSE
BEGIN
        PRINT 'Stored procedure sp_RemoveProductDiscount already exists.';
    END
GO

    -- Create stored procedure for getting product discount information
    IF NOT EXISTS (SELECT *
    FROM sysobjects
    WHERE name='sp_GetProductDiscount' AND xtype='P')
BEGIN
        EXEC('CREATE PROCEDURE sp_GetProductDiscount
        @ProductID INT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        SELECT 
            pd.DiscountID,
            pd.ProductID,
            pd.DiscountType,
            pd.DiscountValue,
            pd.StartDate,
            pd.EndDate,
            pd.IsActive,
            pd.CreatedAt,
            pd.UpdatedAt,
            p.Price as OriginalPrice,
            CASE 
                WHEN pd.DiscountType = ''percentage'' THEN 
                    p.Price - (p.Price * pd.DiscountValue / 100)
                WHEN pd.DiscountType = ''fixed'' THEN 
                    GREATEST(p.Price - pd.DiscountValue, 0)
                ELSE p.Price
            END as DiscountedPrice,
            CASE 
                WHEN pd.DiscountType = ''percentage'' THEN 
                    p.Price * pd.DiscountValue / 100
                WHEN pd.DiscountType = ''fixed'' THEN 
                    LEAST(pd.DiscountValue, p.Price)
                ELSE 0
            END as DiscountAmount
        FROM ProductDiscounts pd
        INNER JOIN Products p ON pd.ProductID = p.ProductID
        WHERE pd.ProductID = @ProductID 
        AND pd.IsActive = 1 
        AND GETDATE() BETWEEN pd.StartDate AND pd.EndDate;
    END');

        PRINT 'Stored procedure sp_GetProductDiscount created successfully.';
    END
ELSE
BEGIN
        PRINT 'Stored procedure sp_GetProductDiscount already exists.';
    END
GO

    -- Create trigger to update UpdatedAt timestamp
    IF NOT EXISTS (SELECT *
    FROM sys.triggers
    WHERE name = 'TR_ProductDiscounts_UpdateTimestamp')
BEGIN
        EXEC('CREATE TRIGGER TR_ProductDiscounts_UpdateTimestamp
    ON ProductDiscounts
    AFTER UPDATE
    AS
    BEGIN
        UPDATE ProductDiscounts 
        SET UpdatedAt = GETDATE()
        FROM ProductDiscounts pd
        INNER JOIN inserted i ON pd.DiscountID = i.DiscountID;
    END');

        PRINT 'Trigger TR_ProductDiscounts_UpdateTimestamp created successfully.';
    END
ELSE
BEGIN
        PRINT 'Trigger TR_ProductDiscounts_UpdateTimestamp already exists.';
    END
GO

    PRINT 'Product Discounts schema setup completed successfully!';
    PRINT 'Tables: ProductDiscounts';
    PRINT 'Views: vw_ProductsWithDiscounts';
    PRINT 'Stored Procedures: sp_AddProductDiscount, sp_RemoveProductDiscount, sp_GetProductDiscount';
    PRINT 'Triggers: TR_ProductDiscounts_UpdateTimestamp';
