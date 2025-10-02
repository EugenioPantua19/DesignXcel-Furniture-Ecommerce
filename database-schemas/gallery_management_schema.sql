-- Gallery Management System Schema for Microsoft SQL Server (MSSQL)
-- This schema supports the comprehensive gallery management system with modal content

-- Gallery Items Table
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='gallery_items' AND xtype='U')
BEGIN
    CREATE TABLE gallery_items
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        category NVARCHAR(100) NOT NULL,
        tags NVARCHAR(MAX),
        -- Comma-separated tags
        description NVARCHAR(MAX),
        main_image_url NVARCHAR(500) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        is_active BIT DEFAULT 1,
        sort_order INT DEFAULT 0
    );
END
GO

-- Gallery Thumbnails Table (for modal images)
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='gallery_thumbnails' AND xtype='U')
BEGIN
    CREATE TABLE gallery_thumbnails
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        gallery_item_id INT NOT NULL,
        image_url NVARCHAR(500) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_gallery_thumbnails_item 
            FOREIGN KEY (gallery_item_id) 
            REFERENCES gallery_items(id) 
            ON DELETE CASCADE
    );
END
GO

-- Indexes for better performance
IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name='IX_gallery_items_category' AND object_id = OBJECT_ID('gallery_items'))
    CREATE INDEX IX_gallery_items_category ON gallery_items(category);
GO

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name='IX_gallery_items_active' AND object_id = OBJECT_ID('gallery_items'))
    CREATE INDEX IX_gallery_items_active ON gallery_items(is_active);
GO

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name='IX_gallery_items_sort' AND object_id = OBJECT_ID('gallery_items'))
    CREATE INDEX IX_gallery_items_sort ON gallery_items(sort_order);
GO

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name='IX_gallery_thumbnails_item' AND object_id = OBJECT_ID('gallery_thumbnails'))
    CREATE INDEX IX_gallery_thumbnails_item ON gallery_thumbnails(gallery_item_id);
GO

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name='IX_gallery_thumbnails_sort' AND object_id = OBJECT_ID('gallery_thumbnails'))
    CREATE INDEX IX_gallery_thumbnails_sort ON gallery_thumbnails(sort_order);
GO

-- Sample data for testing (only if tables are empty)
IF NOT EXISTS (SELECT *
FROM gallery_items)
BEGIN
    INSERT INTO gallery_items
        (title, category, tags, description, main_image_url)
    VALUES
        ('Executive Mahogany Desk', 'desks', 'wood,executive,classic', 'A timeless executive desk crafted from rich mahogany with brushed metal accents.', '/uploads/gallery/executive-desk-main.jpg'),
        ('Modern Glass Desk', 'desks', 'minimal,glass,modern', 'Minimal glass top paired with powder-coated steel for a clean, modern workstation.', '/uploads/gallery/glass-desk-main.jpg'),
        ('Ergonomic Executive Chair', 'chairs', 'ergonomic,comfort,executive', 'Adjustable lumbar support and breathable mesh keep you comfortable for long sessions.', '/uploads/gallery/ergonomic-chair-main.jpg');
END
GO

-- Sample thumbnails for the first item (only if no thumbnails exist)
IF NOT EXISTS (SELECT *
FROM gallery_thumbnails)
BEGIN
    INSERT INTO gallery_thumbnails
        (gallery_item_id, image_url, sort_order)
    VALUES
        (1, '/uploads/gallery/executive-desk-thumb1.jpg', 1),
        (1, '/uploads/gallery/executive-desk-thumb2.jpg', 2),
        (1, '/uploads/gallery/executive-desk-thumb3.jpg', 3);

    INSERT INTO gallery_thumbnails
        (gallery_item_id, image_url, sort_order)
    VALUES
        (2, '/uploads/gallery/glass-desk-thumb1.jpg', 1),
        (2, '/uploads/gallery/glass-desk-thumb2.jpg', 2);

    INSERT INTO gallery_thumbnails
        (gallery_item_id, image_url, sort_order)
    VALUES
        (3, '/uploads/gallery/ergonomic-chair-thumb1.jpg', 1),
        (3, '/uploads/gallery/ergonomic-chair-thumb2.jpg', 2),
        (3, '/uploads/gallery/ergonomic-chair-thumb3.jpg', 3);
END
GO

-- Create a view for easier querying of gallery items with thumbnails
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='vw_gallery_items_with_thumbnails' AND xtype='V')
BEGIN
    EXEC('CREATE VIEW vw_gallery_items_with_thumbnails AS
    SELECT 
        gi.id,
        gi.title,
        gi.category,
        gi.tags,
        gi.description,
        gi.main_image_url,
        gi.created_at,
        gi.updated_at,
        gi.is_active,
        gi.sort_order,
        STRING_AGG(gt.image_url, '','') WITHIN GROUP (ORDER BY gt.sort_order) as thumbnail_urls,
        COUNT(gt.id) as thumbnail_count
    FROM gallery_items gi
    LEFT JOIN gallery_thumbnails gt ON gi.id = gt.gallery_item_id
    WHERE gi.is_active = 1
    GROUP BY 
        gi.id, gi.title, gi.category, gi.tags, gi.description, 
        gi.main_image_url, gi.created_at, gi.updated_at, gi.is_active, gi.sort_order');
END
GO

-- Create a stored procedure for adding gallery items
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='sp_AddGalleryItem' AND xtype='P')
BEGIN
    EXEC('CREATE PROCEDURE sp_AddGalleryItem
        @Title NVARCHAR(255),
        @Category NVARCHAR(100),
        @Tags NVARCHAR(MAX),
        @Description NVARCHAR(MAX),
        @MainImageUrl NVARCHAR(500),
        @SortOrder INT = 0
    AS
    BEGIN
        SET NOCOUNT ON;
        
        INSERT INTO gallery_items (title, category, tags, description, main_image_url, sort_order)
        VALUES (@Title, @Category, @Tags, @Description, @MainImageUrl, @SortOrder);
        
        SELECT SCOPE_IDENTITY() as NewGalleryItemID;
    END');
END
GO

-- Create a stored procedure for adding thumbnails
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='sp_AddGalleryThumbnail' AND xtype='P')
BEGIN
    EXEC('CREATE PROCEDURE sp_AddGalleryThumbnail
        @GalleryItemID INT,
        @ImageUrl NVARCHAR(500),
        @SortOrder INT = 0
    AS
    BEGIN
        SET NOCOUNT ON;
        
        INSERT INTO gallery_thumbnails (gallery_item_id, image_url, sort_order)
        VALUES (@GalleryItemID, @ImageUrl, @SortOrder);
        
        SELECT SCOPE_IDENTITY() as NewThumbnailID;
    END');
END
GO

-- Create a stored procedure for getting gallery items by category
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='sp_GetGalleryItemsByCategory' AND xtype='P')
BEGIN
    EXEC('CREATE PROCEDURE sp_GetGalleryItemsByCategory
        @Category NVARCHAR(100) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        IF @Category IS NULL OR @Category = ''''
        BEGIN
            SELECT * FROM vw_gallery_items_with_thumbnails
            ORDER BY sort_order, created_at DESC;
        END
        ELSE
        BEGIN
            SELECT * FROM vw_gallery_items_with_thumbnails
            WHERE category = @Category
            ORDER BY sort_order, created_at DESC;
        END
    END');
END
GO

PRINT 'Gallery Management System schema created successfully!';
PRINT 'Tables: gallery_items, gallery_thumbnails';
PRINT 'View: vw_gallery_items_with_thumbnails';
PRINT 'Stored Procedures: sp_AddGalleryItem, sp_AddGalleryThumbnail, sp_GetGalleryItemsByCategory';
PRINT 'Sample data has been inserted for testing.';
