-- Add extended columns to ProductReviews table for better review management
-- Execute this SQL script to add the missing columns

-- Check if columns exist and add them if they don't
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'ProductReviews' AND COLUMN_NAME = 'ReviewerName')
BEGIN
    ALTER TABLE ProductReviews ADD ReviewerName NVARCHAR(255) NULL;
    PRINT 'Added ReviewerName column to ProductReviews table';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'ProductReviews' AND COLUMN_NAME = 'ReviewerEmail')
BEGIN
    ALTER TABLE ProductReviews ADD ReviewerEmail NVARCHAR(255) NULL;
    PRINT 'Added ReviewerEmail column to ProductReviews table';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'ProductReviews' AND COLUMN_NAME = 'Title')
BEGIN
    ALTER TABLE ProductReviews ADD Title NVARCHAR(255) NULL;
    PRINT 'Added Title column to ProductReviews table';
END

-- Update the GetProductReviews stored procedure to handle both old and new column structures
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GetProductReviews]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE GetProductReviews;
    PRINT 'Dropped existing GetProductReviews procedure';
END

GO

CREATE PROCEDURE GetProductReviews
    @ProductID INT
AS
BEGIN
    SELECT
        pr.ReviewID,
        pr.ProductID,
        pr.CustomerID,
        COALESCE(pr.ReviewerName, c.FullName, 'Anonymous') AS CustomerName,
        COALESCE(pr.ReviewerEmail, c.Email) AS CustomerEmail,
        pr.Rating,
        COALESCE(pr.Title, 'Review') AS Title,
        pr.Comment,
        pr.HelpfulCount,
        pr.CreatedAt,
        pr.UpdatedAt,
        pr.IsActive
    FROM ProductReviews pr
        LEFT JOIN Customers c ON pr.CustomerID = c.CustomerID
    WHERE pr.ProductID = @ProductID
        AND pr.IsActive = 1
    ORDER BY pr.CreatedAt DESC;
END;

GO

PRINT 'Updated GetProductReviews procedure to handle extended columns';

-- Update existing reviews to populate the new columns from customer data
UPDATE pr 
SET 
    ReviewerName = COALESCE(pr.ReviewerName, c.FullName, 'Anonymous'),
    ReviewerEmail = COALESCE(pr.ReviewerEmail, c.Email),
    Title = COALESCE(pr.Title, 'Review')
FROM ProductReviews pr
LEFT JOIN Customers c ON pr.CustomerID = c.CustomerID
WHERE pr.ReviewerName IS NULL OR pr.ReviewerEmail IS NULL OR pr.Title IS NULL;

PRINT 'Updated existing reviews with extended column data';
