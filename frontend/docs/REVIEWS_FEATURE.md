# Product Reviews Feature

## Overview

The Product Reviews feature allows customers to view and submit reviews for products on the DesignXcel e-commerce platform. This feature is integrated into the product detail pages and provides a comprehensive review system with ratings, comments, and statistics.

## Features

### For Customers

- **View Reviews**: See all customer reviews for any product
- **Review Statistics**: View average ratings and rating distribution
- **Submit Reviews**: Logged-in users can submit their own reviews with ratings and comments
- **Star Ratings**: 1-5 star rating system with visual star display
- **Review Helpfulness**: See how many people found each review helpful

### For Non-Logged Users

- **Read Reviews**: Can view all existing reviews
- **Login Prompt**: Encouraged to log in to submit their own reviews

## Technical Implementation

### Components

- `ProductReviews.js` - Main reviews component
- `ProductReviews.css` - Styling for the reviews component

### Services

- `reviews.js` - API service for review operations
  - `getProductReviews(productId)` - Fetch reviews for a product
  - `addProductReview(productId, reviewData)` - Submit a new review
  - `getProductReviewStats(productId)` - Get review statistics

### Integration

- Integrated into `ProductDetail.js` page
- Uses authentication context to check user login status
- Responsive design for mobile and desktop

## Usage

### Viewing Reviews

1. Navigate to any product detail page
2. Scroll down to the "Customer Reviews" section
3. View review statistics and individual reviews

### Submitting a Review

1. Log in to your account
2. Navigate to the product you want to review
3. Click "Write a Review" button
4. Select a rating (1-5 stars)
5. Write your review comment
6. Click "Submit Review"

## Authentication Requirements

- **Viewing Reviews**: No authentication required
- **Submitting Reviews**: Must be logged in
- **User Information**: Reviews show the user's name (first + last name or email)

## Mock Data

The system includes mock review data for testing when the backend is not available:

- Sample reviews for products 1-6
- Various ratings and helpfulness counts
- Realistic user names and comments

## Styling

- Modern, clean design matching the overall site theme
- Responsive layout for mobile devices
- Star rating system with hover effects
- Progress bars for rating distribution
- Form validation and error handling

## Future Enhancements

- Review helpfulness voting
- Review filtering and sorting
- Review moderation system
- Photo/video reviews
- Review responses from sellers
- Review analytics for admin dashboard

## Backend Integration

The system is designed to work with a backend API but includes fallback mock data:

- API endpoints: `/api/products/{id}/reviews`
- POST for submitting reviews
- GET for fetching reviews and statistics
- Authentication via JWT tokens

## Testing

To test the reviews feature:

1. Start the frontend application
2. Navigate to any product detail page
3. Scroll down to see the reviews section
4. Try submitting a review (requires login)
5. Test the responsive design on different screen sizes
