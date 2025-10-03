
-- Add OrderSupport user: davidgacuts@gmail.com
-- Password: ordersupport123

USE DesignXcellDB;
GO

PRINT 'Adding OrderSupport user...';

-- Ensure OrderSupport role exists
IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'OrderSupport')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('OrderSupport');
    PRINT 'Added OrderSupport role.';
END

-- Check if user already exists
IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'davidgacuts@gmail.com')
BEGIN
    -- Get OrderSupport role ID
    DECLARE @OrderSupportRoleID INT = (SELECT RoleID FROM Roles WHERE RoleName = 'OrderSupport');
    
    IF @OrderSupportRoleID IS NOT NULL
    BEGIN
        -- Insert new OrderSupport user (using only existing columns)
        INSERT INTO Users (Username, FullName, Email, PasswordHash, RoleID, IsActive)
        VALUES (
            'davidgacuts',
            'David Gacuts',
            'davidgacuts@gmail.com',
            '$2b$12$JjI7R6s881XRJm.q4YqMgOy9.8Rt//Vc1NYqIYx9NpxMvy3psP9.2',
            @OrderSupportRoleID,
            1
        );
        
        PRINT 'OrderSupport user created successfully!';
        PRINT 'Login credentials:';
        PRINT '  Email: davidgacuts@gmail.com';
        PRINT '  Password: ordersupport123';
        PRINT '  Role: OrderSupport';
    END
    ELSE
    BEGIN
        PRINT 'ERROR: OrderSupport role creation failed.';
    END
END
ELSE
BEGIN
    PRINT 'User with email davidgacuts@gmail.com already exists.';
END

GO
