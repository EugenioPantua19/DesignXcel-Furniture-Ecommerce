# Gallery Management System

## Overview

The Gallery Management System is a comprehensive backend solution that allows administrators to manage gallery images with rich modal content. Users can upload main gallery images, add detailed descriptions, tags, and multiple thumbnail images that appear in the modal when clicked.

## Features

### 🖼️ Main Gallery Image Management

- **Upload Main Image**: The primary image that appears in the gallery grid
- **Image Requirements**: Recommended size 800x600 or larger
- **File Types**: Supports all common image formats (JPG, PNG, GIF, WebP)

### 📝 Content Management

- **Title**: Descriptive name for the gallery item
- **Category**: Organized into predefined categories (desks, chairs, storage, conference, etc.)
- **Tags**: Comma-separated keywords for better searchability
- **Description**: Detailed text description that appears in the modal

### 🖼️ Modal Thumbnail System

- **Multiple Thumbnails**: Upload 1-8 thumbnail images per gallery item
- **Thumbnail Requirements**: Recommended size 200x150 or larger
- **Modal Display**: Thumbnails appear horizontally in the modal for easy navigation
- **Preview System**: Real-time preview of selected thumbnails before upload

## Backend Implementation

### Database Schema

The system uses two main tables:

#### `gallery_items`

- `id`: Unique identifier
- `title`: Gallery item title
- `category`: Item category
- `tags`: Comma-separated tags
- `description`: Detailed description
- `main_image_url`: Path to main gallery image
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `is_active`: Active status flag
- `sort_order`: Display order

#### `gallery_thumbnails`

- `id`: Unique identifier
- `gallery_item_id`: Reference to gallery item
- `image_url`: Path to thumbnail image
- `sort_order`: Display order
- `created_at`: Creation timestamp

### API Endpoints

#### GET `/api/admin/gallery`

Fetches all gallery items with their thumbnails

#### POST `/api/admin/gallery`

Creates a new gallery item

- **Form Data**:
  - `mainImage`: Main gallery image file
  - `title`: Item title
  - `category`: Item category
  - `tags`: Comma-separated tags
  - `description`: Item description
  - `thumbnails`: Multiple thumbnail image files (1-8)

#### PUT `/api/admin/gallery/:id`

Updates an existing gallery item

#### DELETE `/api/admin/gallery/:id`

Deletes a gallery item and all associated thumbnails

## Frontend Integration

### Gallery Display

The existing frontend gallery design remains unchanged. The system automatically:

- Displays main images in the masonry grid
- Shows categories and tags
- Maintains the current responsive design

### Modal Enhancement

When a gallery item is clicked, the modal now displays:

- **Left Side**: Large main image
- **Right Side**: Horizontal thumbnail strip (1-8 images)
- **Bottom**: Title, tags, description, and call-to-action button

### Thumbnail Navigation

- Users can click thumbnails to view different images
- Thumbnails are limited to 8 images maximum
- Horizontal scrolling for better mobile experience

## Admin Interface

### CMS Integration

The gallery management is integrated into the existing CMS system with two access levels:

#### Admin Panel (`/Employee/Admin/CMS`)

- Full gallery management capabilities
- Add, edit, delete gallery items
- Manage all content and images

#### Inventory Manager Panel (`/Employee/Inventory/InvManagerCMS`)

- Same functionality as admin panel
- Restricted access for inventory managers

### Form Features

- **Real-time Validation**: Ensures required fields are filled
- **Image Preview**: Shows thumbnail previews before upload
- **File Validation**: Checks file types and sizes
- **Success Feedback**: Clear confirmation messages
- **Error Handling**: Detailed error messages for troubleshooting

## Usage Instructions

### Adding a New Gallery Item

1. **Navigate to CMS** → **Gallery** tab
2. **Upload Main Image**:
   - Click "Choose File" for main gallery image
   - Ensure image is 800x600 or larger
3. **Fill Item Details**:
   - Enter descriptive title
   - Select appropriate category
   - Add relevant tags (comma-separated)
   - Write detailed description
4. **Upload Thumbnails**:
   - Select 1-8 thumbnail images
   - Preview thumbnails before submission
5. **Submit**: Click "Add Gallery Item" button

### Managing Existing Items

- **View**: All items displayed in organized grid
- **Edit**: Click edit button to modify existing items
- **Delete**: Remove items with confirmation dialog
- **Preview**: See main image, thumbnails, and content

### Best Practices

#### Image Optimization

- **Main Images**: Use high-quality images (800x600+)
- **Thumbnails**: Optimize for web (200x150+)
- **File Formats**: JPG for photos, PNG for graphics with transparency
- **File Sizes**: Keep under 2MB for main images, 500KB for thumbnails

#### Content Management

- **Titles**: Use descriptive, SEO-friendly titles
- **Tags**: Include relevant keywords for searchability
- **Categories**: Choose appropriate category for organization
- **Descriptions**: Write engaging, informative descriptions

#### Organization

- **Sort Order**: Use sort order for priority items
- **Categories**: Group related items together
- **Tags**: Use consistent tagging conventions
- **Active Status**: Deactivate outdated items instead of deleting

## Technical Requirements

### Backend

- Node.js with Express
- MySQL/MariaDB database
- Multer for file uploads
- Image processing capabilities

### Frontend

- React.js components
- Responsive CSS design
- Image lazy loading
- Modal/lightbox functionality

### File Storage

- Organized upload directory structure
- Image optimization and resizing
- Backup and recovery procedures

## Security Considerations

### File Upload Security

- File type validation
- File size limits
- Malware scanning
- Secure file naming

### Access Control

- Role-based permissions
- Session management
- CSRF protection
- Input validation

## Troubleshooting

### Common Issues

#### Images Not Displaying

- Check file paths and permissions
- Verify image file integrity
- Check browser console for errors

#### Upload Failures

- Verify file size limits
- Check file type restrictions
- Ensure proper form encoding
- Check server storage permissions

#### Modal Issues

- Verify thumbnail count (max 8)
- Check image loading in modal
- Ensure proper event handling

### Performance Optimization

- Image compression and optimization
- Lazy loading for gallery items
- Efficient database queries
- CDN integration for images

## Future Enhancements

### Planned Features

- **Bulk Operations**: Upload multiple items at once
- **Advanced Filtering**: Search by tags, categories, dates
- **Image Editing**: Basic image manipulation tools
- **Analytics**: View counts and engagement metrics
- **API Integration**: External gallery management tools

### Scalability

- **Image CDN**: Cloud-based image delivery
- **Database Optimization**: Advanced indexing and caching
- **Load Balancing**: Distributed image serving
- **Mobile App**: Native mobile management interface

## Support and Maintenance

### Regular Maintenance

- Database optimization
- Image storage cleanup
- Performance monitoring
- Security updates

### Backup Procedures

- Regular database backups
- Image file backups
- Configuration backups
- Recovery testing

---

_This system maintains the existing frontend gallery design while providing comprehensive backend management capabilities for content administrators._
