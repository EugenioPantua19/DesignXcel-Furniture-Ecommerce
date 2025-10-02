# SQL Server Compatibility Fixes

## Issues Found and Fixed

The original schema had several compatibility issues with Microsoft SQL Server:

### 1. **GREATEST and LEAST Functions**

**Problem**: These are MySQL functions, not SQL Server functions.

```sql
-- ❌ MySQL syntax (doesn't work in SQL Server)
GREATEST(p.Price - pd.DiscountValue, 0)
LEAST(pd.DiscountValue, p.Price)
```

**Solution**: Use CASE statements instead.

```sql
-- ✅ SQL Server syntax
CASE WHEN p.Price - pd.DiscountValue < 0 THEN 0 ELSE p.Price - pd.DiscountValue END
CASE WHEN pd.DiscountValue > p.Price THEN p.Price ELSE pd.DiscountValue END
```

### 2. **Unique Constraint with WHERE Clause**

**Problem**: The original constraint syntax was incorrect for SQL Server.

```sql
-- ❌ Incorrect syntax
CONSTRAINT UQ_ProductActiveDiscount UNIQUE (ProductID, IsActive)
    WHERE IsActive = 1
```

**Solution**: Use a filtered unique index instead.

```sql
-- ✅ Correct SQL Server syntax
CREATE UNIQUE NONCLUSTERED INDEX IX_ProductDiscounts_UniqueActive
ON ProductDiscounts(ProductID)
WHERE IsActive = 1;
```

### 3. **Formatting Issues**

**Problem**: Inconsistent indentation and formatting made the schema hard to read.

**Solution**: Cleaned up formatting and made it consistent.

## Files Updated

### 1. `product_discounts_schema_fixed.sql`

- ✅ Fixed all SQL Server compatibility issues
- ✅ Replaced MySQL functions with SQL Server equivalents
- ✅ Used proper filtered unique index syntax
- ✅ Cleaned up formatting

### 2. `backend/server.js`

- ✅ Updated all discount calculation queries to use SQL Server syntax
- ✅ Replaced GREATEST/LEAST with CASE statements

### 3. `test-discount-functionality.js`

- ✅ Updated test queries to use SQL Server syntax
- ✅ Fixed discount calculation examples

## How to Use the Fixed Schema

1. **Delete the old schema file** (if you already ran it):

   ```sql
   -- If you need to clean up, run these commands:
   DROP VIEW IF EXISTS vw_ProductsWithDiscounts;
   DROP PROCEDURE IF EXISTS sp_AddProductDiscount;
   DROP PROCEDURE IF EXISTS sp_RemoveProductDiscount;
   DROP PROCEDURE IF EXISTS sp_GetProductDiscount;
   DROP TRIGGER IF EXISTS TR_ProductDiscounts_UpdateTimestamp;
   DROP TABLE IF EXISTS ProductDiscounts;
   ```

2. **Run the fixed schema**:

   ```sql
   -- Execute the contents of product_discounts_schema_fixed.sql
   ```

3. **Test the setup**:
   ```bash
   node test-discount-functionality.js
   ```

## Key Differences Between MySQL and SQL Server

| Feature              | MySQL                         | SQL Server                 |
| -------------------- | ----------------------------- | -------------------------- |
| Min/Max functions    | `GREATEST()`, `LEAST()`       | `CASE WHEN` statements     |
| Filtered indexes     | `WHERE` clause in constraints | `WHERE` clause in indexes  |
| String concatenation | `CONCAT()`                    | `+` operator or `CONCAT()` |
| Date functions       | `NOW()`                       | `GETDATE()`                |
| Auto-increment       | `AUTO_INCREMENT`              | `IDENTITY(1,1)`            |

## Verification

After running the fixed schema, you can verify it works by:

1. **Checking table creation**:

   ```sql
   SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProductDiscounts';
   ```

2. **Testing discount calculation**:

   ```sql
   -- Test with a sample product
   EXEC sp_AddProductDiscount
       @ProductID = 1,
       @DiscountType = 'percentage',
       @DiscountValue = 20.00,
       @StartDate = '2024-01-01',
       @EndDate = '2024-12-31',
       @CreatedBy = NULL;
   ```

3. **Running the test script**:
   ```bash
   node test-discount-functionality.js
   ```

The fixed schema is now fully compatible with Microsoft SQL Server and should work without any errors.
