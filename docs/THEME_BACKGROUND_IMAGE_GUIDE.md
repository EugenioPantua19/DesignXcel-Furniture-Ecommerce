# Theme Background Image Feature Guide

## Overview

The CMS now supports uploading and applying background images to the entire website. This feature allows administrators to customize the visual appearance of the site by setting a background image that will be applied globally.

## Features

### ✅ What's Included

- **Background Image Upload**: Upload images through the CMS interface
- **Preview Functionality**: See the current background image in the admin panel
- **Remove Option**: Easily remove background images when needed
- **Automatic Application**: Background images are automatically applied to the frontend
- **Responsive Design**: Background images are optimized for different screen sizes
- **Theme Compatibility**: Works with all existing themes (default, dark, modern)

### 🎨 Visual Enhancements

- **Overlay Effect**: Semi-transparent overlay ensures content readability
- **Backdrop Blur**: Content sections have a subtle blur effect for better contrast
- **Fixed Positioning**: Background images stay fixed during scrolling
- **Cover Scaling**: Images automatically scale to cover the entire viewport

## How to Use

### For Administrators

1. **Access the CMS**

   - Navigate to Admin Panel → Content Management → Theme tab
   - Or Inventory Manager → Content Management → Theme tab

2. **Upload Background Image**

   - Scroll down to the "Background Image" section
   - Click "Choose File" and select an image
   - Recommended size: 1920x1080 or larger
   - Supported formats: JPG, PNG, GIF, WebP
   - Click "Upload Background Image"

3. **Preview and Manage**
   - View the current background image in the preview section
   - Use "Remove Background Image" to clear the background
   - The image is automatically applied to the frontend

### For Developers

#### API Endpoints

**GET /api/theme/active**

```javascript
// Returns current theme and background image settings
{
  "activeTheme": "default",
  "backgroundImage": "/uploads/background-123.jpg"
}
```

**POST /api/theme/background-image**

```javascript
// Upload a new background image
const formData = new FormData();
formData.append("backgroundImage", file);

fetch("/api/theme/background-image", {
  method: "POST",
  body: formData,
});
```

**POST /api/theme/active**

```javascript
// Update theme settings (including background image)
fetch("/api/theme/active", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    activeTheme: "dark",
    backgroundImage: "/uploads/new-background.jpg",
  }),
});
```

#### Frontend Integration

The background image is automatically applied when the page loads:

```javascript
// In frontend/src/index.js
fetch("http://localhost:5000/api/theme/active")
  .then((res) => res.json())
  .then((data) => {
    if (data.backgroundImage) {
      const fullImageUrl = data.backgroundImage.startsWith("http")
        ? data.backgroundImage
        : `http://localhost:5000${data.backgroundImage}`;

      document.body.style.backgroundImage = `url('${fullImageUrl}')`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundAttachment = "fixed";
    }
  });
```

## Database Schema

The `ThemeSettings` table has been updated to include background image support:

```sql
CREATE TABLE ThemeSettings (
    ID INT PRIMARY KEY IDENTITY,
    ActiveTheme NVARCHAR(50) NOT NULL DEFAULT 'default',
    BackgroundImage NVARCHAR(500) NULL
);
```

## CSS Styling

The background image feature includes automatic styling for better readability:

```css
/* Background image overlay */
body[style*="background-image"]::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: -1;
  pointer-events: none;
}

/* Content sections with backdrop blur */
body[style*="background-image"] .header-main,
body[style*="background-image"] .footer-main,
body[style*="background-image"] .testimonials,
body[style*="background-image"] .featured-products,
body[style*="background-image"] .featured-categories {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
```

## Testing

Run the test script to verify functionality:

```bash
node test-theme-background.js
```

## Best Practices

### Image Recommendations

- **Resolution**: 1920x1080 or higher for best quality
- **Format**: JPG for photos, PNG for graphics with transparency
- **File Size**: Keep under 2MB for optimal loading speed
- **Aspect Ratio**: 16:9 or similar wide format works best

### Content Considerations

- Choose images that don't interfere with text readability
- Consider how the image looks with different themes
- Test on various screen sizes and devices
- Ensure the image represents your brand appropriately

## Troubleshooting

### Common Issues

1. **Image not appearing**

   - Check if the image file was uploaded successfully
   - Verify the file path in the database
   - Clear browser cache and refresh

2. **Poor performance**

   - Optimize image file size
   - Consider using WebP format for better compression
   - Check server upload limits

3. **Content readability issues**
   - The system automatically adds overlay and blur effects
   - If still hard to read, choose a different background image
   - Consider adjusting the overlay opacity in CSS

### Support

For technical issues or questions about the background image feature, please refer to the development team or check the server logs for error messages.
