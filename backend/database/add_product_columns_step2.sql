-- Step 2: Populate the columns with data
PRINT 'Step 2: Populating existing products with data...';

PRINT 'Generating PublicId for all products...';
UPDATE Products 
SET PublicId = NEWID()
WHERE PublicId IS NULL;

DECLARE @rowsAffected INT = @@ROWCOUNT;
PRINT 'Updated ' + CAST(@rowsAffected AS VARCHAR(10)) + ' products with PublicId';

PRINT 'Generating Slug from product names...';
UPDATE Products 
SET Slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Name, ' ', '-'), '''', ''), ',', ''), '.', ''), '/', ''))
WHERE Slug IS NULL OR Slug = '';

SET @rowsAffected = @@ROWCOUNT;
PRINT 'Updated ' + CAST(@rowsAffected AS VARCHAR(10)) + ' products with Slug';

PRINT 'Generating SKU for all products...';
UPDATE Products 
SET SKU = 'SKU-' + RIGHT('000000' + CAST(ProductID AS VARCHAR(10)), 6)
WHERE SKU IS NULL OR SKU = '';

SET @rowsAffected = @@ROWCOUNT;
PRINT 'Updated ' + CAST(@rowsAffected AS VARCHAR(10)) + ' products with SKU';

PRINT 'Step 2 completed!';
