-- Azure SQL Database Migration Script for DesignXcel
-- This script sets up the complete database schema for Azure SQL Database
-- Run this script after creating your Azure SQL Database

-- ===========================================
-- ENABLE FEATURES AND SET OPTIONS
-- ===========================================
-- Note: Some features may not be available in Basic tier
-- Upgrade to Standard or Premium if needed

-- ===========================================
-- CREATE TABLES
-- ===========================================

-- Users table for admin/employee accounts
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        UserID int IDENTITY(1,1) PRIMARY KEY,
        Username nvarchar(50) NOT NULL UNIQUE,
        PasswordHash nvarchar(255) NOT NULL,
        FullName nvarchar(100) NOT NULL,
        Email nvarchar(100) NOT NULL UNIQUE,
        RoleID int NOT NULL,
        IsActive bit DEFAULT 1,
        CreatedAt datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE()
    );
    PRINT 'Users table created successfully';
END
ELSE
BEGIN
    PRINT 'Users table already exists';
END

-- Roles table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Roles' AND xtype='U')
BEGIN
    CREATE TABLE Roles (
        RoleID int IDENTITY(1,1) PRIMARY KEY,
        RoleName nvarchar(50) NOT NULL UNIQUE,
        Description nvarchar(255),
        CreatedAt datetime2 DEFAULT GETDATE()
    );
    PRINT 'Roles table created successfully';
END
ELSE
BEGIN
    PRINT 'Roles table already exists';
END

-- Customers table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Customers' AND xtype='U')
BEGIN
    CREATE TABLE Customers (
        CustomerID int IDENTITY(1,1) PRIMARY KEY,
        FullName nvarchar(100) NOT NULL,
        Email nvarchar(100) NOT NULL UNIQUE,
        PhoneNumber nvarchar(20),
        PasswordHash nvarchar(255) NOT NULL,
        Gender nvarchar(10),
        ProfileImage nvarchar(500),
        IsActive bit DEFAULT 1,
        CreatedAt datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE()
    );
    PRINT 'Customers table created successfully';
END
ELSE
BEGIN
    PRINT 'Customers table already exists';
END

-- Customer Addresses table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CustomerAddresses' AND xtype='U')
BEGIN
    CREATE TABLE CustomerAddresses (
        AddressID int IDENTITY(1,1) PRIMARY KEY,
        CustomerID int NOT NULL,
        Label nvarchar(50) NOT NULL,
        HouseNumber nvarchar(20),
        Street nvarchar(100) NOT NULL,
        Barangay nvarchar(100),
        City nvarchar(100) NOT NULL,
        Province nvarchar(100) NOT NULL,
        Region nvarchar(100),
        PostalCode nvarchar(20),
        Country nvarchar(100) DEFAULT 'Philippines',
        IsDefault bit DEFAULT 0,
        CreatedAt datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE(),
        FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID) ON DELETE CASCADE
    );
    PRINT 'CustomerAddresses table created successfully';
END
ELSE
BEGIN
    PRINT 'CustomerAddresses table already exists';
END

-- Products table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
BEGIN
    CREATE TABLE Products (
        ProductID int IDENTITY(1,1) PRIMARY KEY,
        Name nvarchar(200) NOT NULL,
        Description nvarchar(max),
        Price decimal(10,2) NOT NULL,
        StockQuantity int DEFAULT 0,
        Category nvarchar(100),
        ImageURL nvarchar(500),
        Dimensions nvarchar(max), -- JSON string for specifications
        IsFeatured bit DEFAULT 0,
        IsActive bit DEFAULT 1,
        DateAdded datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE()
    );
    PRINT 'Products table created successfully';
END
ELSE
BEGIN
    PRINT 'Products table already exists';
END

-- Orders table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U')
BEGIN
    CREATE TABLE Orders (
        OrderID int IDENTITY(1,1) PRIMARY KEY,
        CustomerID int NOT NULL,
        Status nvarchar(50) DEFAULT 'Pending',
        TotalAmount decimal(10,2) NOT NULL,
        PaymentMethod nvarchar(50),
        PaymentStatus nvarchar(50) DEFAULT 'Pending',
        Currency nvarchar(10) DEFAULT 'PHP',
        OrderDate datetime2 DEFAULT GETDATE(),
        PaymentDate datetime2,
        ShippingAddressID int,
        DeliveryType nvarchar(50) DEFAULT 'pickup',
        DeliveryCost decimal(10,2) DEFAULT 0,
        PickupDate datetime2,
        StripeSessionID nvarchar(255),
        CreatedAt datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE(),
        FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
        FOREIGN KEY (ShippingAddressID) REFERENCES CustomerAddresses(AddressID)
    );
    PRINT 'Orders table created successfully';
END
ELSE
BEGIN
    PRINT 'Orders table already exists';
END

-- Order Items table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OrderItems' AND xtype='U')
BEGIN
    CREATE TABLE OrderItems (
        OrderItemID int IDENTITY(1,1) PRIMARY KEY,
        OrderID int NOT NULL,
        ProductID int NOT NULL,
        Quantity int NOT NULL,
        PriceAtPurchase decimal(10,2) NOT NULL,
        CreatedAt datetime2 DEFAULT GETDATE(),
        FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
    );
    PRINT 'OrderItems table created successfully';
END
ELSE
BEGIN
    PRINT 'OrderItems table already exists';
END

-- Contact Submissions table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ContactSubmissions' AND xtype='U')
BEGIN
    CREATE TABLE ContactSubmissions (
        SubmissionID int IDENTITY(1,1) PRIMARY KEY,
        Name nvarchar(100) NOT NULL,
        Email nvarchar(100) NOT NULL,
        Message nvarchar(max) NOT NULL,
        Status nvarchar(20) DEFAULT 'New',
        SubmissionDate datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE()
    );
    PRINT 'ContactSubmissions table created successfully';
END
ELSE
BEGIN
    PRINT 'ContactSubmissions table already exists';
END

-- Reviews table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Reviews' AND xtype='U')
BEGIN
    CREATE TABLE Reviews (
        ReviewID int IDENTITY(1,1) PRIMARY KEY,
        ProductID int NOT NULL,
        CustomerID int NOT NULL,
        Rating int NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
        ReviewText nvarchar(max),
        IsApproved bit DEFAULT 0,
        CreatedAt datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE(),
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
        FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID) ON DELETE CASCADE
    );
    PRINT 'Reviews table created successfully';
END
ELSE
BEGIN
    PRINT 'Reviews table already exists';
END

-- Testimonials table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Testimonials' AND xtype='U')
BEGIN
    CREATE TABLE Testimonials (
        TestimonialID int IDENTITY(1,1) PRIMARY KEY,
        CustomerName nvarchar(100) NOT NULL,
        CustomerImage nvarchar(500),
        TestimonialText nvarchar(max) NOT NULL,
        Rating int CHECK (Rating >= 1 AND Rating <= 5),
        IsActive bit DEFAULT 1,
        DisplayOrder int DEFAULT 0,
        CreatedAt datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE()
    );
    PRINT 'Testimonials table created successfully';
END
ELSE
BEGIN
    PRINT 'Testimonials table already exists';
END

-- Hero Banner table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HeroBanner' AND xtype='U')
BEGIN
    CREATE TABLE HeroBanner (
        BannerID int IDENTITY(1,1) PRIMARY KEY,
        Title nvarchar(200),
        Subtitle nvarchar(500),
        BackgroundImage nvarchar(500),
        ButtonText nvarchar(100),
        ButtonLink nvarchar(500),
        SecondButtonText nvarchar(100),
        SecondButtonLink nvarchar(500),
        IsActive bit DEFAULT 1,
        DisplayOrder int DEFAULT 0,
        CreatedAt datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE()
    );
    PRINT 'HeroBanner table created successfully';
END
ELSE
BEGIN
    PRINT 'HeroBanner table already exists';
END

-- Gallery table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Gallery' AND xtype='U')
BEGIN
    CREATE TABLE Gallery (
        GalleryID int IDENTITY(1,1) PRIMARY KEY,
        Title nvarchar(200),
        Description nvarchar(500),
        ImageURL nvarchar(500) NOT NULL,
        Category nvarchar(100),
        IsActive bit DEFAULT 1,
        DisplayOrder int DEFAULT 0,
        CreatedAt datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE()
    );
    PRINT 'Gallery table created successfully';
END
ELSE
BEGIN
    PRINT 'Gallery table already exists';
END

-- Delivery Rates table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DeliveryRates' AND xtype='U')
BEGIN
    CREATE TABLE DeliveryRates (
        RateID int IDENTITY(1,1) PRIMARY KEY,
        ServiceType nvarchar(100) NOT NULL,
        Price decimal(10,2) NOT NULL,
        Description nvarchar(500),
        IsActive bit DEFAULT 1,
        CreatedAt datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE()
    );
    PRINT 'DeliveryRates table created successfully';
END
ELSE
BEGIN
    PRINT 'DeliveryRates table already exists';
END

-- Product Discounts table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProductDiscounts' AND xtype='U')
BEGIN
    CREATE TABLE ProductDiscounts (
        DiscountID int IDENTITY(1,1) PRIMARY KEY,
        ProductID int NOT NULL,
        DiscountType nvarchar(20) NOT NULL CHECK (DiscountType IN ('percentage', 'fixed')),
        DiscountValue decimal(10,2) NOT NULL,
        StartDate datetime2,
        EndDate datetime2,
        IsActive bit DEFAULT 1,
        CreatedAt datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE(),
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
    );
    PRINT 'ProductDiscounts table created successfully';
END
ELSE
BEGIN
    PRINT 'ProductDiscounts table already exists';
END

-- ===========================================
-- INSERT DEFAULT DATA
-- ===========================================

-- Insert default roles
IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Admin')
BEGIN
    INSERT INTO Roles (RoleName, Description) VALUES 
    ('Admin', 'Full system access'),
    ('TransactionManager', 'Manage transactions and orders'),
    ('InventoryManager', 'Manage products and inventory'),
    ('UserManager', 'Manage users and customers'),
    ('OrderSupport', 'Handle order support and customer service');
    PRINT 'Default roles inserted successfully';
END
ELSE
BEGIN
    PRINT 'Default roles already exist';
END

-- Insert default admin user (password: admin123)
IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (Username, PasswordHash, FullName, Email, RoleID) 
    VALUES ('admin', 'admin123', 'System Administrator', 'admin@designxcel.com', 1);
    PRINT 'Default admin user created successfully';
END
ELSE
BEGIN
    PRINT 'Default admin user already exists';
END

-- Insert sample delivery rates
IF NOT EXISTS (SELECT * FROM DeliveryRates)
BEGIN
    INSERT INTO DeliveryRates (ServiceType, Price, Description) VALUES
    ('Standard Delivery', 50.00, 'Standard delivery within 5-7 business days'),
    ('Express Delivery', 100.00, 'Express delivery within 2-3 business days'),
    ('Same Day Delivery', 200.00, 'Same day delivery within Metro Manila');
    PRINT 'Default delivery rates inserted successfully';
END
ELSE
BEGIN
    PRINT 'Delivery rates already exist';
END

-- Insert sample hero banner
IF NOT EXISTS (SELECT * FROM HeroBanner)
BEGIN
    INSERT INTO HeroBanner (Title, Subtitle, ButtonText, ButtonLink, IsActive) VALUES
    ('Welcome to DesignXcel', 'Discover modern furniture with 3D visualization', 'Shop Now', '/products', 1);
    PRINT 'Default hero banner inserted successfully';
END
ELSE
BEGIN
    PRINT 'Hero banner already exists';
END

-- ===========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ===========================================

-- Customers indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Email')
BEGIN
    CREATE INDEX IX_Customers_Email ON Customers(Email);
    PRINT 'Index IX_Customers_Email created successfully';
END

-- Products indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Category')
BEGIN
    CREATE INDEX IX_Products_Category ON Products(Category);
    PRINT 'Index IX_Products_Category created successfully';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_IsFeatured')
BEGIN
    CREATE INDEX IX_Products_IsFeatured ON Products(IsFeatured);
    PRINT 'Index IX_Products_IsFeatured created successfully';
END

-- Orders indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_CustomerID')
BEGIN
    CREATE INDEX IX_Orders_CustomerID ON Orders(CustomerID);
    PRINT 'Index IX_Orders_CustomerID created successfully';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_Status')
BEGIN
    CREATE INDEX IX_Orders_Status ON Orders(Status);
    PRINT 'Index IX_Orders_Status created successfully';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_OrderDate')
BEGIN
    CREATE INDEX IX_Orders_OrderDate ON Orders(OrderDate);
    PRINT 'Index IX_Orders_OrderDate created successfully';
END

-- CustomerAddresses indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CustomerAddresses_CustomerID')
BEGIN
    CREATE INDEX IX_CustomerAddresses_CustomerID ON CustomerAddresses(CustomerID);
    PRINT 'Index IX_CustomerAddresses_CustomerID created successfully';
END

-- Reviews indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Reviews_ProductID')
BEGIN
    CREATE INDEX IX_Reviews_ProductID ON Reviews(ProductID);
    PRINT 'Index IX_Reviews_ProductID created successfully';
END

-- ===========================================
-- CREATE STORED PROCEDURES
-- ===========================================

-- Procedure to get customer order history
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetCustomerOrderHistory')
BEGIN
    DROP PROCEDURE GetCustomerOrderHistory;
END
GO

CREATE PROCEDURE GetCustomerOrderHistory
    @CustomerID int
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        o.OrderID,
        o.Status,
        o.TotalAmount,
        o.PaymentMethod,
        o.OrderDate,
        o.DeliveryType,
        COUNT(oi.OrderItemID) as ItemCount
    FROM Orders o
    LEFT JOIN OrderItems oi ON o.OrderID = oi.OrderID
    WHERE o.CustomerID = @CustomerID
    GROUP BY o.OrderID, o.Status, o.TotalAmount, o.PaymentMethod, o.OrderDate, o.DeliveryType
    ORDER BY o.OrderDate DESC;
END
GO

PRINT 'Stored procedure GetCustomerOrderHistory created successfully';

-- Procedure to get product statistics
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetProductStatistics')
BEGIN
    DROP PROCEDURE GetProductStatistics;
END
GO

CREATE PROCEDURE GetProductStatistics
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.ProductID,
        p.Name,
        p.Price,
        p.StockQuantity,
        ISNULL(SUM(oi.Quantity), 0) as TotalSold,
        ISNULL(AVG(CAST(r.Rating as FLOAT)), 0) as AverageRating,
        COUNT(r.ReviewID) as ReviewCount
    FROM Products p
    LEFT JOIN OrderItems oi ON p.ProductID = oi.ProductID
    LEFT JOIN Reviews r ON p.ProductID = r.ProductID AND r.IsApproved = 1
    WHERE p.IsActive = 1
    GROUP BY p.ProductID, p.Name, p.Price, p.StockQuantity
    ORDER BY TotalSold DESC;
END
GO

PRINT 'Stored procedure GetProductStatistics created successfully';

-- ===========================================
-- CREATE VIEWS
-- ===========================================

-- View for order summary
IF EXISTS (SELECT * FROM sys.views WHERE name = 'OrderSummaryView')
BEGIN
    DROP VIEW OrderSummaryView;
END
GO

CREATE VIEW OrderSummaryView AS
SELECT 
    o.OrderID,
    c.FullName as CustomerName,
    c.Email as CustomerEmail,
    o.Status,
    o.TotalAmount,
    o.PaymentMethod,
    o.PaymentStatus,
    o.OrderDate,
    o.DeliveryType,
    COUNT(oi.OrderItemID) as ItemCount,
    STRING_AGG(p.Name, ', ') as ProductNames
FROM Orders o
INNER JOIN Customers c ON o.CustomerID = c.CustomerID
LEFT JOIN OrderItems oi ON o.OrderID = oi.OrderID
LEFT JOIN Products p ON oi.ProductID = p.ProductID
GROUP BY o.OrderID, c.FullName, c.Email, o.Status, o.TotalAmount, 
         o.PaymentMethod, o.PaymentStatus, o.OrderDate, o.DeliveryType;
GO

PRINT 'View OrderSummaryView created successfully';

-- ===========================================
-- FINAL VERIFICATION
-- ===========================================

PRINT '===========================================';
PRINT 'AZURE SQL DATABASE MIGRATION COMPLETED';
PRINT '===========================================';

-- Count tables created
SELECT 
    'Tables Created' as Category,
    COUNT(*) as Count
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
    AND TABLE_NAME IN ('Users', 'Roles', 'Customers', 'CustomerAddresses', 
                       'Products', 'Orders', 'OrderItems', 'ContactSubmissions',
                       'Reviews', 'Testimonials', 'HeroBanner', 'Gallery',
                       'DeliveryRates', 'ProductDiscounts');

-- Count indexes created
SELECT 
    'Indexes Created' as Category,
    COUNT(*) as Count
FROM sys.indexes 
WHERE name LIKE 'IX_%';

-- Count stored procedures created
SELECT 
    'Stored Procedures Created' as Category,
    COUNT(*) as Count
FROM sys.objects 
WHERE type = 'P' 
    AND name IN ('GetCustomerOrderHistory', 'GetProductStatistics');

-- Count views created
SELECT 
    'Views Created' as Category,
    COUNT(*) as Count
FROM sys.views 
WHERE name IN ('OrderSummaryView');

PRINT 'Migration script completed successfully!';
PRINT 'You can now deploy your DesignXcel application to Azure.';
