# Multi-Image Hero Banner System

## Overview

The hero banner system has been upgraded to support 1-3 images with automatic carousel functionality on the frontend.

## Features

- **Multiple Image Upload**: Upload 1-3 images through the CMS
- **Auto-Rotation**: Images automatically rotate every 4 seconds on the frontend
- **Manual Navigation**: Users can click navigation arrows or indicator dots
- **Smooth Transitions**: CSS transitions for smooth image changes
- **Fallback Support**: Falls back to yellow gradient when no images are set

## Database Changes

The `HeroBanner` table now includes:

- `HeroBannerImages` (NVARCHAR(MAX)): JSON array of image URLs
- Old `HeroBannerImage` column is preserved for backward compatibility

## Migration

Run the `hero_banner_migration.sql` script to update your database:

```sql
-- Add new column
ALTER TABLE HeroBanner ADD HeroBannerImages NVARCHAR(MAX);

-- Migrate existing data
UPDATE HeroBanner
SET HeroBannerImages = CASE
    WHEN HeroBannerImage IS NOT NULL THEN '["' + HeroBannerImage + '"]'
    ELSE NULL
END;
```

## CMS Updates

### Admin CMS

- File input now accepts multiple images (1-3)
- Preview shows all uploaded images with numbering
- Live preview includes carousel with navigation dots
- Remove button clears all images

### Frontend

- Hero banner automatically rotates through images
- Navigation arrows appear when multiple images exist
- Indicator dots show current image and allow clicking
- Smooth transitions between images

## API Endpoints

- `POST /api/admin/hero-banner`: Upload multiple images (max 3)
- `GET /api/admin/hero-banner`: Get hero banner settings with image array
- `GET /api/hero-banner`: Public endpoint for frontend
- `DELETE /api/admin/hero-banner`: Remove all images

## File Storage

- Images are stored in `backend/public/uploads/`
- URLs are returned as `/uploads/filename.jpg`
- Frontend accesses via `http://localhost:5000/uploads/filename.jpg`

## Usage Instructions

1. **Upload Images**: Go to Admin CMS → Hero Banner → Upload 1-3 images
2. **Save Settings**: Click "Save Hero Banner Settings"
3. **Preview**: Use the live preview to see the carousel in action
4. **Frontend**: Images will automatically rotate on the homepage

## Customization

- **Rotation Speed**: Modify the interval in `frontend/src/pages/Home.js` (currently 4000ms)
- **Transition Effects**: Adjust CSS transitions in the hero carousel styles
- **Navigation Style**: Customize arrow and indicator appearance in CSS

## Browser Support

- Modern browsers with CSS transitions
- Fallback to static first image for older browsers
- Responsive design for mobile devices
