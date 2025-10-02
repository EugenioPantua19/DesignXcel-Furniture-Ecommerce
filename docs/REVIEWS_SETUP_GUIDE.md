# Product Reviews Setup Guide

## Overview

This guide will help you set up the product reviews feature that allows customers to view and submit reviews for products. The system includes database integration, API endpoints, and a modern frontend interface.

## Prerequisites

- SQL Server database with existing Products and Customers tables
- Node.js backend server running
- React frontend application

## Step 1: Database Setup

### 1.1 Execute the Database Schema

Run the `reviews_schema.sql` file in your SQL Server database:

```sql
-- Execute this in SQL Server Management Studio or your preferred SQL client
-- The file contains:
-- - ProductReviews table creation
-- - Indexes for performance
-- - Triggers for timestamp updates
-- - Stored procedures for review operations
-- - Sample review data
```

### 1.2 Verify Database Setup

Run the test script to verify everything is working:

```bash
node test-reviews-setup.js
```

This will check:

- ✅ ProductReviews table exists
- ✅ Stored procedures are created
- ✅ Sample reviews are inserted
- ✅ API endpoints are working

## Step 2: Backend Setup

### 2.1 API Routes

The backend now includes new API endpoints in `backend/api-routes.js`:

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/:productId/reviews` - Get reviews for a product
- `POST /api/products/:productId/reviews` - Add a new review
- `GET /api/products/:productId/reviews/stats` - Get review statistics

### 2.2 Start Backend Server

```bash
cd backend
npm start
```

The server should start on port 5000 and include the new API routes.

## Step 3: Frontend Setup

### 3.1 Updated Components

The frontend now includes:

- `ProductReviews.js` - Main reviews component
- `ProductReviews.css` - Styling for reviews
- Updated `ProductDetail.js` - Includes reviews section
- Updated services for API integration

### 3.2 Start Frontend Application

```bash
cd frontend
npm start
```

## Step 4: Testing the Feature

### 4.1 View Product Details

1. Navigate to any product detail page
2. Scroll down to see the "Customer Reviews" section
3. View review statistics and individual reviews

### 4.2 Submit a Review (Logged-in Users Only)

1. Log in to your account
2. Navigate to a product you want to review
3. Click "Write a Review"
4. Select a rating (1-5 stars)
5. Write your review comment
6. Click "Submit Review"

### 4.3 Test API Endpoints

You can test the API endpoints directly:

```bash
# Get all products
curl http://localhost:5000/api/products

# Get product by ID
curl http://localhost:5000/api/products/1

# Get reviews for product
curl http://localhost:5000/api/products/1/reviews

# Get review statistics
curl http://localhost:5000/api/products/1/reviews/stats
```

## Database Schema Details

### ProductReviews Table

```sql
CREATE TABLE ProductReviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    CustomerID INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Comment NVARCHAR(1000) NOT NULL,
    HelpfulCount INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,

    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID) ON DELETE CASCADE,
    CONSTRAINT UQ_CustomerProduct UNIQUE (CustomerID, ProductID)
);
```

### Stored Procedures

- `GetProductReviews` - Retrieves reviews for a specific product
- `AddProductReview` - Adds or updates a review (one per customer per product)
- `GetProductReviewStats` - Gets review statistics and rating distribution

## Features Implemented

### ✅ For All Users

- View product reviews and ratings
- See review statistics (average rating, rating distribution)
- Read individual review comments
- See review dates and helpfulness counts

### ✅ For Logged-in Users

- Submit new reviews with ratings and comments
- Update existing reviews
- See their own reviews highlighted

### ✅ Technical Features

- Responsive design for mobile and desktop
- Real-time review submission
- Automatic statistics updates
- Form validation and error handling
- Authentication integration
- Database persistence

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

   - Check your database connection string in backend configuration
   - Ensure SQL Server is running
   - Verify database permissions

2. **API Endpoints Not Working**

   - Check if backend server is running on port 5000
   - Verify CORS settings
   - Check browser console for errors

3. **Reviews Not Showing**

   - Ensure ProductReviews table exists
   - Check if sample data was inserted
   - Verify stored procedures are created

4. **Authentication Issues**
   - Ensure user is logged in to submit reviews
   - Check if customer ID is being passed correctly
   - Verify user session is valid

### Debug Commands

```bash
# Test database connection
node test-reviews-setup.js

# Check backend logs
cd backend && npm start

# Check frontend logs
cd frontend && npm start
```

## Next Steps

### Potential Enhancements

- Review helpfulness voting
- Review filtering and sorting
- Review moderation system
- Photo/video reviews
- Review responses from sellers
- Review analytics for admin dashboard

### Performance Optimization

- Add caching for review statistics
- Implement pagination for large review lists
- Add database indexes for better performance

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Verify all database objects are created correctly
4. Ensure both backend and frontend are running

The reviews feature is now fully integrated and ready for production use!
