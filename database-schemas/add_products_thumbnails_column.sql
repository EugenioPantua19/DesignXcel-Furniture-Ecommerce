/*
  Adds ThumbnailURLs column to Products if it doesn't exist (SQL Server)
  - Stores JSON array of relative URLs: ["/uploads/products/thumbnails/..", ...]
*/

IF NOT EXISTS (
  SELECT * FROM sys.columns 
  WHERE object_id = OBJECT_ID('dbo.Products') AND name = 'ThumbnailURLs'
)
BEGIN
  ALTER TABLE dbo.Products
    ADD ThumbnailURLs NVARCHAR(MAX) NULL;
  PRINT '✓ Added Products.ThumbnailURLs (NVARCHAR(MAX))';
END
ELSE
BEGIN
  PRINT 'Products.ThumbnailURLs already exists';
END


