-- =====================================================
-- REMOVE UNUSED DATABASE TABLES SCRIPT
-- =====================================================
-- This script removes unused database tables from the DesignXcel project
-- 
-- IMPORTANT: 
-- 1. BACKUP YOUR DATABASE BEFORE RUNNING THIS SCRIPT
-- 2. Test this script on a development environment first
-- 3. Review the tables being removed to ensure they are truly unused
-- 
-- Generated on: $(date)
-- =====================================================

USE office_furniture_db;
GO

PRINT '=====================================================';
PRINT 'STARTING DATABASE CLEANUP - REMOVING UNUSED TABLES';
PRINT '=====================================================';
PRINT '';

-- =====================================================
-- BACKUP RECOMMENDATION
-- =====================================================
PRINT 'IMPORTANT: Ensure you have backed up your database before proceeding!';
PRINT 'Recommended backup command:';
PRINT 'sqlcmd -S server_name -d office_furniture_db -Q "BACKUP DATABASE office_furniture_db TO DISK = ''C:\backup\office_furniture_db_backup.bak''"';
PRINT '';

-- =====================================================
-- TABLES TO REMOVE (UNUSED TABLES)
-- =====================================================

-- 1. AutoMessages table (automated FAQ responses - not used)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'AutoMessages')
BEGIN
    PRINT 'Removing AutoMessages table...';
    DROP TABLE AutoMessages;
    PRINT '✓ AutoMessages table removed successfully';
END
ELSE
BEGIN
    PRINT '⚠ AutoMessages table does not exist';
END
GO

-- 2. ContactSubmissions table (contact form - not actively used)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ContactSubmissions')
BEGIN
    PRINT 'Removing ContactSubmissions table...';
    DROP TABLE ContactSubmissions;
    PRINT '✓ ContactSubmissions table removed successfully';
END
ELSE
BEGIN
    PRINT '⚠ ContactSubmissions table does not exist';
END
GO

-- 3. Gallery tables (replaced by project tables)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'gallery_items')
BEGIN
    PRINT 'Removing gallery_items table...';
    DROP TABLE gallery_items;
    PRINT '✓ gallery_items table removed successfully';
END
ELSE
BEGIN
    PRINT '⚠ gallery_items table does not exist';
END
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'gallery_thumbnails')
BEGIN
    PRINT 'Removing gallery_thumbnails table...';
    DROP TABLE gallery_thumbnails;
    PRINT '✓ gallery_thumbnails table removed successfully';
END
ELSE
BEGIN
    PRINT '⚠ gallery_thumbnails table does not exist';
END
GO

-- 4. Header customization tables (not actively used)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'HeaderBanner')
BEGIN
    PRINT 'Removing HeaderBanner table...';
    DROP TABLE HeaderBanner;
    PRINT '✓ HeaderBanner table removed successfully';
END
ELSE
BEGIN
    PRINT '⚠ HeaderBanner table does not exist';
END
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'HeaderOfferBar')
BEGIN
    PRINT 'Removing HeaderOfferBar table...';
    DROP TABLE HeaderOfferBar;
    PRINT '✓ HeaderOfferBar table removed successfully';
END
ELSE
BEGIN
    PRINT '⚠ HeaderOfferBar table does not exist';
END
GO

-- 5. HeroBanner table (not actively used)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'HeroBanner')
BEGIN
    PRINT 'Removing HeroBanner table...';
    DROP TABLE HeroBanner;
    PRINT '✓ HeroBanner table removed successfully';
END
ELSE
BEGIN
    PRINT '⚠ HeroBanner table does not exist';
END
GO

-- 6. TestimonialsDesign table (not actively used)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'TestimonialsDesign')
BEGIN
    PRINT 'Removing TestimonialsDesign table...';
    DROP TABLE TestimonialsDesign;
    PRINT '✓ TestimonialsDesign table removed successfully';
END
ELSE
BEGIN
    PRINT '⚠ TestimonialsDesign table does not exist';
END
GO

-- =====================================================
-- REMOVE RELATED VIEWS AND STORED PROCEDURES
-- =====================================================

-- Remove gallery-related views
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_gallery_items_with_thumbnails')
BEGIN
    PRINT 'Removing vw_gallery_items_with_thumbnails view...';
    DROP VIEW vw_gallery_items_with_thumbnails;
    PRINT '✓ vw_gallery_items_with_thumbnails view removed successfully';
END
GO

-- Remove gallery-related stored procedures
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_AddGalleryItem')
BEGIN
    PRINT 'Removing sp_AddGalleryItem stored procedure...';
    DROP PROCEDURE sp_AddGalleryItem;
    PRINT '✓ sp_AddGalleryItem stored procedure removed successfully';
END
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_AddGalleryThumbnail')
BEGIN
    PRINT 'Removing sp_AddGalleryThumbnail stored procedure...';
    DROP PROCEDURE sp_AddGalleryThumbnail;
    PRINT '✓ sp_AddGalleryThumbnail stored procedure removed successfully';
END
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetGalleryItemsByCategory')
BEGIN
    PRINT 'Removing sp_GetGalleryItemsByCategory stored procedure...';
    DROP PROCEDURE sp_GetGalleryItemsByCategory;
    PRINT '✓ sp_GetGalleryItemsByCategory stored procedure removed successfully';
END
GO

-- =====================================================
-- CLEAN UP INDEXES (if any remain)
-- =====================================================

-- Remove any remaining indexes for deleted tables
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'DROP INDEX ' + i.name + ' ON ' + t.name + ';' + CHAR(13)
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('AutoMessages', 'ContactSubmissions', 'gallery_items', 'gallery_thumbnails', 
                 'HeaderBanner', 'HeaderOfferBar', 'HeroBanner', 'TestimonialsDesign')
AND i.name IS NOT NULL
AND i.name NOT LIKE 'PK_%';

IF @sql != ''
BEGIN
    PRINT 'Removing orphaned indexes...';
    EXEC sp_executesql @sql;
    PRINT '✓ Orphaned indexes removed successfully';
END
GO

-- =====================================================
-- VERIFY REMAINING TABLES
-- =====================================================

PRINT '';
PRINT '=====================================================';
PRINT 'REMAINING ACTIVE TABLES:';
PRINT '=====================================================';

SELECT 
    t.name AS TableName,
    p.rows AS RowCount,
    t.create_date AS CreatedDate,
    t.modify_date AS ModifiedDate
FROM sys.tables t
LEFT JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0,1)
WHERE t.name NOT LIKE 'sys%'
ORDER BY t.name;

PRINT '';
PRINT '=====================================================';
PRINT 'DATABASE CLEANUP COMPLETED';
PRINT '=====================================================';
PRINT '';
PRINT 'SUMMARY OF REMOVED TABLES:';
PRINT '- AutoMessages (automated FAQ responses)';
PRINT '- ContactSubmissions (contact form submissions)';
PRINT '- gallery_items (replaced by project_items)';
PRINT '- gallery_thumbnails (replaced by project_thumbnails)';
PRINT '- HeaderBanner (header customization)';
PRINT '- HeaderOfferBar (promotional banner)';
PRINT '- HeroBanner (hero section customization)';
PRINT '- TestimonialsDesign (testimonials customization)';
PRINT '';
PRINT 'ACTIVE TABLES REMAINING:';
PRINT '- Products (core product data)';
PRINT '- Customers (customer information)';
PRINT '- Orders (order management)';
PRINT '- OrderItems (order line items)';
PRINT '- CustomerAddresses (customer addresses)';
PRINT '- ProductReviews (product reviews)';
PRINT '- ProductDiscounts (product discounts)';
PRINT '- ProductVariations (product variations)';
PRINT '- RawMaterials (raw materials)';
PRINT '- ProductMaterials (product-material relationships)';
PRINT '- Users (admin users)';
PRINT '- Roles (user roles)';
PRINT '- ActivityLogs (audit trail)';
PRINT '- ReviewSettings (review configuration)';
PRINT '- WalkInOrders (walk-in orders)';
PRINT '- project_items (project gallery)';
PRINT '- project_thumbnails (project images)';
PRINT '- Testimonials (customer testimonials)';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Test your application to ensure all functionality works';
PRINT '2. Monitor for any errors related to removed tables';
PRINT '3. Update any documentation that references removed tables';
PRINT '4. Consider removing unused schema files from database-schemas folder';
PRINT '';
PRINT 'Cleanup completed successfully!';
