-- Delete All Orders (and related data) Safely
-- Target: SQL Server (T-SQL)
-- This script removes all data from Order-related tables and reseeds identities.
-- Run in a development or staging database first. Ensure you have a backup.

USE DesignXcelDB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON; -- Ensure the transaction aborts on error

BEGIN TRY
    BEGIN TRANSACTION;

    -- 1) Delete dependent rows first where ON DELETE CASCADE may not be present
    IF OBJECT_ID('dbo.OrderItems', 'U') IS NOT NULL
    BEGIN
        DELETE FROM dbo.OrderItems;
    END

    -- 2) Delete main Orders rows
    IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL
    BEGIN
        DELETE FROM dbo.Orders;
    END

    -- 3) Delete WalkInOrders (separate order flow)
    IF OBJECT_ID('dbo.WalkInOrders', 'U') IS NOT NULL
    BEGIN
        DELETE FROM dbo.WalkInOrders;
    END

    -- 4) Reseed identity columns to start from 1 on next insert
    IF OBJECT_ID('dbo.OrderItems', 'U') IS NOT NULL AND EXISTS (SELECT 1 FROM sys.identity_columns WHERE object_id = OBJECT_ID('dbo.OrderItems'))
    BEGIN
        DBCC CHECKIDENT ('dbo.OrderItems', RESEED, 0) WITH NO_INFOMSGS;
    END

    IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL AND EXISTS (SELECT 1 FROM sys.identity_columns WHERE object_id = OBJECT_ID('dbo.Orders'))
    BEGIN
        DBCC CHECKIDENT ('dbo.Orders', RESEED, 0) WITH NO_INFOMSGS;
    END

    IF OBJECT_ID('dbo.WalkInOrders', 'U') IS NOT NULL AND EXISTS (SELECT 1 FROM sys.identity_columns WHERE object_id = OBJECT_ID('dbo.WalkInOrders'))
    BEGIN
        DBCC CHECKIDENT ('dbo.WalkInOrders', RESEED, 0) WITH NO_INFOMSGS;
    END

    COMMIT TRANSACTION;
    PRINT 'All orders deleted and identities reseeded successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR('Delete all orders failed: %s', @ErrorSeverity, @ErrorState, @ErrorMessage);
END CATCH;


