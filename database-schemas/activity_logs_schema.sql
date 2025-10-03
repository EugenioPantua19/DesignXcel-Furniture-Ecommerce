-- ActivityLogs table schema for Microsoft SQL Server (MSSQL)
-- This table tracks all user activities in the admin system

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ActivityLogs' AND xtype='U')
BEGIN
    CREATE TABLE ActivityLogs (
        LogID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        Action NVARCHAR(100) NOT NULL,
        TableAffected NVARCHAR(100) NULL,
        RecordID INT NULL,
        Description NVARCHAR(MAX) NULL,
        Timestamp DATETIME NOT NULL DEFAULT(GETDATE()),
        
        -- Foreign key to Users table
        CONSTRAINT FK_ActivityLogs_Users 
            FOREIGN KEY (UserID) 
            REFERENCES Users(UserID) 
            ON DELETE CASCADE
    );
    
    PRINT 'ActivityLogs table created successfully.';
END
ELSE
BEGIN
    PRINT 'ActivityLogs table already exists.';
END
GO

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_ActivityLogs_UserID' AND object_id = OBJECT_ID('ActivityLogs'))
    CREATE INDEX IX_ActivityLogs_UserID ON ActivityLogs(UserID);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_ActivityLogs_Timestamp' AND object_id = OBJECT_ID('ActivityLogs'))
    CREATE INDEX IX_ActivityLogs_Timestamp ON ActivityLogs(Timestamp DESC);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_ActivityLogs_Action' AND object_id = OBJECT_ID('ActivityLogs'))
    CREATE INDEX IX_ActivityLogs_Action ON ActivityLogs(Action);
GO

-- Insert some sample data for testing (optional)
IF NOT EXISTS (SELECT TOP 1 * FROM ActivityLogs)
BEGIN
    INSERT INTO ActivityLogs (UserID, Action, TableAffected, RecordID, Description)
    VALUES 
        (1, 'LOGIN', 'Users', 1, 'User logged into admin panel'),
        (1, 'INSERT', 'Products', 1, 'Added new product: Sample Product'),
        (1, 'UPDATE', 'Products', 1, 'Updated product details'),
        (1, 'DELETE', 'Products', 2, 'Deleted product: Old Product');
    
    PRINT 'Sample activity logs inserted.';
END
GO
