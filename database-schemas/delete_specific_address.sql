-- Delete a specific address safely
-- Usage: Run in SQL Server (SSMS/Azure Data Studio). Ensures no Orders reference the address.

USE DesignXcelDB;
GO

SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @TargetAddressID INT = 1; -- Change if needed
    DECLARE @CustomerID INT = 1;      -- Safety: ensure we only touch this customer

    -- Optionally verify by full field match for extra safety
    DECLARE @MatchByFields BIT = 1;

    -- If @MatchByFields = 1, resolve the AddressID by matching all provided fields
    IF (@MatchByFields = 1)
    BEGIN
        SELECT TOP 1 @TargetAddressID = AddressID
        FROM CustomerAddresses
        WHERE CustomerID = @CustomerID
          AND Label = 'Home'
          AND HouseNumber = '238'
          AND Street = 'P. Dela cruz st.'
          AND Barangay = 'Barangay San Bartolome'
          AND City = 'Quezon City'
          AND Province = 'Metro Manila'
          AND Region = 'NCR'
          AND PostalCode = '1116'
          AND (Country = 'Philippines' OR Country IS NULL);
    END

    IF (@TargetAddressID IS NULL)
    BEGIN
        PRINT 'No matching address found. Nothing to delete.';
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- Guard: prevent deletion if referenced by Orders
    IF EXISTS (
        SELECT 1
        FROM Orders WITH (NOLOCK)
        WHERE ShippingAddressID = @TargetAddressID
    )
    BEGIN
        PRINT 'Address is referenced by one or more Orders. Aborting delete.';
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- If the address is currently the default for the customer, optionally move default to the oldest remaining
    DECLARE @IsDefault BIT = 0;
    SELECT @IsDefault = IsDefault FROM CustomerAddresses WHERE AddressID = @TargetAddressID;

    DELETE FROM CustomerAddresses WHERE AddressID = @TargetAddressID AND CustomerID = @CustomerID;

    IF (@@ROWCOUNT = 0)
    BEGIN
        PRINT 'Delete skipped: address not found or customer mismatch.';
        ROLLBACK TRANSACTION;
        RETURN;
    END

    IF (@IsDefault = 1)
    BEGIN
        DECLARE @NewDefaultID INT = NULL;
        SELECT TOP 1 @NewDefaultID = AddressID
        FROM CustomerAddresses
        WHERE CustomerID = @CustomerID
        ORDER BY CreatedAt ASC;

        IF (@NewDefaultID IS NOT NULL)
        BEGIN
            UPDATE CustomerAddresses SET IsDefault = 1 WHERE AddressID = @NewDefaultID;
            PRINT 'Deleted default address. Promoted oldest remaining address as new default.';
        END
        ELSE
        BEGIN
            PRINT 'Deleted default address. No remaining addresses to promote.';
        END
    END

    COMMIT TRANSACTION;
    PRINT CONCAT('Deleted address AddressID=', @TargetAddressID, ' for CustomerID=', @CustomerID);
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrNum INT = ERROR_NUMBER();
    DECLARE @ErrSev INT = ERROR_SEVERITY();
    DECLARE @ErrState INT = ERROR_STATE();
    RAISERROR('Failed to delete address (%d): %s', @ErrSev, @ErrState, @ErrNum, @ErrMsg);
END CATCH


