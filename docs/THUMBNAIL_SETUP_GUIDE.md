# Thumbnail Setup Guide

## Problem
The product detail page is showing placeholder thumbnails instead of actual images because the `ThumbnailURLs` column doesn't exist in the database or products don't have thumbnail data.

## Solution

### Method 1: Add Thumbnails via Admin Panel (Recommended)

1. **Start the backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Go to Admin Panel**:
   - Navigate to `http://localhost:5000/Employee/Admin/Products`
   - Login with admin credentials

3. **Edit a Product**:
   - Click the "Edit" button on any product
   - Scroll down to the "Product Thumbnails" section
   - Upload up to 4 thumbnail images
   - Click "Save Product"

4. **Verify**:
   - Go to the frontend product detail page
   - The thumbnails should now appear below the main image

### Method 2: Manual Database Setup

If the admin panel doesn't work, you can manually add the column:

1. **Connect to SQL Server**:
   ```sql
   USE DesignXcelDB;
   ```

2. **Add ThumbnailURLs column**:
   ```sql
   IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'ThumbnailURLs')
   ALTER TABLE Products ADD ThumbnailURLs NVARCHAR(MAX) NULL;
   ```

3. **Add test thumbnail data**:
   ```sql
   UPDATE Products 
   SET ThumbnailURLs = '["/uploads/thumb1.jpg", "/uploads/thumb2.jpg", "/uploads/thumb3.jpg", "/uploads/thumb4.jpg"]' 
   WHERE ProductID = 7;
   ```

### Method 3: Use the Setup Endpoint

1. **Start the backend server**
2. **Call the setup endpoint**:
   ```bash
   curl -X POST http://localhost:5000/api/setup-thumbnails
   ```

## Testing

After setting up thumbnails:

1. **Test the API**:
   ```bash
   node scripts/test-thumbnail-api.js
   ```

2. **Check the frontend**:
   - Go to a product detail page
   - Check browser console for thumbnail data
   - Verify thumbnails appear below the main image

## Troubleshooting

### If thumbnails still don't appear:

1. **Check browser console** for error messages
2. **Verify API response** contains `thumbnails` field
3. **Check database** has `ThumbnailURLs` column
4. **Restart backend server** after making changes

### Common Issues:

- **ThumbnailURLs column doesn't exist**: Use Method 2 to add it
- **Products have no thumbnail data**: Use Method 1 to add thumbnails
- **API not returning thumbnails**: Check SQL query in `backend/api-routes.js`
- **Frontend not displaying thumbnails**: Check `frontend/src/pages/ProductDetail.js`

## Files Modified

- `backend/api-routes.js` - Added thumbnail support to API endpoints
- `frontend/src/pages/ProductDetail.js` - Added thumbnail display logic
- `scripts/test-thumbnail-api.js` - Test script for API
- `scripts/setup-thumbnails-endpoint.js` - Setup script for database
