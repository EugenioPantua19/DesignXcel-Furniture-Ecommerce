-- Essential Authentication Setup
-- For existing DesignXcellDB database

USE DesignXcellDB;
GO

PRINT 'Setting up essential authentication components...';

-- =============================================================================
-- CREATE ADMIN USER IF NOT EXISTS
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
-- CREATE BASIC STORED PROCEDURE FOR AUTHENTICATION
-- =============================================================================

-- Simple procedure to get user with role information
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetUserForAuth')
    DROP PROCEDURE GetUserForAuth;
GO

CREATE PROCEDURE GetUserForAuth
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
        r.RoleID,
        r.RoleName
    FROM Users u
    INNER JOIN Roles r ON u.RoleID = r.RoleID
    WHERE u.Email = @Email AND u.IsActive = 1;
END
GO

PRINT 'Authentication stored procedure created.';

-- =============================================================================
-- GRANT ADMIN PERMISSIONS
-- =============================================================================

-- Ensure Admin role has key permissions
DECLARE @AdminRoleID2 INT = (SELECT RoleID FROM Roles WHERE RoleName = 'Admin');

IF @AdminRoleID2 IS NOT NULL
BEGIN
    -- Clear existing admin permissions and grant all
    DELETE FROM RolePermissions WHERE RoleID = @AdminRoleID2;
    
    -- Grant all permissions to Admin
    INSERT INTO RolePermissions (RoleID, PermissionID, GrantedBy, GrantedAt, IsActive)
    SELECT @AdminRoleID2, PermissionID, 1, GETDATE(), 1
    FROM Permissions
    WHERE IsActive = 1;
    
    PRINT 'Admin role granted all permissions.';
END

-- =============================================================================
-- VERIFY SETUP
-- =============================================================================

-- Check if admin user was created successfully
IF EXISTS (SELECT * FROM Users WHERE Email = 'admin@designxcel.com')
BEGIN
    PRINT '';
    PRINT '=============================================================================';
    PRINT 'AUTHENTICATION SETUP COMPLETE!';
    PRINT '=============================================================================';
    PRINT '';
    PRINT 'Admin User Created:';
    PRINT '  Email: admin@designxcel.com';
    PRINT '  Password: admin123 (CHANGE THIS IMMEDIATELY!)';
    PRINT '';
    PRINT 'You can now:';
    PRINT '  1. Start your Node.js server';
    PRINT '  2. Go to http://localhost:5000/login';
    PRINT '  3. Login with the admin credentials';
    PRINT '  4. Access the user management at /Employee/Admin/UserManagement';
    PRINT '';
    PRINT 'IMPORTANT: Change the default admin password immediately!';
    PRINT '=============================================================================';
END
ELSE
BEGIN
    PRINT 'ERROR: Admin user was not created successfully.';
END
