# Database Cleanup Guide - Remove Unused Tables

## Overview

This guide helps you identify and remove unused database tables from the DesignXcel project to improve database performance and reduce maintenance overhead.

## Tables Analysis Summary

### ✅ **ACTIVE TABLES** (Keep These)
These tables are actively used in the application:

| Table Name | Purpose | Usage |
|------------|---------|-------|
| `Products` | Core product data | Frontend product display, admin management |
| `Customers` | Customer information | Authentication, profile management |
| `Orders` | Order management | Order processing, history |
| `OrderItems` | Order line items | Order details, cart functionality |
| `CustomerAddresses` | Customer addresses | Shipping, billing addresses |
| `ProductReviews` | Product reviews | Review system, ratings |
| `ProductDiscounts` | Product discounts | Pricing, promotions |
| `ProductVariations` | Product variations | Product options, variants |
| `RawMaterials` | Raw materials | Inventory management |
| `ProductMaterials` | Product-material relationships | Manufacturing, inventory |
| `Users` | Admin users | Admin authentication |
| `Roles` | User roles | Admin permissions |
| `ActivityLogs` | Audit trail | Admin activity tracking |
| `ReviewSettings` | Review configuration | Review system settings |
| `WalkInOrders` | Walk-in orders | In-store order management |
| `project_items` | Project gallery | Portfolio display |
| `project_thumbnails` | Project images | Portfolio thumbnails |
| `Testimonials` | Customer testimonials | Testimonials display |

### ❌ **UNUSED TABLES** (Safe to Remove)
These tables are not referenced in the codebase:

| Table Name | Purpose | Reason for Removal |
|------------|---------|-------------------|
| `AutoMessages` | Automated FAQ responses | No API endpoints or frontend usage |
| `ContactSubmissions` | Contact form submissions | Limited usage, not actively managed |
| `gallery_items` | Gallery items | Replaced by `project_items` |
| `gallery_thumbnails` | Gallery thumbnails | Replaced by `project_thumbnails` |
| `HeaderBanner` | Header customization | Not actively used in frontend |
| `HeaderOfferBar` | Promotional banner | Not actively used in frontend |
| `HeroBanner` | Hero section customization | Not actively used in frontend |
| `TestimonialsDesign` | Testimonials customization | Not actively used in frontend |

## Pre-Cleanup Steps

### 1. **Create Database Backup**
```sql
-- Run the backup script
sqlcmd -S your_server -d DesignXcelDB -i backup_database.sql
```

### 2. **Verify Current Tables**
```sql
-- Check existing tables
SELECT name FROM sys.tables WHERE name NOT LIKE 'sys%' ORDER BY name;
```

### 3. **Test on Development Environment**
- Run the cleanup script on a development database first
- Test all application functionality
- Verify no errors occur

## Cleanup Process

### Step 1: Run Backup Script
```bash
# Using sqlcmd
sqlcmd -S your_server -d DesignXcelDB -i backup_database.sql

# Or using SQL Server Management Studio
# Open and execute backup_database.sql
```

### Step 2: Run Cleanup Script
```bash
# Using sqlcmd
sqlcmd -S your_server -d DesignXcelDB -i remove_unused_tables.sql

# Or using SQL Server Management Studio
# Open and execute remove_unused_tables.sql
```

### Step 3: Verify Cleanup
```sql
-- Check remaining tables
SELECT name FROM sys.tables WHERE name NOT LIKE 'sys%' ORDER BY name;

-- Verify no broken references
SELECT * FROM sys.foreign_keys WHERE referenced_object_id IN (
    SELECT object_id FROM sys.tables WHERE name IN (
        'AutoMessages', 'ContactSubmissions', 'gallery_items', 
        'gallery_thumbnails', 'HeaderBanner', 'HeaderOfferBar', 
        'HeroBanner', 'TestimonialsDesign'
    )
);
```

## Post-Cleanup Steps

### 1. **Test Application**
- Test all major functionality
- Check admin dashboard
- Verify customer features
- Test order processing

### 2. **Monitor for Errors**
- Check application logs
- Monitor database performance
- Watch for any missing table errors

### 3. **Update Documentation**
- Update any documentation referencing removed tables
- Update database schema documentation
- Update API documentation if needed

### 4. **Clean Up Schema Files**
Consider removing these unused schema files:
- `automated_messages_schema.sql`
- `contact_submissions_schema.sql`
- `gallery_management_schema.sql`
- `header_banner_schema.sql`
- `header_offer_bar_schema.sql`
- `hero_banner_schema.sql`
- `testimonials_design_schema.sql`

## Rollback Plan

If issues occur after cleanup:

### 1. **Restore from Backup**
```sql
-- Restore database from backup
RESTORE DATABASE DesignXcelDB 
FROM DISK = 'C:\backup\DesignXcelDB_backup_before_cleanup.bak'
WITH REPLACE;
```

### 2. **Recreate Specific Tables**
If you need to restore specific tables, you can:
- Restore from backup
- Copy specific table data
- Recreate tables using original schema files

## Benefits of Cleanup

### Performance Improvements
- Reduced database size
- Faster backup/restore operations
- Improved query performance
- Reduced maintenance overhead

### Maintenance Benefits
- Fewer tables to monitor
- Simplified database structure
- Reduced security surface area
- Cleaner development environment

## Safety Considerations

### What's Safe to Remove
- Tables with no API endpoints
- Tables with no frontend references
- Tables replaced by newer implementations
- Unused customization tables

### What to Keep
- Core business logic tables
- Tables with active API endpoints
- Tables referenced in frontend code
- Tables with foreign key relationships to active tables

## Monitoring

After cleanup, monitor:
- Application error logs
- Database performance metrics
- User-reported issues
- System resource usage

## Support

If you encounter issues:
1. Check application logs for specific errors
2. Verify all API endpoints are working
3. Test database connectivity
4. Consider restoring from backup if needed

---

**Remember**: Always backup your database before making structural changes!
