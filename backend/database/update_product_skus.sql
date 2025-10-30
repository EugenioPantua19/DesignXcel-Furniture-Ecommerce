-- Update SKUs to be more unique and random
-- Generate unique SKUs with random component
PRINT 'Updating product SKUs to unique identifiers...';

-- Generate unique SKUs with random component
UPDATE Products 
SET SKU = 'DX-' + 
    SUBSTRING(CONVERT(VARCHAR(40), NEWID()), 1, 8) + '-' + 
    RIGHT('0000' + CAST(ProductID AS VARCHAR(10)), 4)
WHERE SKU IS NULL OR SKU LIKE 'SKU-%';

DECLARE @rowsAffected INT = @@ROWCOUNT;
PRINT 'Updated ' + CAST(@rowsAffected AS VARCHAR(10)) + ' products with unique SKU';

-- Show the updated SKUs
SELECT ProductID, Name, SKU 
FROM Products 
ORDER BY ProductID;

PRINT 'SKU update completed!';
