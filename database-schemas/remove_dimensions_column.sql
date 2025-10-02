-- Remove Dimensions Column from Products Table and Update View
-- This script removes the Dimensions column from the Products table and updates the vw_ProductsWithDiscounts view

-- 1) Update the vw_ProductsWithDiscounts view
IF OBJECT_ID('dbo.vw_ProductsWithDiscounts', 'V') IS NOT NULL
BEGIN
    EXEC('ALTER VIEW dbo.vw_ProductsWithDiscounts AS
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
                CASE WHEN p.Price - pd.DiscountValue < 0 THEN 0 ELSE p.Price - pd.DiscountValue END
            ELSE p.Price
        END as DiscountedPrice,
        CASE 
            WHEN pd.DiscountType = ''percentage'' THEN 
                p.Price * pd.DiscountValue / 100
            WHEN pd.DiscountType = ''fixed'' THEN 
                CASE WHEN pd.DiscountValue > p.Price THEN p.Price ELSE pd.DiscountValue END
            ELSE 0
        END as DiscountAmount
    FROM Products p
    LEFT JOIN ProductDiscounts pd 
        ON p.ProductID = pd.ProductID 
       AND pd.IsActive = 1 
       AND GETDATE() BETWEEN pd.StartDate AND pd.EndDate
    WHERE p.IsActive = 1');
END
ELSE
BEGIN
    EXEC('CREATE VIEW dbo.vw_ProductsWithDiscounts AS
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
                CASE WHEN p.Price - pd.DiscountValue < 0 THEN 0 ELSE p.Price - pd.DiscountValue END
            ELSE p.Price
        END as DiscountedPrice,
        CASE 
            WHEN pd.DiscountType = ''percentage'' THEN 
                p.Price * pd.DiscountValue / 100
            WHEN pd.DiscountType = ''fixed'' THEN 
                CASE WHEN pd.DiscountValue > p.Price THEN p.Price ELSE pd.DiscountValue END
            ELSE 0
        END as DiscountAmount
    FROM Products p
    LEFT JOIN ProductDiscounts pd 
        ON p.ProductID = pd.ProductID 
       AND pd.IsActive = 1 
       AND GETDATE() BETWEEN pd.StartDate AND pd.EndDate
    WHERE p.IsActive = 1');
END
GO

-- 2) Drop the Dimensions column safely if it exists
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'Dimensions')
BEGIN
    ALTER TABLE dbo.Products DROP COLUMN Dimensions;
    PRINT 'Dimensions column has been successfully removed from Products table.';
END
ELSE
BEGIN
    PRINT 'Dimensions column does not exist in Products table.';
END
GO

-- 3) Verify the changes
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Products' 
  AND TABLE_SCHEMA = 'dbo'
ORDER BY ORDINAL_POSITION;

PRINT 'Database schema update completed successfully.';
