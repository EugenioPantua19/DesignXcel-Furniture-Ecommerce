-- Delete a specific customer address by AddressID (safe)
-- Target: SQL Server (T-SQL)
-- Behavior:
--  - Auto-detects the owning CustomerID
--  - Aborts if any Orders reference this address (ShippingAddressID)
--  - If the address was default, promotes the oldest remaining address

USE DesignXcelDB; -- Adjust if your DB name differs
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @TargetAddressID INT = 1; -- Change as needed

    -- Resolve CustomerID for the address
    DECLARE @CustomerID INT = NULL;
    SELECT @CustomerID = CA.CustomerID
    FROM dbo.CustomerAddresses AS CA WITH (UPDLOCK, HOLDLOCK)
    WHERE CA.AddressID = @TargetAddressID;

    IF (@CustomerID IS NULL)
    BEGIN
        PRINT CONCAT('No address found with AddressID=', @TargetAddressID, '. Nothing to delete.');
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- Prevent deletion if referenced by Orders
    IF EXISTS (
        SELECT 1
        FROM dbo.Orders WITH (NOLOCK)
        WHERE ShippingAddressID = @TargetAddressID
    )
    BEGIN
        PRINT 'Address is referenced by one or more Orders. Aborting delete.';
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- Track if the address is default
    DECLARE @WasDefault BIT = 0;
    SELECT @WasDefault = IsDefault FROM dbo.CustomerAddresses WHERE AddressID = @TargetAddressID;

    -- Perform deletion
    DELETE FROM dbo.CustomerAddresses WHERE AddressID = @TargetAddressID;

    IF (@@ROWCOUNT = 0)
    BEGIN
        PRINT 'Delete skipped: address not found.';
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- If it was default, promote the oldest remaining for the same customer
    IF (@WasDefault = 1)
    BEGIN
        DECLARE @NewDefaultID INT = NULL;
        SELECT TOP 1 @NewDefaultID = AddressID
        FROM dbo.CustomerAddresses WITH (UPDLOCK, HOLDLOCK)
        WHERE CustomerID = @CustomerID
        ORDER BY CreatedAt ASC;

        IF (@NewDefaultID IS NOT NULL)
        BEGIN
            UPDATE dbo.CustomerAddresses SET IsDefault = 1 WHERE AddressID = @NewDefaultID;
            PRINT CONCAT('Deleted default address. Promoted AddressID=', @NewDefaultID, ' as new default for CustomerID=', @CustomerID);
        END
        ELSE
        BEGIN
            PRINT CONCAT('Deleted default address for CustomerID=', @CustomerID, '. No remaining addresses to promote.');
        END
    END

    COMMIT TRANSACTION;
    PRINT CONCAT('Deleted AddressID=', @TargetAddressID, ' for CustomerID=', @CustomerID);
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;

    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrSev INT = ERROR_SEVERITY();
    DECLARE @ErrState INT = ERROR_STATE();
    RAISERROR('Failed to delete address: %s', @ErrSev, @ErrState, @ErrMsg);
END CATCH;


