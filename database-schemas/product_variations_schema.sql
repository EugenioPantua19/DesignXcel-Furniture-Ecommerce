/*
  Product Variations schema (SQL Server)
  - Drops existing table if present
  - Creates a clean schema suitable for storing product variations
*/

BEGIN TRY
    BEGIN TRANSACTION;

    -- Drop existing table if it exists
    IF OBJECT_ID('dbo.ProductVariations', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.ProductVariations;
    END

    -- Create table
    CREATE TABLE dbo.ProductVariations (
        VariationID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ProductID INT NOT NULL,
        VariationName NVARCHAR(255) NOT NULL,
        Color NVARCHAR(100) NULL,
        Quantity INT NOT NULL CONSTRAINT DF_ProductVariations_Quantity DEFAULT (1),
        VariationImageURL NVARCHAR(500) NULL,
        SKU NVARCHAR(100) NULL,
        PriceDelta DECIMAL(18,2) NULL, -- Optional: price delta relative to base product price
        IsActive BIT NOT NULL CONSTRAINT DF_ProductVariations_IsActive DEFAULT (1),
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_ProductVariations_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_ProductVariations_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CreatedBy INT NULL,

        CONSTRAINT FK_ProductVariations_Products FOREIGN KEY (ProductID)
            REFERENCES dbo.Products(ProductID) ON DELETE CASCADE,
        CONSTRAINT FK_ProductVariations_Users FOREIGN KEY (CreatedBy)
            REFERENCES dbo.Users(UserID) ON DELETE SET NULL
    );

    -- Indexes for common queries
    CREATE INDEX IX_ProductVariations_ProductID ON dbo.ProductVariations(ProductID);
    CREATE INDEX IX_ProductVariations_IsActive ON dbo.ProductVariations(IsActive);
    CREATE INDEX IX_ProductVariations_Name ON dbo.ProductVariations(VariationName);

    -- Maintain UpdatedAt automatically on updates
    IF OBJECT_ID('dbo.TRG_ProductVariations_SetUpdatedAt', 'TR') IS NOT NULL
    BEGIN
        DROP TRIGGER dbo.TRG_ProductVariations_SetUpdatedAt;
    END
    GO
    CREATE TRIGGER dbo.TRG_ProductVariations_SetUpdatedAt
    ON dbo.ProductVariations
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE pv
            SET UpdatedAt = SYSUTCDATETIME()
        FROM dbo.ProductVariations pv
        INNER JOIN inserted i ON pv.VariationID = i.VariationID;
    END;
    GO

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;


