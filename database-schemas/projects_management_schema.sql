-- Projects Management System Schema for Microsoft SQL Server (MSSQL)
-- This schema supports the comprehensive projects management system with modal content

-- Project Items Table
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='project_items' AND xtype='U')
BEGIN
    CREATE TABLE project_items
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

-- Project Thumbnails Table (for modal images)
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='project_thumbnails' AND xtype='U')
BEGIN
    CREATE TABLE project_thumbnails
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        project_item_id INT NOT NULL,
        image_url NVARCHAR(500) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_project_thumbnails_item 
            FOREIGN KEY (project_item_id) 
            REFERENCES project_items(id) 
            ON DELETE CASCADE
    );
END
GO

-- Indexes for better performance
IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name='IX_project_items_category' AND object_id = OBJECT_ID('project_items'))
    CREATE INDEX IX_project_items_category ON project_items(category);
GO

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name='IX_project_items_active' AND object_id = OBJECT_ID('project_items'))
    CREATE INDEX IX_project_items_active ON project_items(is_active);
GO

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name='IX_project_items_sort' AND object_id = OBJECT_ID('project_items'))
    CREATE INDEX IX_project_items_sort ON project_items(sort_order);
GO

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name='IX_project_thumbnails_item' AND object_id = OBJECT_ID('project_thumbnails'))
    CREATE INDEX IX_project_thumbnails_item ON project_thumbnails(project_item_id);
GO

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name='IX_project_thumbnails_sort' AND object_id = OBJECT_ID('project_thumbnails'))
    CREATE INDEX IX_project_thumbnails_sort ON project_thumbnails(sort_order);
GO

-- Migrate existing data from gallery tables to project tables
IF EXISTS (SELECT * FROM sysobjects WHERE name='gallery_items' AND xtype='U')
BEGIN
    -- Copy data from gallery_items to project_items
    INSERT INTO project_items (title, category, tags, description, main_image_url, created_at, updated_at, is_active, sort_order)
    SELECT title, category, tags, description, main_image_url, created_at, updated_at, is_active, sort_order
    FROM gallery_items
    WHERE NOT EXISTS (SELECT 1 FROM project_items WHERE project_items.title = gallery_items.title);
    
    -- Copy thumbnails data
    IF EXISTS (SELECT * FROM sysobjects WHERE name='gallery_thumbnails' AND xtype='U')
    BEGIN
        INSERT INTO project_thumbnails (project_item_id, image_url, sort_order, created_at)
        SELECT 
            pi.id,
            gt.image_url,
            gt.sort_order,
            gt.created_at
        FROM gallery_thumbnails gt
        JOIN gallery_items gi ON gt.gallery_item_id = gi.id
        JOIN project_items pi ON gi.title = pi.title
        WHERE NOT EXISTS (
            SELECT 1 FROM project_thumbnails pt 
            WHERE pt.project_item_id = pi.id AND pt.image_url = gt.image_url
        );
    END
END
GO

-- Create a view for easier querying of project items with thumbnails
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='vw_project_items_with_thumbnails' AND xtype='V')
BEGIN
    EXEC('CREATE VIEW vw_project_items_with_thumbnails AS
    SELECT 
        pi.id,
        pi.title,
        pi.category,
        pi.tags,
        pi.description,
        pi.main_image_url,
        pi.created_at,
        pi.updated_at,
        pi.is_active,
        pi.sort_order,
        STRING_AGG(pt.image_url, '','') WITHIN GROUP (ORDER BY pt.sort_order) as thumbnail_urls,
        COUNT(pt.id) as thumbnail_count
    FROM project_items pi
    LEFT JOIN project_thumbnails pt ON pi.id = pt.project_item_id
    WHERE pi.is_active = 1
    GROUP BY 
        pi.id, pi.title, pi.category, pi.tags, pi.description, 
        pi.main_image_url, pi.created_at, pi.updated_at, pi.is_active, pi.sort_order');
END
GO

-- Create a stored procedure for adding project items
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='sp_AddProjectItem' AND xtype='P')
BEGIN
    EXEC('CREATE PROCEDURE sp_AddProjectItem
        @Title NVARCHAR(255),
        @Category NVARCHAR(100),
        @Tags NVARCHAR(MAX),
        @Description NVARCHAR(MAX),
        @MainImageUrl NVARCHAR(500),
        @SortOrder INT = 0
    AS
    BEGIN
        SET NOCOUNT ON;
        
        INSERT INTO project_items (title, category, tags, description, main_image_url, sort_order)
        VALUES (@Title, @Category, @Tags, @Description, @MainImageUrl, @SortOrder);
        
        SELECT SCOPE_IDENTITY() as NewProjectItemID;
    END');
END
GO

-- Create a stored procedure for adding thumbnails
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='sp_AddProjectThumbnail' AND xtype='P')
BEGIN
    EXEC('CREATE PROCEDURE sp_AddProjectThumbnail
        @ProjectItemID INT,
        @ImageUrl NVARCHAR(500),
        @SortOrder INT = 0
    AS
    BEGIN
        SET NOCOUNT ON;
        
        INSERT INTO project_thumbnails (project_item_id, image_url, sort_order)
        VALUES (@ProjectItemID, @ImageUrl, @SortOrder);
        
        SELECT SCOPE_IDENTITY() as NewThumbnailID;
    END');
END
GO

-- Create a stored procedure for getting project items by category
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='sp_GetProjectItemsByCategory' AND xtype='P')
BEGIN
    EXEC('CREATE PROCEDURE sp_GetProjectItemsByCategory
        @Category NVARCHAR(100) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        IF @Category IS NULL OR @Category = ''''
        BEGIN
            SELECT * FROM vw_project_items_with_thumbnails
            ORDER BY sort_order, created_at DESC;
        END
        ELSE
        BEGIN
            SELECT * FROM vw_project_items_with_thumbnails
            WHERE category = @Category
            ORDER BY sort_order, created_at DESC;
        END
    END');
END
GO

PRINT 'Projects Management System schema created successfully!';
PRINT 'Tables: project_items, project_thumbnails';
PRINT 'View: vw_project_items_with_thumbnails';
PRINT 'Stored Procedures: sp_AddProjectItem, sp_AddProjectThumbnail, sp_GetProjectItemsByCategory';
PRINT 'Existing gallery data has been migrated to project tables.';
