-- AutoMessages schema for automated FAQ responses (MSSQL)
IF NOT EXISTS (SELECT *
FROM sysobjects
WHERE name='AutoMessages' AND xtype='U')
BEGIN
    CREATE TABLE AutoMessages
    (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        Question NVARCHAR(500) NOT NULL,
        Answer NVARCHAR(MAX) NOT NULL,
        Keywords NVARCHAR(500) NULL,
        -- comma-separated keywords to help matching
        IsActive BIT NOT NULL DEFAULT(1),
        CreatedAt DATETIME NOT NULL DEFAULT(GETDATE()),
        UpdatedAt DATETIME NOT NULL DEFAULT(GETDATE())
    );
END;
GO

-- Helpful indexes
IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name='IX_AutoMessages_IsActive')
	CREATE INDEX IX_AutoMessages_IsActive ON AutoMessages(IsActive);
GO

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name='IX_AutoMessages_UpdatedAt')
	CREATE INDEX IX_AutoMessages_UpdatedAt ON AutoMessages(UpdatedAt DESC);
GO 