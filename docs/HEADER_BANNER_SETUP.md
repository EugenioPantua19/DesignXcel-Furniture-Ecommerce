# Header Banner Color Customization Setup

This document explains how to set up and use the new header banner color customization feature that allows administrators to change the colors of different header sections through the CMS.

## Overview

The header banner feature allows you to customize the colors of:

- Contact information row (background and text colors)
- Main header row (background and text colors)
- Navigation bar (background, text, and hover colors)
- Search bar (border and button colors)

## Database Setup

1. **Run the SQL Schema**
   Execute the `header_banner_schema.sql` file in your database to create the required table:

   ```sql
   -- Run this in your SQL Server database
   -- The file creates the HeaderBanner table with default color values
   ```

2. **Table Structure**
   The `HeaderBanner` table contains:
   - `ContactBgColor` - Contact row background color
   - `ContactTextColor` - Contact row text color
   - `MainBgColor` - Main header background color
   - `MainTextColor` - Main header text color
   - `NavBgColor` - Navigation background color
   - `NavTextColor` - Navigation text color
   - `NavHoverColor` - Navigation hover color
   - `SearchBorderColor` - Search bar border color
   - `SearchBtnColor` - Search button color

## Backend Setup

The feature is already integrated into the backend with:

1. **API Endpoints** (in `routes.js`):

   - `GET /api/admin/header-banner` - Admin only, fetch current settings
   - `POST /api/admin/header-banner` - Admin only, save new settings
   - `GET /api/header-banner` - Public, fetch settings for frontend

2. **CMS Integration**:
   - Admin CMS (`AdminCMS.ejs`) - Full banner management
   - Inventory Manager CMS (`InvManagerCMS.ejs`) - Full banner management

## Frontend Setup

The frontend Header component (`Header.js`) automatically:

1. Fetches banner color settings on component mount
2. Applies colors to different header sections
3. Updates in real-time when colors are changed in the CMS

## Usage Instructions

### For Administrators

1. **Access the CMS**:

   - Go to Admin Dashboard → Content Management → Banner tab
   - Or Inventory Manager → Content Management → Banner tab

2. **Customize Colors**:

   - Use the color pickers to select desired colors for each section
   - See live preview updates as you change colors
   - Click "Save Header Colors" to apply changes

3. **Color Sections**:
   - **Contact Information Row**: Top bar with email, phone, address
   - **Main Header Row**: Logo, search bar, and user icons area
   - **Navigation Bar**: Menu links below the main header
   - **Search Bar**: Search input and button styling

### For Developers

1. **Adding New Color Options**:

   - Update the `HeaderBanner` table schema
   - Add new color fields to the API endpoints
   - Update the CMS forms and JavaScript
   - Modify the frontend Header component

2. **Customizing Default Colors**:
   - Modify the default values in `header_banner_schema.sql`
   - Update the fallback colors in the API endpoints
   - Change the initial state in `Header.js`

## Color Format

All colors are stored as 6-character hex codes (e.g., `#ffc107`).
The system supports:

- Standard hex colors
- CSS color names (converted to hex)
- RGB values (converted to hex)

## Troubleshooting

### Common Issues

1. **Colors Not Updating**:

   - Check browser console for JavaScript errors
   - Verify the API endpoints are working
   - Ensure the database table exists and has data

2. **Database Errors**:

   - Run the schema file again
   - Check database connection
   - Verify table permissions

3. **Frontend Not Loading Colors**:
   - Check network tab for API calls
   - Verify the Header component is fetching data
   - Check for JavaScript errors in console

### Debug Steps

1. **Check API Response**:

   ```bash
   curl http://localhost:5000/api/header-banner
   ```

2. **Verify Database**:

   ```sql
   SELECT * FROM HeaderBanner;
   ```

3. **Check Frontend Console**:
   - Look for fetch errors
   - Verify color values are being set

## Security Notes

- Only authenticated users with Admin role can modify banner colors
- Public endpoint only allows reading, not writing
- All color inputs are validated and sanitized
- No XSS vulnerabilities through color values

## Performance Considerations

- Colors are cached in frontend state
- API calls are made once on component mount
- Real-time preview updates are handled locally
- Database queries are optimized with proper indexing

## Future Enhancements

Potential improvements could include:

- Color presets/themes
- Scheduled color changes
- A/B testing different color schemes
- Color accessibility validation
- Export/import color configurations
