-- AddProductStock Stored Procedure
-- This procedure handles adding stock to products and deducting raw materials
-- It's called when stock is increased in the admin panel

USE DesignXcellDB;
GO

-- Check if the stored procedure exists and drop it if it does
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'AddProductStock')
BEGIN
    DROP PROCEDURE AddProductStock;
    PRINT 'Existing AddProductStock procedure dropped.';
END
GO

-- Create the AddProductStock stored procedure
CREATE PROCEDURE AddProductStock
    @ProductID INT,
    @QuantityToAdd INT,
    @PerformedBy INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validate inputs
        IF @ProductID IS NULL OR @ProductID <= 0
        BEGIN
            RAISERROR('Invalid Product ID', 16, 1);
            RETURN;
        END
        
        IF @QuantityToAdd IS NULL OR @QuantityToAdd <= 0
        BEGIN
            RAISERROR('Quantity to add must be greater than 0', 16, 1);
            RETURN;
        END
        
        -- Check if product exists
        IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductID = @ProductID)
        BEGIN
            RAISERROR('Product not found', 16, 1);
            RETURN;
        END
        
        -- Get product details
        DECLARE @ProductName NVARCHAR(255);
        DECLARE @CurrentStock INT;
        
        SELECT @ProductName = Name, @CurrentStock = StockQuantity 
        FROM Products 
        WHERE ProductID = @ProductID;
        
        -- Check if there are any raw materials required for this product
        -- For now, we'll just update the stock directly
        -- In a more complex system, you might want to check raw materials here
        
        -- Update the product stock
        UPDATE Products 
        SET StockQuantity = StockQuantity + @QuantityToAdd,
            LastUpdated = GETDATE()
        WHERE ProductID = @ProductID;
        
        -- Log the stock addition
        INSERT INTO ActivityLogs (UserID, Action, TableAffected, Description, Timestamp)
        VALUES (
            @PerformedBy, 
            'UPDATE', 
            'Products', 
            'Stock increased for "' + @ProductName + '" (ID: ' + CAST(@ProductID AS NVARCHAR(10)) + ') by ' + CAST(@QuantityToAdd AS NVARCHAR(10)) + ' units',
            GETDATE()
        );
        
        COMMIT TRANSACTION;
        
        -- Return success
        SELECT 
            @ProductID as ProductID,
            @ProductName as ProductName,
            @CurrentStock as OldStock,
            (@CurrentStock + @QuantityToAdd) as NewStock,
            @QuantityToAdd as QuantityAdded;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        -- Re-raise the error
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

PRINT 'AddProductStock stored procedure created successfully.';
GO

-- Test the procedure (optional - remove in production)
/*
DECLARE @TestProductID INT = 1; -- Replace with actual product ID
DECLARE @TestQuantity INT = 5;
DECLARE @TestUserID INT = 1; -- Replace with actual user ID

EXEC AddProductStock @ProductID = @TestProductID, @QuantityToAdd = @TestQuantity, @PerformedBy = @TestUserID;
*/
