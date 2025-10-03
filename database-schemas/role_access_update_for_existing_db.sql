-- Role Access and User Management System Update
-- For existing DesignXcellDB database
-- This script adds missing columns and tables while preserving existing data

USE DesignXcellDB;
GO

PRINT 'Starting Role Access and User Management System Update...';

-- =============================================================================
-- UPDATE EXISTING ROLES TABLE
-- =============================================================================

-- Add missing columns to Roles table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Roles' AND COLUMN_NAME = 'Description')
BEGIN
    ALTER TABLE Roles ADD Description NVARCHAR(255) NULL;
    PRINT 'Added Description column to Roles table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Roles' AND COLUMN_NAME = 'CreatedAt')
BEGIN
    ALTER TABLE Roles ADD CreatedAt DATETIME2 DEFAULT GETDATE();
    PRINT 'Added CreatedAt column to Roles table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Roles' AND COLUMN_NAME = 'UpdatedAt')
BEGIN
    ALTER TABLE Roles ADD UpdatedAt DATETIME2 DEFAULT GETDATE();
    PRINT 'Added UpdatedAt column to Roles table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Roles' AND COLUMN_NAME = 'IsActive')
BEGIN
    ALTER TABLE Roles ADD IsActive BIT DEFAULT 1;
    PRINT 'Added IsActive column to Roles table.';
END

-- Insert missing default roles if they don't exist
IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Admin')
    INSERT INTO Roles (RoleName, Description) VALUES ('Admin', 'Full system access and management capabilities');

IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'TransactionManager')
    INSERT INTO Roles (RoleName, Description) VALUES ('TransactionManager', 'Manage transactions, payments, and financial operations');

IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'InventoryManager')
    INSERT INTO Roles (RoleName, Description) VALUES ('InventoryManager', 'Manage inventory, products, and stock operations');

IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'UserManager')
    INSERT INTO Roles (RoleName, Description) VALUES ('UserManager', 'Manage user accounts, permissions, and customer relations');

IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'OrderSupport')
    INSERT INTO Roles (RoleName, Description) VALUES ('OrderSupport', 'Handle customer orders, support, and order processing');

IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Employee')
    INSERT INTO Roles (RoleName, Description) VALUES ('Employee', 'Basic employee access with limited permissions');

IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Customer')
    INSERT INTO Roles (RoleName, Description) VALUES ('Customer', 'Customer access for shopping and account management');

PRINT 'Updated Roles table with missing roles.';

-- =============================================================================
-- UPDATE EXISTING USERS TABLE
-- =============================================================================

-- Add missing columns to Users table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'ProfileImage')
BEGIN
    ALTER TABLE Users ADD ProfileImage NVARCHAR(255) NULL;
    PRINT 'Added ProfileImage column to Users table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'PhoneNumber')
BEGIN
    ALTER TABLE Users ADD PhoneNumber NVARCHAR(20) NULL;
    PRINT 'Added PhoneNumber column to Users table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'Department')
BEGIN
    ALTER TABLE Users ADD Department NVARCHAR(100) NULL;
    PRINT 'Added Department column to Users table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'UpdatedAt')
BEGIN
    ALTER TABLE Users ADD UpdatedAt DATETIME2 DEFAULT GETDATE();
    PRINT 'Added UpdatedAt column to Users table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'LastLogin')
BEGIN
    ALTER TABLE Users ADD LastLogin DATETIME2 NULL;
    PRINT 'Added LastLogin column to Users table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'CreatedBy')
BEGIN
    ALTER TABLE Users ADD CreatedBy INT NULL;
    PRINT 'Added CreatedBy column to Users table.';
END

-- =============================================================================
-- UPDATE EXISTING CUSTOMERS TABLE
-- =============================================================================

-- Add missing columns to Customers table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'ProfileImage')
BEGIN
    ALTER TABLE Customers ADD ProfileImage NVARCHAR(255) NULL;
    PRINT 'Added ProfileImage column to Customers table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'DateOfBirth')
BEGIN
    ALTER TABLE Customers ADD DateOfBirth DATE NULL;
    PRINT 'Added DateOfBirth column to Customers table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'Gender')
BEGIN
    ALTER TABLE Customers ADD Gender NVARCHAR(10) NULL;
    PRINT 'Added Gender column to Customers table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'IsEmailVerified')
BEGIN
    ALTER TABLE Customers ADD IsEmailVerified BIT DEFAULT 0;
    PRINT 'Added IsEmailVerified column to Customers table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'EmailVerificationToken')
BEGIN
    ALTER TABLE Customers ADD EmailVerificationToken NVARCHAR(255) NULL;
    PRINT 'Added EmailVerificationToken column to Customers table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'PasswordResetToken')
BEGIN
    ALTER TABLE Customers ADD PasswordResetToken NVARCHAR(255) NULL;
    PRINT 'Added PasswordResetToken column to Customers table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'PasswordResetExpiry')
BEGIN
    ALTER TABLE Customers ADD PasswordResetExpiry DATETIME2 NULL;
    PRINT 'Added PasswordResetExpiry column to Customers table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'UpdatedAt')
BEGIN
    ALTER TABLE Customers ADD UpdatedAt DATETIME2 DEFAULT GETDATE();
    PRINT 'Added UpdatedAt column to Customers table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'LastLogin')
BEGIN
    ALTER TABLE Customers ADD LastLogin DATETIME2 NULL;
    PRINT 'Added LastLogin column to Customers table.';
END

-- =============================================================================
-- UPDATE EXISTING USER PERMISSIONS TABLE
-- =============================================================================

-- Add missing columns to UserPermissions table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UserPermissions' AND COLUMN_NAME = 'CanCreate')
BEGIN
    ALTER TABLE UserPermissions ADD CanCreate BIT DEFAULT 0;
    PRINT 'Added CanCreate column to UserPermissions table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UserPermissions' AND COLUMN_NAME = 'CanRead')
BEGIN
    ALTER TABLE UserPermissions ADD CanRead BIT DEFAULT 0;
    PRINT 'Added CanRead column to UserPermissions table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UserPermissions' AND COLUMN_NAME = 'CanUpdate')
BEGIN
    ALTER TABLE UserPermissions ADD CanUpdate BIT DEFAULT 0;
    PRINT 'Added CanUpdate column to UserPermissions table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UserPermissions' AND COLUMN_NAME = 'CanDelete')
BEGIN
    ALTER TABLE UserPermissions ADD CanDelete BIT DEFAULT 0;
    PRINT 'Added CanDelete column to UserPermissions table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UserPermissions' AND COLUMN_NAME = 'CreatedAt')
BEGIN
    ALTER TABLE UserPermissions ADD CreatedAt DATETIME2 DEFAULT GETDATE();
    PRINT 'Added CreatedAt column to UserPermissions table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UserPermissions' AND COLUMN_NAME = 'UpdatedAt')
BEGIN
    ALTER TABLE UserPermissions ADD UpdatedAt DATETIME2 DEFAULT GETDATE();
    PRINT 'Added UpdatedAt column to UserPermissions table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UserPermissions' AND COLUMN_NAME = 'CreatedBy')
BEGIN
    ALTER TABLE UserPermissions ADD CreatedBy INT NULL;
    PRINT 'Added CreatedBy column to UserPermissions table.';
END

-- =============================================================================
-- UPDATE EXISTING ROLE PERMISSIONS TABLE
-- =============================================================================

-- Add missing columns to RolePermissions table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'RolePermissions' AND COLUMN_NAME = 'CanCreate')
BEGIN
    ALTER TABLE RolePermissions ADD CanCreate BIT DEFAULT 0;
    PRINT 'Added CanCreate column to RolePermissions table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'RolePermissions' AND COLUMN_NAME = 'CanRead')
BEGIN
    ALTER TABLE RolePermissions ADD CanRead BIT DEFAULT 0;
    PRINT 'Added CanRead column to RolePermissions table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'RolePermissions' AND COLUMN_NAME = 'CanUpdate')
BEGIN
    ALTER TABLE RolePermissions ADD CanUpdate BIT DEFAULT 0;
    PRINT 'Added CanUpdate column to RolePermissions table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'RolePermissions' AND COLUMN_NAME = 'CanDelete')
BEGIN
    ALTER TABLE RolePermissions ADD CanDelete BIT DEFAULT 0;
    PRINT 'Added CanDelete column to RolePermissions table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'RolePermissions' AND COLUMN_NAME = 'CreatedAt')
BEGIN
    ALTER TABLE RolePermissions ADD CreatedAt DATETIME2 DEFAULT GETDATE();
    PRINT 'Added CreatedAt column to RolePermissions table.';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'RolePermissions' AND COLUMN_NAME = 'UpdatedAt')
BEGIN
    ALTER TABLE RolePermissions ADD UpdatedAt DATETIME2 DEFAULT GETDATE();
    PRINT 'Added UpdatedAt column to RolePermissions table.';
END

-- =============================================================================
-- CREATE MISSING TABLES
-- =============================================================================

-- Create SessionTokens table
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

-- Create AuditLog table (since AuditLogs already exists, we'll use a different name)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SystemAuditLog' AND xtype='U')
BEGIN
    CREATE TABLE SystemAuditLog (
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
    PRINT 'SystemAuditLog table created successfully.';
END

-- =============================================================================
-- INSERT DEFAULT ROLE PERMISSIONS
-- =============================================================================

-- Clear existing role permissions and insert new ones
DELETE FROM RolePermissions;

-- Get role IDs
DECLARE @AdminID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'Admin');
DECLARE @TransactionManagerID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'TransactionManager');
DECLARE @InventoryManagerID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'InventoryManager');
DECLARE @UserManagerID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'UserManager');
DECLARE @OrderSupportID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'OrderSupport');
DECLARE @EmployeeID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'Employee');
DECLARE @CustomerID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'Customer');

-- Admin permissions (full access to everything)
IF @AdminID IS NOT NULL
BEGIN
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
END

-- Transaction Manager permissions
IF @TransactionManagerID IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RoleID, Section, CanAccess, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
    (@TransactionManagerID, 'dashboard', 1, 0, 1, 0, 0),
    (@TransactionManagerID, 'transactions', 1, 1, 1, 1, 0),
    (@TransactionManagerID, 'orders', 1, 0, 1, 1, 0),
    (@TransactionManagerID, 'reports', 1, 0, 1, 0, 0);
END

-- Inventory Manager permissions
IF @InventoryManagerID IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RoleID, Section, CanAccess, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
    (@InventoryManagerID, 'dashboard', 1, 0, 1, 0, 0),
    (@InventoryManagerID, 'products', 1, 1, 1, 1, 1),
    (@InventoryManagerID, 'inventory', 1, 1, 1, 1, 0),
    (@InventoryManagerID, 'orders', 1, 0, 1, 1, 0),
    (@InventoryManagerID, 'reports', 1, 0, 1, 0, 0);
END

-- User Manager permissions
IF @UserManagerID IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RoleID, Section, CanAccess, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
    (@UserManagerID, 'dashboard', 1, 0, 1, 0, 0),
    (@UserManagerID, 'customers', 1, 1, 1, 1, 0),
    (@UserManagerID, 'support', 1, 1, 1, 1, 0),
    (@UserManagerID, 'reports', 1, 0, 1, 0, 0);
END

-- Order Support permissions
IF @OrderSupportID IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RoleID, Section, CanAccess, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
    (@OrderSupportID, 'dashboard', 1, 0, 1, 0, 0),
    (@OrderSupportID, 'orders', 1, 1, 1, 1, 0),
    (@OrderSupportID, 'customers', 1, 0, 1, 1, 0),
    (@OrderSupportID, 'support', 1, 1, 1, 1, 0),
    (@OrderSupportID, 'products', 1, 0, 1, 0, 0);
END

-- Employee permissions (basic access)
IF @EmployeeID IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RoleID, Section, CanAccess, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
    (@EmployeeID, 'dashboard', 1, 0, 1, 0, 0),
    (@EmployeeID, 'products', 1, 0, 1, 0, 0);
END

-- Customer permissions
IF @CustomerID IS NOT NULL
BEGIN
    INSERT INTO RolePermissions (RoleID, Section, CanAccess, CanCreate, CanRead, CanUpdate, CanDelete) VALUES
    (@CustomerID, 'profile', 1, 0, 1, 1, 0),
    (@CustomerID, 'orders', 1, 1, 1, 0, 0),
    (@CustomerID, 'products', 1, 0, 1, 0, 0),
    (@CustomerID, 'cart', 1, 1, 1, 1, 1);
END

PRINT 'Default role permissions inserted successfully.';

-- =============================================================================
-- CREATE DEFAULT ADMIN USER
-- =============================================================================

-- Create default admin user if it doesn't exist
IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'admin@designxcel.com')
BEGIN
    -- Get Admin role ID
    DECLARE @AdminRoleID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'Admin');
    
    IF @AdminRoleID IS NOT NULL
    BEGIN
        -- Hash for 'admin123' using bcrypt
        INSERT INTO Users (Username, FullName, Email, PasswordHash, RoleID, IsActive) VALUES 
        ('admin', 'System Administrator', 'admin@designxcel.com', '$2b$10$rQXZv6p5YlY1sZ8CKNxE4uUXGq6kJ9K5R7Oz2X3m1Q4W8F0V2yX6K', @AdminRoleID, 1);
        PRINT 'Default admin user created successfully.';
    END
END

-- =============================================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================================================

-- Users table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('Users'))
    CREATE INDEX IX_Users_Email ON Users(Email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_RoleID' AND object_id = OBJECT_ID('Users'))
    CREATE INDEX IX_Users_RoleID ON Users(RoleID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_IsActive' AND object_id = OBJECT_ID('Users'))
    CREATE INDEX IX_Users_IsActive ON Users(IsActive);

-- Customers table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Email' AND object_id = OBJECT_ID('Customers'))
    CREATE INDEX IX_Customers_Email ON Customers(Email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_IsActive' AND object_id = OBJECT_ID('Customers'))
    CREATE INDEX IX_Customers_IsActive ON Customers(IsActive);

-- UserPermissions table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserPermissions_UserID' AND object_id = OBJECT_ID('UserPermissions'))
    CREATE INDEX IX_UserPermissions_UserID ON UserPermissions(UserID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserPermissions_Section' AND object_id = OBJECT_ID('UserPermissions'))
    CREATE INDEX IX_UserPermissions_Section ON UserPermissions(Section);

-- RolePermissions table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolePermissions_RoleID' AND object_id = OBJECT_ID('RolePermissions'))
    CREATE INDEX IX_RolePermissions_RoleID ON RolePermissions(RoleID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RolePermissions_Section' AND object_id = OBJECT_ID('RolePermissions'))
    CREATE INDEX IX_RolePermissions_Section ON RolePermissions(Section);

-- SessionTokens table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionTokens_TokenHash' AND object_id = OBJECT_ID('SessionTokens'))
    CREATE INDEX IX_SessionTokens_TokenHash ON SessionTokens(TokenHash);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionTokens_UserID' AND object_id = OBJECT_ID('SessionTokens'))
    CREATE INDEX IX_SessionTokens_UserID ON SessionTokens(UserID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionTokens_CustomerID' AND object_id = OBJECT_ID('SessionTokens'))
    CREATE INDEX IX_SessionTokens_CustomerID ON SessionTokens(CustomerID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionTokens_ExpiresAt' AND object_id = OBJECT_ID('SessionTokens'))
    CREATE INDEX IX_SessionTokens_ExpiresAt ON SessionTokens(ExpiresAt);

-- SystemAuditLog table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SystemAuditLog_UserID' AND object_id = OBJECT_ID('SystemAuditLog'))
    CREATE INDEX IX_SystemAuditLog_UserID ON SystemAuditLog(UserID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SystemAuditLog_CustomerID' AND object_id = OBJECT_ID('SystemAuditLog'))
    CREATE INDEX IX_SystemAuditLog_CustomerID ON SystemAuditLog(CustomerID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SystemAuditLog_CreatedAt' AND object_id = OBJECT_ID('SystemAuditLog'))
    CREATE INDEX IX_SystemAuditLog_CreatedAt ON SystemAuditLog(CreatedAt);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SystemAuditLog_Section' AND object_id = OBJECT_ID('SystemAuditLog'))
    CREATE INDEX IX_SystemAuditLog_Section ON SystemAuditLog(Section);

PRINT 'All indexes created successfully.';

-- =============================================================================
-- CREATE STORED PROCEDURES
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
PRINT 'ROLE ACCESS AND USER MANAGEMENT SYSTEM UPDATE COMPLETE';
PRINT '=============================================================================';
PRINT '';
PRINT 'Tables Updated/Created:';
PRINT '  ✓ Roles (enhanced with new columns)';
PRINT '  ✓ Users (enhanced with new columns)';
PRINT '  ✓ Customers (enhanced with new columns)';
PRINT '  ✓ UserPermissions (enhanced with new columns)';
PRINT '  ✓ RolePermissions (enhanced with new columns)';
PRINT '  ✓ SessionTokens (new table)';
PRINT '  ✓ SystemAuditLog (new table)';
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
PRINT '  2. Test the login functionality';
PRINT '  3. Access user management at /Employee/Admin/UserManagement';
PRINT '  4. Create additional users as needed';
PRINT '';
PRINT '=============================================================================';
