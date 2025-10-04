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

async function fixVanDeliveryRateUser() {
    try {
        console.log('Connecting to database...');
        await sql.connect(config);
        console.log('Connected successfully!');

        // Update the Van delivery rate (ID: 2) to be created by Jeff (InventoryManager)
        console.log('\n=== Fixing Van delivery rate user info ===');
        console.log('Updating Van delivery rate (ID: 2) to be created by Jeff (InventoryManager)...');
        
        await sql.query(`
            UPDATE DeliveryRates 
            SET CreatedByUserID = 1, 
                CreatedByUsername = 'Jeff'
            WHERE RateID = 2
        `);
        
        console.log('✅ Updated Van delivery rate to be created by Jeff');

        // Verify the fix
        console.log('\n=== Verifying fix ===');
        const verifyResult = await sql.query(`
            SELECT RateID, ServiceType, Price, CreatedByUserID, CreatedByUsername, CreatedAt
            FROM DeliveryRates 
            ORDER BY RateID
        `);
        
        console.log('Current delivery rates status:');
        verifyResult.recordset.forEach(rate => {
            console.log(`- ID: ${rate.RateID}, Service: "${rate.ServiceType}", Price: ₱${rate.Price}, CreatedBy: ${rate.CreatedByUsername} (ID: ${rate.CreatedByUserID}), Date: ${rate.CreatedAt}`);
        });

    } catch (error) {
        console.error('Error fixing Van delivery rate user info:', error.message);
    } finally {
        await sql.close();
        console.log('Database connection closed.');
    }
}

// Run the fix
fixVanDeliveryRateUser();
