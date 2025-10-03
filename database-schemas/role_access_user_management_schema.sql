-- Complete Role Access and User Management System
-- SQL Server Database Schema
-- Run this SQL script to create the necessary tables for role-based access control

-- =============================================================================
-- ROLES TABLE
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Roles' AND xtype='U')
BEGIN
    CREATE TABLE Roles (
        RoleID INT IDENTITY(1,1) PRIMARY KEY,
        RoleName NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(255),
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1
    );

    -- Insert default roles
    INSERT INTO Roles (RoleName, Description) VALUES 
    ('Admin', 'Full system access and management capabilities'),
    ('TransactionManager', 'Manage transactions, payments, and financial operations'),
    ('InventoryManager', 'Manage inventory, products, and stock operations'),
    ('UserManager', 'Manage user accounts, permissions, and customer relations'),
    ('OrderSupport', 'Handle customer orders, support, and order processing'),
    ('Employee', 'Basic employee access with limited permissions'),
    ('Customer', 'Customer access for shopping and account management');

    PRINT 'Roles table created successfully with default roles.';
END
ELSE
BEGIN
    PRINT 'Roles table already exists.';
END

-- =============================================================================
-- USERS TABLE (For employees/admins)
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
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

    -- Create default admin user (password: admin123 - should be changed)
    DECLARE @AdminRoleID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'Admin');
    INSERT INTO Users (Username, FullName, Email, PasswordHash, RoleID) VALUES 
    ('admin', 'System Administrator', 'admin@designxcel.com', '$2b$10$rQXZv6p5YlY1sZ8CKNxE4uUXGq6kJ9K5R7Oz2X3m1Q4W8F0V2yX6K', @AdminRoleID);

    PRINT 'Users table created successfully with default admin user.';
END
ELSE
BEGIN
    PRINT 'Users table already exists.';
END

-- =============================================================================
-- CUSTOMERS TABLE (For customer users)
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Customers' AND xtype='U')
BEGIN
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

    PRINT 'Customers table created successfully.';
END
ELSE
BEGIN
    PRINT 'Customers table already exists.';
END

-- =============================================================================
-- USER PERMISSIONS TABLE (For granular permissions)
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserPermissions' AND xtype='U')
BEGIN
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

    PRINT 'UserPermissions table created successfully.';
END
ELSE
BEGIN
    PRINT 'UserPermissions table already exists.';
END

-- =============================================================================
-- ROLE PERMISSIONS TABLE (Default permissions for each role)
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RolePermissions' AND xtype='U')
BEGIN
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

    -- Insert default role permissions
    DECLARE @AdminID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'Admin');
    DECLARE @TransactionManagerID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'TransactionManager');
    DECLARE @InventoryManagerID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'InventoryManager');
    DECLARE @UserManagerID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'UserManager');
    DECLARE @OrderSupportID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'OrderSupport');
    DECLARE @EmployeeID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'Employee');
    DECLARE @CustomerID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'Customer');

    -- Admin permissions (full access to everything)
    INSERT INTO RolePermissions (RoleID, Section, CanAccess, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
    (@AdminID, 'dashboard', 1, 1, 1, 1, 1),
    (@AdminID, 'users', 1, 1, 1, 1, 1),
    (@AdminID, 'customers', 1, 1, 1, 1, 1),
    (@AdminID, 'products', 1, 1, 1, 1, 1),
    (@AdminID, 'inventory', 1, 1, 1, 1, 1),
    (@AdminID, 'orders', 1, 1, 1, 1, 1),
    (@AdminID, 'transactions', 1, 1, 1, 1, 1),
    (@AdminID, 'reports', 1, 1, 1, 1, 1),
    (@AdminID, 'settings', 1, 1, 1, 1, 1),
    (@AdminID, 'cms', 1, 1, 1, 1, 1),
    (@AdminID, 'support', 1, 1, 1, 1, 1);

    -- Transaction Manager permissions
    INSERT INTO RolePermissions (RoleID, Section, CanAccess, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
    (@TransactionManagerID, 'dashboard', 1, 0, 1, 0, 0),
    (@TransactionManagerID, 'transactions', 1, 1, 1, 1, 0),
    (@TransactionManagerID, 'orders', 1, 0, 1, 1, 0),
    (@TransactionManagerID, 'reports', 1, 0, 1, 0, 0);

    -- Inventory Manager permissions
    INSERT INTO RolePermissions (RoleID, Section, CanAccess, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
    (@InventoryManagerID, 'dashboard', 1, 0, 1, 0, 0),
    (@InventoryManagerID, 'products', 1, 1, 1, 1, 1),
    (@InventoryManagerID, 'inventory', 1, 1, 1, 1, 0),
    (@InventoryManagerID, 'orders', 1, 0, 1, 1, 0),
    (@InventoryManagerID, 'reports', 1, 0, 1, 0, 0);

    -- User Manager permissions
    INSERT INTO RolePermissions (RoleID, Section, CanAccess, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
    (@UserManagerID, 'dashboard', 1, 0, 1, 0, 0),
    (@UserManagerID, 'customers', 1, 1, 1, 1, 0),
    (@UserManagerID, 'support', 1, 1, 1, 1, 0),
    (@UserManagerID, 'reports', 1, 0, 1, 0, 0);

    -- Order Support permissions
    INSERT INTO RolePermissions (RoleID, Section, CanAccess, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
    (@OrderSupportID, 'dashboard', 1, 0, 1, 0, 0),
    (@OrderSupportID, 'orders', 1, 1, 1, 1, 0),
    (@OrderSupportID, 'customers', 1, 0, 1, 1, 0),
    (@OrderSupportID, 'support', 1, 1, 1, 1, 0),
    (@OrderSupportID, 'products', 1, 0, 1, 0, 0);

    -- Employee permissions (basic access)
    INSERT INTO RolePermissions (RoleID, Section, CanAccess, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
    (@EmployeeID, 'dashboard', 1, 0, 1, 0, 0),
    (@EmployeeID, 'products', 1, 0, 1, 0, 0);

    -- Customer permissions
    INSERT INTO RolePermissions (RoleID, Section, CanAccess, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
    (@CustomerID, 'profile', 1, 0, 1, 1, 0),
    (@CustomerID, 'orders', 1, 1, 1, 0, 0),
    (@CustomerID, 'products', 1, 0, 1, 0, 0),
    (@CustomerID, 'cart', 1, 1, 1, 1, 1);

    PRINT 'RolePermissions table created successfully with default permissions.';
END
ELSE
BEGIN
    PRINT 'RolePermissions table already exists.';
END

-- =============================================================================
-- SESSION TOKENS TABLE (For API token management)
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SessionTokens' AND xtype='U')
BEGIN
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

    PRINT 'SessionTokens table created successfully.';
END
ELSE
BEGIN
    PRINT 'SessionTokens table already exists.';
END

-- =============================================================================
-- AUDIT LOG TABLE (For tracking user actions)
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuditLog' AND xtype='U')
BEGIN
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

    PRINT 'AuditLog table created successfully.';
END
ELSE
BEGIN
    PRINT 'AuditLog table already exists.';
END

-- =============================================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================================================

-- Users table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email')
    CREATE INDEX IX_Users_Email ON Users(Email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_RoleID')
    CREATE INDEX IX_Users_RoleID ON Users(RoleID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_IsActive')
    CREATE INDEX IX_Users_IsActive ON Users(IsActive);

-- Customers table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Email')
    CREATE INDEX IX_Customers_Email ON Customers(Email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_IsActive')
    CREATE INDEX IX_Customers_IsActive ON Customers(IsActive);

-- UserPermissions table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserPermissions_UserID')
    CREATE INDEX IX_UserPermissions_UserID ON UserPermissions(UserID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserPermissions_Section')
    CREATE INDEX IX_UserPermissions_Section ON UserPermissions(Section);

-- RolePermissions table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolePermissions_RoleID')
    CREATE INDEX IX_RolePermissions_RoleID ON RolePermissions(RoleID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolePermissions_Section')
    CREATE INDEX IX_RolePermissions_Section ON RolePermissions(Section);

-- SessionTokens table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionTokens_TokenHash')
    CREATE INDEX IX_SessionTokens_TokenHash ON SessionTokens(TokenHash);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionTokens_UserID')
    CREATE INDEX IX_SessionTokens_UserID ON SessionTokens(UserID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionTokens_CustomerID')
    CREATE INDEX IX_SessionTokens_CustomerID ON SessionTokens(CustomerID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionTokens_ExpiresAt')
    CREATE INDEX IX_SessionTokens_ExpiresAt ON SessionTokens(ExpiresAt);

-- AuditLog table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AuditLog_UserID')
    CREATE INDEX IX_AuditLog_UserID ON AuditLog(UserID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AuditLog_CustomerID')
    CREATE INDEX IX_AuditLog_CustomerID ON AuditLog(CustomerID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AuditLog_CreatedAt')
    CREATE INDEX IX_AuditLog_CreatedAt ON AuditLog(CreatedAt);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AuditLog_Section')
    CREATE INDEX IX_AuditLog_Section ON AuditLog(Section);

PRINT 'All indexes created successfully.';

-- =============================================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- =============================================================================

-- Procedure to get user with role and permissions
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetUserWithPermissions')
    DROP PROCEDURE GetUserWithPermissions;
GO

CREATE PROCEDURE GetUserWithPermissions
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.UserID,
        u.Username,
        u.FullName,
        u.Email,
        u.PasswordHash,
        u.IsActive,
        u.ProfileImage,
        u.PhoneNumber,
        u.Department,
        u.LastLogin,
        r.RoleID,
        r.RoleName,
        r.Description as RoleDescription
    FROM Users u
    INNER JOIN Roles r ON u.RoleID = r.RoleID
    WHERE u.Email = @Email AND u.IsActive = 1;
    
    -- Get user permissions (both role-based and user-specific)
    SELECT DISTINCT
        p.Section,
        CASE WHEN up.CanAccess IS NOT NULL THEN up.CanAccess ELSE rp.CanAccess END as CanAccess,
        CASE WHEN up.CanCreate IS NOT NULL THEN up.CanCreate ELSE rp.CanCreate END as CanCreate,
        CASE WHEN up.CanRead IS NOT NULL THEN up.CanRead ELSE rp.CanRead END as CanRead,
        CASE WHEN up.CanUpdate IS NOT NULL THEN up.CanUpdate ELSE rp.CanUpdate END as CanUpdate,
        CASE WHEN up.CanDelete IS NOT NULL THEN up.CanDelete ELSE rp.CanDelete END as CanDelete
    FROM (
        SELECT DISTINCT Section FROM RolePermissions
        UNION
        SELECT DISTINCT Section FROM UserPermissions WHERE UserID = (SELECT UserID FROM Users WHERE Email = @Email)
    ) p
    LEFT JOIN Users u ON u.Email = @Email
    LEFT JOIN RolePermissions rp ON rp.RoleID = u.RoleID AND rp.Section = p.Section
    LEFT JOIN UserPermissions up ON up.UserID = u.UserID AND up.Section = p.Section
    WHERE (rp.RoleID IS NOT NULL OR up.UserID IS NOT NULL);
END
GO

-- Procedure to get customer
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetCustomer')
    DROP PROCEDURE GetCustomer;
GO

CREATE PROCEDURE GetCustomer
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CustomerID,
        FullName,
        Email,
        PhoneNumber,
        PasswordHash,
        ProfileImage,
        DateOfBirth,
        Gender,
        IsActive,
        IsEmailVerified,
        LastLogin,
        CreatedAt
    FROM Customers
    WHERE Email = @Email AND IsActive = 1;
END
GO

PRINT 'Stored procedures created successfully.';

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================
PRINT '';
PRINT '=============================================================================';
PRINT 'ROLE ACCESS AND USER MANAGEMENT SYSTEM SCHEMA DEPLOYMENT COMPLETE';
PRINT '=============================================================================';
PRINT '';
PRINT 'Tables Created/Verified:';
PRINT '  ✓ Roles (with default roles)';
PRINT '  ✓ Users (with default admin user)';
PRINT '  ✓ Customers';
PRINT '  ✓ UserPermissions';
PRINT '  ✓ RolePermissions (with default permissions)';
PRINT '  ✓ SessionTokens';
PRINT '  ✓ AuditLog';
PRINT '';
PRINT 'Indexes Created:';
PRINT '  ✓ Performance indexes on all key columns';
PRINT '';
PRINT 'Stored Procedures Created:';
PRINT '  ✓ GetUserWithPermissions';
PRINT '  ✓ GetCustomer';
PRINT '';
PRINT 'Default Admin User Created:';
PRINT '  Username: admin';
PRINT '  Email: admin@designxcel.com';
PRINT '  Password: admin123 (CHANGE THIS IMMEDIATELY)';
PRINT '';
PRINT 'Next Steps:';
PRINT '  1. Change the default admin password';
PRINT '  2. Create additional users as needed';
PRINT '  3. Configure application middleware to use this system';
PRINT '  4. Test role-based access control';
PRINT '';
PRINT '=============================================================================';
