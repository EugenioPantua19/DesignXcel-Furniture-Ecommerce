-- Minimal Role Access System Update
-- For existing DesignXcellDB database
-- This script adds only the essential missing pieces

USE DesignXcellDB;
GO

PRINT 'Starting minimal role access system update...';

-- =============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================================================

-- Add missing columns to Users table for enhanced functionality
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'ProfileImage')
    ALTER TABLE Users ADD ProfileImage NVARCHAR(255) NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'PhoneNumber')
    ALTER TABLE Users ADD PhoneNumber NVARCHAR(20) NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'Department')
    ALTER TABLE Users ADD Department NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'UpdatedAt')
    ALTER TABLE Users ADD UpdatedAt DATETIME2 DEFAULT GETDATE();

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'LastLogin')
    ALTER TABLE Users ADD LastLogin DATETIME2 NULL;

-- Add missing columns to Customers table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'UpdatedAt')
    ALTER TABLE Customers ADD UpdatedAt DATETIME2 DEFAULT GETDATE();

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'LastLogin')
    ALTER TABLE Customers ADD LastLogin DATETIME2 NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'IsEmailVerified')
    ALTER TABLE Customers ADD IsEmailVerified BIT DEFAULT 0;

-- =============================================================================
-- CREATE MISSING TABLES
-- =============================================================================

-- Create SessionTokens table for API authentication
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

-- =============================================================================
-- ENSURE DEFAULT ADMIN USER EXISTS
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
    ELSE
    BEGIN
        PRINT 'Admin role not found - cannot create default admin user.';
    END
END
ELSE
BEGIN
    PRINT 'Admin user already exists.';
END

-- =============================================================================
-- ASSIGN BASIC PERMISSIONS TO ADMIN ROLE
-- =============================================================================

-- Ensure Admin role has all permissions
DECLARE @AdminRoleID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'Admin');

IF @AdminRoleID IS NOT NULL
BEGIN
    -- Clear existing admin permissions
    DELETE FROM RolePermissions WHERE RoleID = @AdminRoleID;
    
    -- Grant all permissions to Admin
    INSERT INTO RolePermissions (RoleID, PermissionID, GrantedBy, GrantedAt, IsActive)
    SELECT @AdminRoleID, PermissionID, 1, GETDATE(), 1
    FROM Permissions
    WHERE IsActive = 1;
    
    PRINT 'Admin role granted all permissions.';
END

-- =============================================================================
-- CREATE SIMPLIFIED STORED PROCEDURES
-- =============================================================================

-- Simple procedure to get user with role information
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetUserWithRole')
    DROP PROCEDURE GetUserWithRole;
GO

CREATE PROCEDURE GetUserWithRole
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
        ISNULL(u.ProfileImage, '') as ProfileImage,
        ISNULL(u.PhoneNumber, '') as PhoneNumber,
        ISNULL(u.Department, '') as Department,
        u.LastLogin,
        r.RoleID,
        r.RoleName
    FROM Users u
    INNER JOIN Roles r ON u.RoleID = r.RoleID
    WHERE u.Email = @Email AND u.IsActive = 1;
END
GO

-- Simple procedure to get customer
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetCustomerSimple')
    DROP PROCEDURE GetCustomerSimple;
GO

CREATE PROCEDURE GetCustomerSimple
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CustomerID,
        FullName,
        Email,
        ISNULL(PhoneNumber, '') as PhoneNumber,
        PasswordHash,
        IsActive,
        ISNULL(IsEmailVerified, 0) as IsEmailVerified,
        LastLogin,
        CreatedAt
    FROM Customers
    WHERE Email = @Email AND IsActive = 1;
END
GO

-- =============================================================================
-- CREATE BASIC INDEXES
-- =============================================================================

-- Users table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email_New' AND object_id = OBJECT_ID('Users'))
    CREATE INDEX IX_Users_Email_New ON Users(Email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_RoleID_New' AND object_id = OBJECT_ID('Users'))
    CREATE INDEX IX_Users_RoleID_New ON Users(RoleID);

-- Customers table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Email_New' AND object_id = OBJECT_ID('Customers'))
    CREATE INDEX IX_Customers_Email_New ON Customers(Email);

-- SessionTokens table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionTokens_TokenHash' AND object_id = OBJECT_ID('SessionTokens'))
    CREATE INDEX IX_SessionTokens_TokenHash ON SessionTokens(TokenHash);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionTokens_UserID' AND object_id = OBJECT_ID('SessionTokens'))
    CREATE INDEX IX_SessionTokens_UserID ON SessionTokens(UserID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionTokens_CustomerID' AND object_id = OBJECT_ID('SessionTokens'))
    CREATE INDEX IX_SessionTokens_CustomerID ON SessionTokens(CustomerID);

PRINT 'Indexes created successfully.';

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================
PRINT '';
PRINT '=============================================================================';
PRINT 'MINIMAL ROLE ACCESS SYSTEM UPDATE COMPLETE';
PRINT '=============================================================================';
PRINT '';
PRINT 'Updates Applied:';
PRINT '  ✓ Enhanced Users table with new columns';
PRINT '  ✓ Enhanced Customers table with new columns';
PRINT '  ✓ Created SessionTokens table for API authentication';
PRINT '  ✓ Ensured Admin user exists';
PRINT '  ✓ Granted all permissions to Admin role';
PRINT '  ✓ Created simplified stored procedures';
PRINT '  ✓ Added performance indexes';
PRINT '';
PRINT 'Default Admin Login:';
PRINT '  Email: admin@designxcel.com';
PRINT '  Password: admin123 (CHANGE IMMEDIATELY)';
PRINT '';
PRINT 'The role-based authentication system is now ready!';
PRINT 'You can now:';
PRINT '  1. Start your Node.js server';
PRINT '  2. Login with the admin account';
PRINT '  3. Access /Employee/Admin/UserManagement';
PRINT '  4. Create additional users';
PRINT '';
PRINT '=============================================================================';
