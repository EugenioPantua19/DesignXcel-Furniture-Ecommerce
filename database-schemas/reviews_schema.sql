-- Product Reviews Database Schema
-- Execute this SQL script manually in your database

-- Create ProductReviews table
CREATE TABLE ProductReviews
(
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    CustomerID INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Comment NVARCHAR(1000) NOT NULL,
    HelpfulCount INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,

    -- Foreign key constraints
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID) ON DELETE CASCADE,

    -- Ensure one review per customer per product
    CONSTRAINT UQ_CustomerProduct UNIQUE (CustomerID, ProductID)
);

GO

-- Create index for better performance
CREATE INDEX IX_ProductReviews_ProductID ON ProductReviews(ProductID);
CREATE INDEX IX_ProductReviews_CustomerID ON ProductReviews(CustomerID);
CREATE INDEX IX_ProductReviews_CreatedAt ON ProductReviews(CreatedAt);

GO

-- Create trigger to update UpdatedAt timestamp
CREATE TRIGGER TR_ProductReviews_UpdateTimestamp
ON ProductReviews
AFTER UPDATE
AS
BEGIN
    UPDATE ProductReviews 
    SET UpdatedAt = GETDATE()
    FROM ProductReviews pr
        INNER JOIN inserted i ON pr.ReviewID = i.ReviewID;
END;

GO

-- Create view for review statistics
CREATE VIEW ProductReviewStats
AS
    SELECT
        p.ProductID,
        p.Name AS ProductName,
        COUNT(pr.ReviewID) AS TotalReviews,
        AVG(CAST(pr.Rating AS FLOAT)) AS AverageRating,
        SUM(CASE WHEN pr.Rating = 5 THEN 1 ELSE 0 END) AS FiveStarCount,
        SUM(CASE WHEN pr.Rating = 4 THEN 1 ELSE 0 END) AS FourStarCount,
        SUM(CASE WHEN pr.Rating = 3 THEN 1 ELSE 0 END) AS ThreeStarCount,
        SUM(CASE WHEN pr.Rating = 2 THEN 1 ELSE 0 END) AS TwoStarCount,
        SUM(CASE WHEN pr.Rating = 1 THEN 1 ELSE 0 END) AS OneStarCount
    FROM Products p
        LEFT JOIN ProductReviews pr ON p.ProductID = pr.ProductID AND pr.IsActive = 1
    WHERE p.IsActive = 1
    GROUP BY p.ProductID, p.Name;

GO

-- Insert sample reviews (optional - for testing)
-- Make sure to replace CustomerID values with actual customer IDs from your database
INSERT INTO ProductReviews
    (ProductID, CustomerID, Rating, Comment, HelpfulCount)
VALUES
    (1, 1, 5, 'Excellent quality and craftsmanship. The desk is exactly what I was looking for.', 3),
    (1, 2, 4, 'Great desk, very sturdy. The only minor issue is the drawer alignment.', 1),
    (2, 3, 5, 'Beautiful modern design. The glass top is perfect for my office.', 2),
    (3, 4, 5, 'Most comfortable office chair I''ve ever owned. Worth every penny!', 5),
    (3, 5, 4, 'Great ergonomic design. The lumbar support is excellent for long work sessions.', 2),
    (4, 6, 5, 'Perfect standing desk converter. Easy to adjust and very stable.', 4),
    (5, 7, 4, 'Solid filing cabinet with good security features. Matches my desk perfectly.', 1),
    (6, 8, 5, 'Beautiful bookshelf that adds elegance to my office. Adjustable shelves are a plus.', 3);

GO

-- Create stored procedure for getting product reviews
CREATE PROCEDURE GetProductReviews
    @ProductID INT
AS
BEGIN
    SELECT
        pr.ReviewID,
        pr.ProductID,
        pr.CustomerID,
        COALESCE(c.FullName, 'Anonymous') AS CustomerName,
        c.Email AS CustomerEmail,
        pr.Rating,
        pr.Comment,
        pr.HelpfulCount,
        pr.CreatedAt,
        pr.UpdatedAt
    FROM ProductReviews pr
        INNER JOIN Customers c ON pr.CustomerID = c.CustomerID
    WHERE pr.ProductID = @ProductID
        AND pr.IsActive = 1
    ORDER BY pr.CreatedAt DESC;
END;

GO

-- Create stored procedure for adding a new review
CREATE PROCEDURE AddProductReview
    @ProductID INT,
    @CustomerID INT,
    @Rating INT,
    @Comment NVARCHAR(1000)
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if customer already reviewed this product
        IF EXISTS (SELECT 1
    FROM ProductReviews
    WHERE ProductID = @ProductID AND CustomerID = @CustomerID)
        BEGIN
        -- Update existing review
        UPDATE ProductReviews 
            SET Rating = @Rating, 
                Comment = @Comment, 
                UpdatedAt = GETDATE()
            WHERE ProductID = @ProductID AND CustomerID = @CustomerID;
    END
        ELSE
        BEGIN
        -- Insert new review
        INSERT INTO ProductReviews
            (ProductID, CustomerID, Rating, Comment)
        VALUES
            (@ProductID, @CustomerID, @Rating, @Comment);
    END
        
        COMMIT TRANSACTION;
        
        -- Return the review details
        SELECT
        pr.ReviewID,
        pr.ProductID,
        pr.CustomerID,
        c.FullName AS CustomerName,
        c.Email AS CustomerEmail,
        pr.Rating,
        pr.Comment,
        pr.HelpfulCount,
        pr.CreatedAt,
        pr.UpdatedAt
    FROM ProductReviews pr
        INNER JOIN Customers c ON pr.CustomerID = c.CustomerID
    WHERE pr.ProductID = @ProductID AND pr.CustomerID = @CustomerID;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;

GO

-- Create stored procedure for getting review statistics
CREATE PROCEDURE GetProductReviewStats
    @ProductID INT
AS
BEGIN
    SELECT
        p.ProductID,
        p.Name AS ProductName,
        COUNT(pr.ReviewID) AS TotalReviews,
        AVG(CAST(pr.Rating AS FLOAT)) AS AverageRating,
        SUM(CASE WHEN pr.Rating = 5 THEN 1 ELSE 0 END) AS FiveStarCount,
        SUM(CASE WHEN pr.Rating = 4 THEN 1 ELSE 0 END) AS FourStarCount,
        SUM(CASE WHEN pr.Rating = 3 THEN 1 ELSE 0 END) AS ThreeStarCount,
        SUM(CASE WHEN pr.Rating = 2 THEN 1 ELSE 0 END) AS TwoStarCount,
        SUM(CASE WHEN pr.Rating = 1 THEN 1 ELSE 0 END) AS OneStarCount
    FROM Products p
        LEFT JOIN ProductReviews pr ON p.ProductID = pr.ProductID AND pr.IsActive = 1
    WHERE p.ProductID = @ProductID AND p.IsActive = 1
    GROUP BY p.ProductID, p.Name;
END; 