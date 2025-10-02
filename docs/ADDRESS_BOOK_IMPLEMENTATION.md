# Address Book Implementation Guide

## Overview

The address book functionality has been enhanced to allow customers to manage multiple addresses (up to 2) with the ability to set a default address that will be displayed on the profile page and used for checkout.

## Features Implemented

### 1. Multiple Address Support

- Customers can now have up to 2 addresses
- Each address has a customizable label (e.g., "Home", "Office", "Vacation Home")
- Addresses are stored with full details including house number, street, barangay, city, province, region, postal code, and country

### 2. Default Address Management

- Only one address can be set as default at a time
- The default address is automatically displayed on the profile page
- When setting a new default address, all other addresses are automatically set to non-default

### 3. Address Management Interface

- **Add New Address**: Form to add a new address with all required fields
- **Edit Address**: Modify existing address details
- **Delete Address**: Remove an address with confirmation
- **Set as Default**: Quick action to set any address as default
- **Address Display**: Clean card-based layout showing address details and actions

### 4. Profile Integration

- The profile page automatically displays the default address
- Address changes in the address book are reflected on the profile page
- Legacy profile address editing still works for backward compatibility

## Database Schema

The `CustomerAddresses` table already exists in your database and supports the new functionality. The table structure includes:

```sql
CREATE TABLE CustomerAddresses (
    AddressID INT PRIMARY KEY IDENTITY,
    CustomerID INT FOREIGN KEY REFERENCES Customers(CustomerID),
    Label NVARCHAR(50),                    -- Address label (Home, Office, etc.)
    HouseNumber NVARCHAR(50),              -- House/Building number
    Street NVARCHAR(100),                  -- Street address
    Barangay NVARCHAR(100),                -- Barangay
    City NVARCHAR(100),                    -- City
    Province NVARCHAR(100),                -- Province
    Region NVARCHAR(100),                  -- Region
    PostalCode NVARCHAR(20),               -- Postal code
    Country NVARCHAR(100) DEFAULT 'Philippines',
    IsDefault BIT DEFAULT 0,               -- Default address flag
    CreatedAt DATETIME DEFAULT GETDATE()   -- Creation timestamp
);
```

## Required Database Updates

Run the following SQL script to ensure your database has the correct structure:

```sql
-- Execute the address_book_schema_update.sql file
-- This script will:
-- 1. Verify the CustomerAddresses table exists
-- 2. Add any missing columns (Label, IsDefault, CreatedAt)
-- 3. Create performance indexes
-- 4. Set default addresses for existing customers
```

## API Endpoints

### GET /api/customer/addresses

- Returns all addresses for the logged-in customer
- Response: `{ success: true, addresses: [...] }`

### POST /api/customer/addresses

- Adds a new address
- Body: `{ label, houseNumber, street, barangay, city, province, region, postalCode, country, isDefault }`
- Automatically handles default address logic

### PUT /api/customer/addresses/:addressId

- Updates an existing address
- Body: Same as POST
- Automatically handles default address logic

### DELETE /api/customer/addresses/:addressId

- Deletes an address
- If deleting the default address, automatically sets another address as default

## Frontend Components

### AddressBook.js

- Main address book component with full CRUD functionality
- Form validation and error handling
- Responsive design with modern UI
- Address limit enforcement (max 2 addresses)

### ProfileManagement.js

- Updated to display the default address from the address book
- Maintains backward compatibility with existing address editing

## CSS Styles

New styles have been added to `account.css`:

- `.address-book-container` - Main container styling
- `.address-book-header` - Header with title and add button
- `.address-form-container` - Form styling for add/edit
- `.address-actions` - Action buttons styling
- `.btn-sm`, `.btn-outline`, `.btn-danger` - Button variants

## Usage Instructions

### For Customers:

1. Navigate to Account → Address Book
2. Click "Add New Address" to add your first address
3. Fill in the address details and optionally set as default
4. Add a second address if needed (up to 2 total)
5. Use the action buttons to edit, delete, or set default addresses

### For Developers:

1. Run the database schema update script
2. Restart the backend server to load the new API endpoints
3. The frontend changes are already implemented and ready to use

## Testing

A test script `test-address-book.js` has been provided to verify the functionality:

- Tests adding multiple addresses
- Tests setting default addresses
- Tests the API endpoints

## Backward Compatibility

- Existing customers with addresses will continue to work
- The profile page address editing still functions
- All existing checkout flows remain unchanged
- The default address is automatically selected for existing customers

## Security Features

- All endpoints require customer authentication
- Address operations are restricted to the logged-in customer's addresses
- Input validation and sanitization
- SQL injection protection through parameterized queries

## Performance Considerations

- Database indexes on CustomerID, IsDefault, and CreatedAt
- Efficient queries for address operations
- Minimal database calls for address management
- Responsive UI with loading states

## Future Enhancements

Potential improvements for future versions:

- Address validation and geocoding
- Address templates for common locations
- Bulk address import/export
- Address history tracking
- Integration with shipping providers
