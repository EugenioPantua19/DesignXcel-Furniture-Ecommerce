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

async function fixDeliveryRatesUserInfo() {
    try {
        console.log('Connecting to database...');
        await sql.connect(config);
        console.log('Connected successfully!');

        // Check current delivery rates with NULL user info
        console.log('\n=== Checking delivery rates with NULL user info ===');
        const nullUserResult = await sql.query(`
            SELECT RateID, ServiceType, Price, CreatedByUserID, CreatedByUsername
            FROM DeliveryRates 
            WHERE CreatedByUserID IS NULL OR CreatedByUsername IS NULL
        `);
        
        console.log(`Found ${nullUserResult.recordset.length} delivery rates with NULL user info:`);
        nullUserResult.recordset.forEach(rate => {
            console.log(`- ID: ${rate.RateID}, Service: "${rate.ServiceType}", Price: ₱${rate.Price}, CreatedByUserID: ${rate.CreatedByUserID}, CreatedByUsername: ${rate.CreatedByUsername}`);
        });

        if (nullUserResult.recordset.length === 0) {
            console.log('No delivery rates with NULL user info found. Nothing to fix.');
            return;
        }

        // Get the first admin user to assign as the creator
        console.log('\n=== Finding admin user to assign as creator ===');
        const adminResult = await sql.query(`
            SELECT TOP 1 UserID, Username, FullName 
            FROM Users 
            WHERE RoleID = (SELECT RoleID FROM Roles WHERE RoleName = 'Admin') 
            AND IsActive = 1
            ORDER BY UserID
        `);

        if (adminResult.recordset.length === 0) {
            console.log('No admin user found. Cannot fix user info.');
            return;
        }

        const adminUser = adminResult.recordset[0];
        console.log(`Using admin user: ${adminUser.Username} (ID: ${adminUser.UserID})`);

        // Update all delivery rates with NULL user info
        console.log('\n=== Updating delivery rates with user info ===');
        for (const rate of nullUserResult.recordset) {
            console.log(`Updating delivery rate ID ${rate.RateID}...`);
            
            await sql.query(`
                UPDATE DeliveryRates 
                SET CreatedByUserID = ${adminUser.UserID}, 
                    CreatedByUsername = '${adminUser.Username || adminUser.FullName}'
                WHERE RateID = ${rate.RateID}
            `);
            
            console.log(`  ✅ Updated delivery rate ID ${rate.RateID}`);
        }

        // Verify the fix
        console.log('\n=== Verifying fix ===');
        const verifyResult = await sql.query(`
            SELECT RateID, ServiceType, Price, CreatedByUserID, CreatedByUsername
            FROM DeliveryRates 
            WHERE CreatedByUserID IS NULL OR CreatedByUsername IS NULL
        `);
        
        if (verifyResult.recordset.length === 0) {
            console.log('✅ All delivery rates now have user info!');
        } else {
            console.log(`❌ Still ${verifyResult.recordset.length} delivery rates with NULL user info.`);
        }

        // Show final status
        const finalResult = await sql.query(`
            SELECT RateID, ServiceType, Price, CreatedByUserID, CreatedByUsername
            FROM DeliveryRates 
            ORDER BY RateID
        `);
        
        console.log('\n=== Final delivery rates status ===');
        finalResult.recordset.forEach(rate => {
            console.log(`- ID: ${rate.RateID}, Service: "${rate.ServiceType}", Price: ₱${rate.Price}, CreatedBy: ${rate.CreatedByUsername} (ID: ${rate.CreatedByUserID})`);
        });

    } catch (error) {
        console.error('Error fixing delivery rates user info:', error.message);
    } finally {
        await sql.close();
        console.log('Database connection closed.');
    }
}

// Run the fix
fixDeliveryRatesUserInfo();
