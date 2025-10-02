# Product Discount Functionality Setup Guide

This guide explains how to set up and use the new product discount functionality for featured products in the DesignXcel CMS system.

## Overview

The discount functionality allows administrators to:

- Set percentage or fixed amount discounts on featured products
- Define discount start and end dates
- View discounted prices on the frontend
- Have discounted prices automatically applied during checkout and order processing

## Database Setup

### 1. Run the Database Schema

First, execute the `product_discounts_schema.sql` file in your SQL Server database:

```sql
-- This will create:
-- - ProductDiscounts table
-- - vw_ProductsWithDiscounts view
-- - Stored procedures: sp_AddProductDiscount, sp_RemoveProductDiscount, sp_GetProductDiscount
-- - Indexes for performance
-- - Triggers for automatic timestamp updates
```

### 2. Verify Database Setup

Run the test script to verify everything is working:

```bash
node test-discount-functionality.js
```

## Backend API Endpoints

The following new API endpoints have been added:

### Admin Endpoints (for CMS)

- `GET /api/admin/products/:id/discount` - Get discount information for a product
- `POST /api/admin/products/:id/discount` - Add/update discount for a product
- `DELETE /api/admin/products/:id/discount` - Remove discount from a product

### Frontend Endpoints

- `GET /api/products` - Now includes discount information for all products
- `GET /api/admin/products` - Now includes discount information for admin products

## CMS Interface

### Accessing the Discount Management

1. Log in to the admin panel
2. Navigate to **Content Management** → **Products** tab
3. You'll see a new table with columns:
   - Name
   - Category
   - Price (shows discounted price if applicable)
   - Featured
   - Discount (shows current discount status)
   - Actions (Set/Edit/Remove discount buttons)

### Setting a Discount

1. Click **"Set Discount"** button for any product
2. Fill in the discount form:
   - **Discount Type**: Choose "Percentage (%)" or "Fixed Amount (₱)"
   - **Discount Value**: Enter the discount amount
   - **Start Date**: When the discount becomes active
   - **End Date**: When the discount expires
3. Click **"Save Discount"**

### Editing a Discount

1. Click **"Edit Discount"** button for products with existing discounts
2. Modify the discount details
3. Click **"Save Discount"**

### Removing a Discount

1. Click **"Remove"** button for products with existing discounts
2. Confirm the removal

## Frontend Display

### Product Cards

Product cards now display:

- **Discounted price** in red/bold
- **Original price** with strikethrough
- **Discount percentage badge** (for percentage discounts)
- **Savings amount** (calculated automatically)

### Cart and Checkout

- Cart automatically uses discounted prices
- Checkout process uses discounted prices
- Order records store the actual price paid (discounted price)

## Discount Types

### Percentage Discounts

- Example: 20% off
- Calculated as: `Original Price - (Original Price × 20%)`
- Maximum: 100%

### Fixed Amount Discounts

- Example: ₱50 off
- Calculated as: `Original Price - ₱50`
- Minimum discounted price: ₱0 (cannot go negative)

## Database Schema Details

### ProductDiscounts Table

```sql
CREATE TABLE ProductDiscounts (
    DiscountID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    DiscountType NVARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    DiscountValue DECIMAL(10,2) NOT NULL,
    StartDate DATETIME2 NOT NULL,
    EndDate DATETIME2 NOT NULL,
    IsActive BIT NOT NULL DEFAULT(1),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy INT NULL
);
```

### Key Features

- **One active discount per product**: Only one discount can be active at a time
- **Date-based activation**: Discounts only apply between start and end dates
- **Automatic deactivation**: Old discounts are automatically deactivated when new ones are added
- **Audit trail**: Tracks who created discounts and when

## API Usage Examples

### Adding a Percentage Discount

```javascript
const response = await fetch("/api/admin/products/123/discount", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    discountType: "percentage",
    discountValue: 25.0,
    startDate: "2024-01-01T00:00:00",
    endDate: "2024-01-31T23:59:59",
  }),
});
```

### Adding a Fixed Amount Discount

```javascript
const response = await fetch("/api/admin/products/123/discount", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    discountType: "fixed",
    discountValue: 100.0,
    startDate: "2024-01-01T00:00:00",
    endDate: "2024-01-31T23:59:59",
  }),
});
```

### Getting Product with Discount Info

```javascript
const response = await fetch("/api/products");
const data = await response.json();

data.products.forEach((product) => {
  if (product.hasDiscount) {
    console.log(
      `${product.name}: ₱${product.price} → ₱${product.discountInfo.discountedPrice}`
    );
  }
});
```

## Testing

### Manual Testing Steps

1. **Database Setup Test**:

   ```bash
   node test-discount-functionality.js
   ```

2. **CMS Interface Test**:

   - Log in to admin panel
   - Go to Content Management → Products
   - Set a discount on a featured product
   - Verify the discount appears in the table

3. **Frontend Display Test**:

   - Visit the homepage
   - Check if featured products show discounted prices
   - Add discounted products to cart
   - Verify cart shows discounted prices

4. **Order Processing Test**:
   - Complete a purchase with discounted products
   - Check order records to ensure discounted prices are saved

### Expected Results

- ✅ Discounts appear in CMS product table
- ✅ Frontend shows discounted prices with strikethrough original prices
- ✅ Cart uses discounted prices
- ✅ Orders record discounted prices
- ✅ Discounts expire automatically based on end date

## Troubleshooting

### Common Issues

1. **Discount not showing on frontend**:

   - Check if product is marked as featured
   - Verify discount is within start/end date range
   - Check browser console for API errors

2. **CMS discount form not working**:

   - Check browser console for JavaScript errors
   - Verify API endpoints are accessible
   - Check database connection

3. **Database errors**:
   - Ensure ProductDiscounts table exists
   - Verify stored procedures are created
   - Check database permissions

### Debug Commands

```sql
-- Check if discounts exist
SELECT * FROM ProductDiscounts WHERE IsActive = 1;

-- Check products with discounts
SELECT * FROM vw_ProductsWithDiscounts WHERE DiscountID IS NOT NULL;

-- Test discount calculation
EXEC sp_GetProductDiscount @ProductID = 1;
```

## Security Considerations

- Only authenticated admin users can manage discounts
- Discount values are validated (percentage ≤ 100%, fixed amount > 0)
- Date validation prevents invalid date ranges
- SQL injection protection through parameterized queries

## Performance Notes

- Indexes are created on frequently queried columns
- Discount calculations are done at the database level
- Frontend caches product data to reduce API calls
- Stored procedures optimize database operations

## Future Enhancements

Potential improvements for future versions:

- Bulk discount operations
- Category-based discounts
- Customer-specific discounts
- Discount codes/coupons
- Discount analytics and reporting
- Email notifications for discount expirations
