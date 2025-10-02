# 🚀 Hero Banner Migration Guide

## ✅ **Migration Created Successfully!**

The database migration for the new hero banner fields has been created and is ready to run. Here are the available options:

## 📋 **Migration Options**

### **Option 1: HTTP API Migration (Recommended)**
**When to use:** When the backend server is running and you have admin access.

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Access the migration page:**
   - Navigate to: `http://localhost:5000/migration.html`
   - Or use the API directly: `POST http://localhost:5000/api/admin/hero-banner/migrate`

3. **Run the migration:**
   - Click "Run Hero Banner Migration" button
   - The migration will run automatically and show results

### **Option 2: SQL Script Migration**
**When to use:** When you have direct database access via SQL Server Management Studio or sqlcmd.

1. **Run the SQL script:**
   ```bash
   sqlcmd -S localhost -d DesignXcel -E -i "database-schemas/hero_banner_complete_migration.sql"
   ```

2. **Or copy and paste the SQL commands from:**
   `database-schemas/hero_banner_complete_migration.sql`

### **Option 3: Manual SQL Commands**
**When to use:** For advanced users who want to run commands individually.

```sql
-- Add new columns
ALTER TABLE HeroBanner ADD Button2Text NVARCHAR(100) NULL;
ALTER TABLE HeroBanner ADD Button2Link NVARCHAR(200) NULL;
ALTER TABLE HeroBanner ADD Button2BgColor NVARCHAR(7) NULL;
ALTER TABLE HeroBanner ADD Button2TextColor NVARCHAR(7) NULL;

-- Set default values
UPDATE HeroBanner 
SET 
    Button2Text = 'Custom Design',
    Button2Link = '/custom-furniture',
    Button2BgColor = '#6c757d',
    Button2TextColor = '#ffffff'
WHERE Button2Text IS NULL;
```

## 🔧 **What the Migration Does**

### **New Database Columns Added:**
- **Button2Text** (NVARCHAR(100)) - Text for the second button
- **Button2Link** (NVARCHAR(200)) - Link for the second button  
- **Button2BgColor** (NVARCHAR(7)) - Background color for the second button
- **Button2TextColor** (NVARCHAR(7)) - Text color for the second button

### **Default Values Set:**
- **Button2Text**: "Custom Design"
- **Button2Link**: "/custom-furniture"
- **Button2BgColor**: "#6c757d" (gray)
- **Button2TextColor**: "#ffffff" (white)

## ✅ **Migration Safety Features**

- **Idempotent**: Safe to run multiple times
- **Non-destructive**: Only adds new columns, doesn't modify existing data
- **Backward compatible**: Existing functionality remains unchanged
- **Error handling**: Comprehensive error checking and reporting
- **Verification**: Automatic verification of migration success

## 🧪 **Testing the Migration**

### **1. Verify Database Changes:**
```sql
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'HeroBanner' 
AND COLUMN_NAME LIKE 'Button2%';
```

### **2. Test CMS Functionality:**
1. Navigate to: `http://localhost:5000/Employee/Admin/CMS`
2. Go to "Hero Banner" tab
3. Verify all new fields are present and functional
4. Test the live preview with new elements

### **3. Test API Endpoints:**
```bash
# Test admin endpoint
curl -X GET http://localhost:5000/api/admin/hero-banner

# Test public endpoint  
curl -X GET http://localhost:5000/api/hero-banner
```

## 🎯 **Expected Results**

After successful migration:

✅ **CMS Interface**: New form fields for second button customization  
✅ **Live Preview**: Arrow navigation and minimal indicators working  
✅ **API Responses**: All endpoints return new button fields  
✅ **Database**: New columns present with default values  
✅ **Frontend Ready**: API ready for frontend consumption  

## 🚨 **Troubleshooting**

### **Database Connection Issues:**
- Ensure SQL Server is running
- Check connection string in server configuration
- Verify database exists and is accessible

### **Permission Issues:**
- Ensure user has ALTER TABLE permissions
- Run as database administrator if needed
- Check authentication for API endpoints

### **Migration Fails:**
- Check server logs for detailed error messages
- Verify HeroBanner table exists
- Ensure no conflicting column names

## 📞 **Support**

If you encounter any issues:

1. **Check server logs** for detailed error messages
2. **Verify database connectivity** and permissions
3. **Review the migration script** for any custom modifications needed
4. **Test with a backup database** first if in production

## 🎉 **Success!**

Once the migration is complete, the CMS will have full control over the hero section with:
- Second button customization
- Arrow navigation controls
- Minimal slider indicators
- Complete color management
- Live preview functionality

The hero banner is now ready for advanced customization! 🚀
