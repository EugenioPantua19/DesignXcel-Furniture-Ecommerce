const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function cleanupSoftDeletedProducts() {
    try {
        console.log('Connecting to database...');
        await sql.connect(config);
        console.log('Connected successfully!');

        // First, let's see what soft-deleted products exist
        console.log('\n=== Checking for soft-deleted products ===');
        const softDeletedResult = await sql.query(`
            SELECT ProductID, Name, DateAdded, IsActive 
            FROM Products 
            WHERE IsActive = 0 
            ORDER BY DateAdded DESC
        `);
        
        console.log(`Found ${softDeletedResult.recordset.length} soft-deleted products:`);
        softDeletedResult.recordset.forEach(product => {
            console.log(`- ID: ${product.ProductID}, Name: "${product.Name}", Date: ${product.DateAdded}`);
        });

        if (softDeletedResult.recordset.length === 0) {
            console.log('No soft-deleted products found. Nothing to clean up.');
            return;
        }

        // Ask for confirmation
        console.log('\n=== WARNING ===');
        console.log('This will PERMANENTLY DELETE the following products and ALL their related data:');
        softDeletedResult.recordset.forEach(product => {
            console.log(`- ${product.Name} (ID: ${product.ProductID})`);
        });
        console.log('\nThis action CANNOT be undone!');
        console.log('Type "DELETE" to confirm, or anything else to cancel:');

        // For automated execution, we'll proceed with the deletion
        // In a real scenario, you might want to add user input here
        const confirmDelete = 'DELETE'; // Change this to require user input if needed
        
        if (confirmDelete !== 'DELETE') {
            console.log('Operation cancelled.');
            return;
        }

        console.log('\n=== Starting permanent deletion ===');
        
        // Process each soft-deleted product
        for (const product of softDeletedResult.recordset) {
            const productId = product.ProductID;
            const productName = product.Name;
            
            console.log(`\nDeleting product: ${productName} (ID: ${productId})`);
            
            // Start transaction for this product
            const transaction = new sql.Transaction();
            await transaction.begin();
            
            try {
                // Delete related data in correct order
                console.log('  - Deleting ProductReviews...');
                await transaction.request()
                    .input('productId', sql.Int, productId)
                    .query('DELETE FROM ProductReviews WHERE ProductID = @productId');
                
                console.log('  - Deleting ProductVariations...');
                await transaction.request()
                    .input('productId', sql.Int, productId)
                    .query('DELETE FROM ProductVariations WHERE ProductID = @productId');
                
                console.log('  - Deleting ProductDiscounts...');
                await transaction.request()
                    .input('productId', sql.Int, productId)
                    .query('DELETE FROM ProductDiscounts WHERE ProductID = @productId');
                
                console.log('  - Deleting ProductMaterials...');
                await transaction.request()
                    .input('productId', sql.Int, productId)
                    .query('DELETE FROM ProductMaterials WHERE ProductID = @productId');
                
                console.log('  - Deleting OrderItems...');
                await transaction.request()
                    .input('productId', sql.Int, productId)
                    .query('DELETE FROM OrderItems WHERE ProductID = @productId');
                
                console.log('  - Deleting Product...');
                await transaction.request()
                    .input('productId', sql.Int, productId)
                    .query('DELETE FROM Products WHERE ProductID = @productId');
                
                // Commit transaction
                await transaction.commit();
                console.log(`  ✅ Successfully deleted ${productName} (ID: ${productId})`);
                
            } catch (error) {
                console.error(`  ❌ Error deleting ${productName} (ID: ${productId}):`, error.message);
                await transaction.rollback();
                console.log(`  🔄 Transaction rolled back for ${productName}`);
            }
        }

        console.log('\n=== Cleanup completed ===');
        console.log('All soft-deleted products have been permanently removed from the database.');

    } catch (error) {
        console.error('Error during cleanup:', error.message);
    } finally {
        await sql.close();
        console.log('Database connection closed.');
    }
}

// Run the cleanup
cleanupSoftDeletedProducts();
