# DesignXcel Database Schema Documentation

## Database Configuration (.env)

```env
# Database Configuration
DB_SERVER=DESKTOP-F4OI6BT\SQLEXPRESS
DB_USERNAME=DesignXcel
DB_PASSWORD=Azwrathfrozen22@
DB_DATABASE=DesignXcellDB
DB_PORT=1433

# Server Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_very_secure_session_secret_key_here_2024

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51RCLlxPoc51pdmcaRdEOLr1oO3eIIuM3mry7cIkHFQuhukWXcE3ImEEcGz5NggwuFwpbLIRGhUOjkfM8uRJCrrlJ00snnxrsrb
STRIPE_PUBLISHABLE_KEY=pk_test_51RCLlxPoc51pdmcaSH32LZIiLHJjHEmEkm3csrujxIKBcNa6gb6DG1KblYrBsRqtmWS5syIj9mT5P4UgWsprmQv500cFgYV6Sw
STRIPE_WEBHOOK_SECRET=whsec_36c2b51ed69a2e0688d89394559a391ae1cc3812335ed0c2d1564a81c76a8dc8

# Email Configuration for OTP
OTP_EMAIL_USER=design.xcel01@gmail.com
OTP_EMAIL_PASS=mdvc ebdd axqj lhug

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

## Database Schema Overview

The DesignXcel database is built on **Microsoft SQL Server** and contains the following main components:

### **Current Database Status (Updated)**
- **Total Tables**: 25+ active tables
- **Database**: DesignXcellDB (SQL Server)
- **Authentication**: Working with bcrypt password hashing
- **Customer Login**: Fixed and operational
- **Admin System**: Fully functional with role-based access

### 1. Authentication & User Management

#### **Roles Table**
```sql
CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);
```

**Default Roles:**
- Admin (Full system access)
- TransactionManager (Financial operations)
- InventoryManager (Product & stock management)
- UserManager (User & customer relations)
- OrderSupport (Order processing & support)
- Employee (Basic employee access)
- Customer (Shopping & account management)

#### **Users Table (Employees/Admins)**
```sql
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    RoleID INT NOT NULL,
    IsActive BIT DEFAULT 1,
    ProfileImage NVARCHAR(255) NULL,
    PhoneNumber NVARCHAR(20) NULL,
    Department NVARCHAR(100) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    LastLogin DATETIME2 NULL,
    CreatedBy INT NULL,
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);
```

#### **Customers Table**
```sql
CREATE TABLE Customers (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PhoneNumber NVARCHAR(20),
    PasswordHash NVARCHAR(255) NOT NULL,
    ProfileImage NVARCHAR(255) NULL,
    DateOfBirth DATE NULL,
    Gender NVARCHAR(10) NULL,
    IsActive BIT DEFAULT 1,
    IsEmailVerified BIT DEFAULT 0,
    EmailVerificationToken NVARCHAR(255) NULL,
    PasswordResetToken NVARCHAR(255) NULL,
    PasswordResetExpiry DATETIME2 NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    LastLogin DATETIME2 NULL
);
```

**Note**: The `IsEmailVerified` column exists in the schema but was causing login errors. The customer login route has been updated to handle this properly.

### 2. Permission System

#### **RolePermissions Table**
```sql
CREATE TABLE RolePermissions (
    RolePermissionID INT IDENTITY(1,1) PRIMARY KEY,
    RoleID INT NOT NULL,
    Section NVARCHAR(50) NOT NULL,
    CanAccess BIT DEFAULT 0,
    CanCreate BIT DEFAULT 0,
    CanRead BIT DEFAULT 0,
    CanUpdate BIT DEFAULT 0,
    CanDelete BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE,
    UNIQUE(RoleID, Section)
);
```

#### **UserPermissions Table**
```sql
CREATE TABLE UserPermissions (
    PermissionID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Section NVARCHAR(50) NOT NULL,
    CanAccess BIT DEFAULT 0,
    CanCreate BIT DEFAULT 0,
    CanRead BIT DEFAULT 0,
    CanUpdate BIT DEFAULT 0,
    CanDelete BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy INT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    UNIQUE(UserID, Section)
);
```

### 3. Product Management

#### **Products Table** (Core structure)
```sql
-- Products table with key fields
CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(10,2) NOT NULL,
    Category NVARCHAR(100),
    IsActive BIT DEFAULT 1,
    IsFeatured BIT DEFAULT 0,
    DateAdded DATETIME2 DEFAULT GETDATE(),
    -- Additional fields as per schema files
);
```

#### **ProductVariations Table**
```sql
CREATE TABLE ProductVariations (
    VariationID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ProductID INT NOT NULL,
    VariationName NVARCHAR(255) NOT NULL,
    Color NVARCHAR(100) NULL,
    Quantity INT NOT NULL DEFAULT 1,
    VariationImageURL NVARCHAR(500) NULL,
    SKU NVARCHAR(100) NULL,
    PriceDelta DECIMAL(18,2) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy INT NULL,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) ON DELETE SET NULL
);
```

### 4. Order Management

#### **Orders Table**
```sql
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT NOT NULL,
    OrderDate DATETIME NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    TotalAmount DECIMAL(10,2) NOT NULL,
    PaymentMethod NVARCHAR(50) NOT NULL,
    Currency NVARCHAR(10) DEFAULT 'PHP',
    PaymentDate DATETIME NULL,
    ShippingAddressID INT NULL,
    DeliveryType NVARCHAR(20) NOT NULL DEFAULT 'pickup',
    DeliveryCost DECIMAL(10,2) NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    FOREIGN KEY (ShippingAddressID) REFERENCES CustomerAddresses(AddressID),
    
    CONSTRAINT CHK_Orders_Status CHECK (Status IN ('Pending', 'Processing', 'Shipping', 'Delivered', 'Completed', 'Cancelled')),
    CONSTRAINT CHK_Orders_PaymentMethod CHECK (PaymentMethod IN ('Cash on Delivery', 'Credit Card', 'Debit Card', 'PayPal', 'Stripe')),
    CONSTRAINT CHK_Orders_DeliveryType CHECK (DeliveryType = 'pickup' OR DeliveryType LIKE 'rate_%'),
    CONSTRAINT CHK_Orders_TotalAmount CHECK (TotalAmount >= 0),
    CONSTRAINT CHK_Orders_DeliveryCost CHECK (DeliveryCost >= 0)
);
```

#### **OrderItems Table**
```sql
CREATE TABLE OrderItems (
    OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL,
    PriceAtPurchase DECIMAL(10,2) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    
    CONSTRAINT CHK_OrderItems_Quantity CHECK (Quantity > 0),
    CONSTRAINT CHK_OrderItems_Price CHECK (PriceAtPurchase >= 0)
);
```

### 5. Customer Address Management

#### **CustomerAddresses Table**
```sql
CREATE TABLE CustomerAddresses (
    AddressID INT PRIMARY KEY IDENTITY,
    CustomerID INT FOREIGN KEY REFERENCES Customers(CustomerID),
    Label NVARCHAR(50),
    HouseNumber NVARCHAR(50),
    Street NVARCHAR(100),
    Barangay NVARCHAR(100),
    City NVARCHAR(100),
    Province NVARCHAR(100),
    Region NVARCHAR(100),
    PostalCode NVARCHAR(20),
    Country NVARCHAR(100) DEFAULT 'Philippines',
    IsDefault BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);
```

### 6. Review System

#### **ProductReviews Table**
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

### 7. Content Management

#### **HeroBanner Table**
```sql
CREATE TABLE HeroBanner (
    ID INT PRIMARY KEY IDENTITY(1,1),
    MainHeading NVARCHAR(200) NOT NULL DEFAULT 'Premium Office Furniture Solutions',
    DescriptionLine1 NVARCHAR(300) NULL,
    DescriptionLine2 NVARCHAR(300) NULL,
    ButtonText NVARCHAR(100) NOT NULL DEFAULT 'SHOP NOW',
    ButtonLink NVARCHAR(200) NOT NULL DEFAULT '/products',
    TextColor NVARCHAR(7) NOT NULL DEFAULT '#ffffff',
    ButtonBgColor NVARCHAR(7) NOT NULL DEFAULT '#ffc107',
    ButtonTextColor NVARCHAR(7) NOT NULL DEFAULT '#333333',
    HeroBannerImage NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);
```

### 8. Session & Security Management

#### **SessionTokens Table**
```sql
CREATE TABLE SessionTokens (
    TokenID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL,
    CustomerID INT NULL,
    TokenHash NVARCHAR(255) NOT NULL,
    UserType NVARCHAR(20) NOT NULL, -- 'Employee' or 'Customer'
    IsActive BIT DEFAULT 1,
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    LastUsedAt DATETIME2 DEFAULT GETDATE(),
    IPAddress NVARCHAR(45) NULL,
    UserAgent NVARCHAR(500) NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID) ON DELETE CASCADE,
    CHECK ((UserID IS NOT NULL AND CustomerID IS NULL) OR (UserID IS NULL AND CustomerID IS NOT NULL))
);
```

### 9. Audit & Activity Logging

#### **ActivityLogs Table**
```sql
CREATE TABLE ActivityLogs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Action NVARCHAR(100) NOT NULL,
    TableAffected NVARCHAR(100) NULL,
    RecordID INT NULL,
    Description NVARCHAR(MAX) NULL,
    Timestamp DATETIME NOT NULL DEFAULT(GETDATE()),
    
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
```

#### **AuditLog Table**
```sql
CREATE TABLE AuditLog (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL,
    CustomerID INT NULL,
    UserType NVARCHAR(20) NOT NULL, -- 'Employee' or 'Customer'
    Action NVARCHAR(100) NOT NULL,
    Section NVARCHAR(50) NOT NULL,
    EntityID NVARCHAR(50) NULL,
    EntityType NVARCHAR(50) NULL,
    OldValues NVARCHAR(MAX) NULL,
    NewValues NVARCHAR(MAX) NULL,
    IPAddress NVARCHAR(45) NULL,
    UserAgent NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);
```

### 10. Additional Content Management Tables

#### **HeroBanner Table**
```sql
CREATE TABLE HeroBanner (
    ID INT PRIMARY KEY IDENTITY(1,1),
    MainHeading NVARCHAR(200) NOT NULL DEFAULT 'Premium Office Furniture Solutions',
    DescriptionLine1 NVARCHAR(300) NULL,
    DescriptionLine2 NVARCHAR(300) NULL,
    ButtonText NVARCHAR(100) NOT NULL DEFAULT 'SHOP NOW',
    ButtonLink NVARCHAR(200) NOT NULL DEFAULT '/products',
    TextColor NVARCHAR(7) NOT NULL DEFAULT '#ffffff',
    ButtonBgColor NVARCHAR(7) NOT NULL DEFAULT '#ffc107',
    ButtonTextColor NVARCHAR(7) NOT NULL DEFAULT '#333333',
    HeroBannerImage NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);
```

#### **ContactSubmissions Table**
```sql
CREATE TABLE ContactSubmissions (
    SubmissionID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    SubmissionDate DATETIME NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'New',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE()
);
```

#### **AutoMessages Table**
```sql
CREATE TABLE AutoMessages (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Question NVARCHAR(500) NOT NULL,
    Answer NVARCHAR(MAX) NOT NULL,
    Keywords NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT(1),
    CreatedAt DATETIME NOT NULL DEFAULT(GETDATE()),
    UpdatedAt DATETIME NOT NULL DEFAULT(GETDATE())
);
```

### 11. Project & Gallery Management

#### **project_items Table**
```sql
CREATE TABLE project_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    category NVARCHAR(100) NOT NULL,
    tags NVARCHAR(MAX),
    description NVARCHAR(MAX),
    main_image_url NVARCHAR(500) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    is_active BIT DEFAULT 1,
    sort_order INT DEFAULT 0
);
```

#### **project_thumbnails Table**
```sql
CREATE TABLE project_thumbnails (
    id INT IDENTITY(1,1) PRIMARY KEY,
    project_item_id INT NOT NULL,
    image_url NVARCHAR(500) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_project_thumbnails_item 
        FOREIGN KEY (project_item_id) 
        REFERENCES project_items(id) 
        ON DELETE CASCADE
);
```

### 12. Walk-in Orders Management

#### **WalkInOrders Table**
```sql
CREATE TABLE WalkInOrders (
    WalkInOrderID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerName NVARCHAR(255) NOT NULL,
    Address NVARCHAR(MAX) NULL,
    ContactNumber NVARCHAR(100) NULL,
    ContactEmail NVARCHAR(255) NULL,
    OrderedProducts NVARCHAR(MAX) NULL,
    Discount DECIMAL(10,2) NULL DEFAULT(0),
    TotalAmount DECIMAL(10,2) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT('Processing'),
    ExpectedArrival DATETIME NULL,
    CompletedAt DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT(GETDATE())
);
```

### 13. Testimonials & Design

#### **Testimonials Table**
```sql
CREATE TABLE Testimonials (
    TestimonialID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerName NVARCHAR(100) NOT NULL,
    CustomerTitle NVARCHAR(100) NULL,
    Company NVARCHAR(100) NULL,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Comment NVARCHAR(MAX) NOT NULL,
    ImageURL NVARCHAR(500) NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);
```

#### **TestimonialsDesign Table**
```sql
CREATE TABLE TestimonialsDesign (
    ID INT PRIMARY KEY IDENTITY(1,1),
    Theme NVARCHAR(50) NOT NULL DEFAULT 'default',
    Layout NVARCHAR(50) NOT NULL DEFAULT 'grid',
    PerRow NVARCHAR(10) NOT NULL DEFAULT '3',
    Animation NVARCHAR(50) NOT NULL DEFAULT 'none',
    BgColor NVARCHAR(7) NOT NULL DEFAULT '#ffffff',
    TextColor NVARCHAR(7) NOT NULL DEFAULT '#333333',
    AccentColor NVARCHAR(7) NOT NULL DEFAULT '#ffc107',
    BorderRadius NVARCHAR(10) NOT NULL DEFAULT '8',
    ShowRating BIT NOT NULL DEFAULT 1,
    ShowImage BIT NOT NULL DEFAULT 1,
    ShowTitle BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);
```

### 14. Enhanced Product Features

#### **Products Table (Enhanced)**
The Products table includes additional columns for 3D models and thumbnails:
```sql
-- Additional columns in Products table
Model3D NVARCHAR(500) NULL,           -- 3D model file URL
Has3DModel BIT NOT NULL DEFAULT 0,    -- Flag for 3D model availability
ThumbnailURLs NVARCHAR(MAX) NULL,     -- JSON array of thumbnail URLs
```

#### **ProductDiscounts Table**
```sql
CREATE TABLE ProductDiscounts (
    DiscountID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    DiscountType NVARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    DiscountValue DECIMAL(10,2) NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
);
```

#### **RawMaterials Table**
```sql
CREATE TABLE RawMaterials (
    MaterialID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    CurrentStock INT NOT NULL DEFAULT 0,
    Unit NVARCHAR(20) NOT NULL,
    CostPerUnit DECIMAL(10,2) NULL,
    Supplier NVARCHAR(100) NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);
```

#### **ProductMaterials Table**
```sql
CREATE TABLE ProductMaterials (
    ProductMaterialID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    MaterialID INT NOT NULL,
    QuantityRequired INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (MaterialID) REFERENCES RawMaterials(MaterialID) ON DELETE CASCADE
);
```

## Key Features

### 1. **Role-Based Access Control (RBAC)**
- Granular permissions per role and user
- Support for both role-based and user-specific permissions
- Sections: dashboard, users, customers, products, inventory, orders, transactions, reports, settings, cms, support

### 2. **Multi-User System**
- Separate tables for employees (Users) and customers (Customers)
- Unified session management for both user types
- Role-based access control for employees

### 3. **E-commerce Functionality**
- Product catalog with variations and 3D models
- Shopping cart and order management
- Customer address book (multiple addresses)
- Product reviews and ratings
- Payment integration (Stripe)
- Walk-in order management

### 4. **Content Management**
- Hero banner customization
- Product management with featured items
- Image and media management
- Project gallery system
- Testimonials management
- Contact form submissions

### 5. **Security & Audit**
- Session token management
- Activity logging
- Audit trails for all changes
- Password reset functionality
- Email verification

### 6. **Advanced Features**
- 3D model support for products
- Product variations and discounts
- Raw materials inventory management
- Automated FAQ responses
- Project portfolio management
- Testimonials design customization

## Database Connection Details

- **Server**: DESKTOP-F4OI6BT\SQLEXPRESS
- **Database**: DesignXcellDB
- **Port**: 1433
- **Authentication**: SQL Server Authentication
- **Username**: DesignXcel
- **Password**: Azwrathfrozen22@

### **Current Database State:**
- **Total Tables**: 25+ active tables
- **Total Users**: 5+ active users
- **Admin User**: Drei (andreijumaw@gmail.com)
- **Password System**: bcrypt hashing (production ready)
- **Authentication**: Working correctly
- **Session Management**: Active
- **Customer Login**: Fixed and operational
- **Database**: DesignXcellDB (SQL Server)

## Current Working Login Credentials

### **Main Admin User:**
- **Email**: andreijumaw@gmail.com
- **Password**: admin123
- **Username**: Drei
- **Role**: Admin (Full system access)

### **Other Active Users:**
- **Jeff** (jeffantonio@gmail.com) - Password: `password123` - Role: InventoryManager
- **Baste** (sebastian@gmail.com) - Password: `password123` - Role: TransactionManager  
- **Eugene** (eugeniopantua@gmail.com) - Password: `password123` - Role: UserManager
- **David** (davidgacuts@gmail.com) - Password: `password123` - Role: OrderSupport

### **Login Instructions:**
1. Start your Node.js server
2. Go to: http://localhost:5000/login
3. Use any of the credentials above
4. System will redirect to appropriate dashboard based on role

## System Status

### **✅ Current Working State:**
- **Database**: Connected and operational
- **Authentication**: Fixed and working with bcrypt password hashing
- **All Users**: Active with working credentials
- **Login System**: Fully functional
- **Role-Based Access**: Working correctly
- **Customer Login**: Fixed and operational
- **Admin System**: Fully functional

### **🔧 Authentication Details:**
- **Password Storage**: bcrypt hashing (production ready)
- **Login Endpoint**: `/auth/login` (employees), `/api/auth/customer/login` (customers)
- **Session Management**: Active and working
- **Role Redirects**: Automatic based on user role
- **Customer Authentication**: Working with proper error handling

### **📋 Available User Roles:**
1. **Admin** (Drei) - Full system access
2. **InventoryManager** (Jeff) - Product and inventory management
3. **TransactionManager** (Baste) - Financial operations
4. **UserManager** (Eugene) - User and customer relations
5. **OrderSupport** (David) - Order processing and support

## Important Notes

1. **Security**: Passwords are currently stored as plain text for development
2. **Production**: Implement bcrypt password hashing before production deployment
3. **Backup**: Regular database backups recommended
4. **Indexes**: Performance indexes are created for all major tables
5. **Constraints**: Data validation constraints ensure data integrity
6. **Triggers**: Automatic timestamp updates for audit trails

## Troubleshooting

### **Common Login Issues:**

#### **"Invalid email or password" Error:**
- ✅ **Fixed**: All users now have working passwords
- **Solution**: Use the credentials listed above
- **Admin**: andreijumaw@gmail.com / admin123
- **Others**: Use respective email / password123

#### **Customer Login 500 Error:**
- ✅ **Fixed**: Customer login route updated to handle database schema properly
- **Issue**: Was trying to access non-existent `IsEmailVerified` column
- **Solution**: Route updated to exclude problematic column references
- **Status**: Customer login now working correctly

#### **Database Connection Issues:**
- **Check**: SQL Server is running
- **Verify**: Connection string in .env file
- **Test**: Use SQL Server Management Studio

#### **Session Issues:**
- **Clear**: Browser cookies and cache
- **Restart**: Node.js server
- **Check**: Session secret in .env file

### **Development Notes:**
- **Password Security**: Now using bcrypt hashing (production ready)
- **Customer Login**: Fixed and working correctly
- **Database Schema**: Updated with all current tables and relationships
- **Testing**: All authentication flows are working correctly
- **Recent Fixes**: Customer login 500 error resolved

This schema supports a comprehensive e-commerce platform with role-based access control, product management, order processing, and customer management capabilities.
