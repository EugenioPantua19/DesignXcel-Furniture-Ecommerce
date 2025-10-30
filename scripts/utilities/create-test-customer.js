// Script to create a test customer account
// Run this script to create a test customer for login testing

const sql = require('mssql');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database configuration
const dbConfig = {
    server: process.env.DB_SERVER || 'designxcell-server.database.windows.net',
    user: process.env.DB_USERNAME || 'designxcel',
    password: process.env.DB_PASSWORD || 'Azwrath22@',
    database: process.env.DB_DATABASE || 'DesignXcellDB',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function createTestCustomer() {
    try {
        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(dbConfig);
        console.log('✅ Connected to database successfully');

        // Test customer data
        const testCustomer = {
            email: 'test@designxcel.com',
            password: 'TestPassword123!',
            fullName: 'Test Customer',
            phoneNumber: '+1234567890'
        };

        console.log('👤 Creating test customer...');
        console.log('Email:', testCustomer.email);
        console.log('Password:', testCustomer.password);

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(testCustomer.password, saltRounds);
        console.log('🔐 Password hashed successfully');

        // Check if customer already exists
        const existingCustomer = await pool.request()
            .input('email', sql.NVarChar, testCustomer.email)
            .query('SELECT CustomerID FROM Customers WHERE Email = @email');

        if (existingCustomer.recordset.length > 0) {
            console.log('⚠️ Customer already exists with email:', testCustomer.email);
            console.log('Customer ID:', existingCustomer.recordset[0].CustomerID);
            
            // Update the password for existing customer
            await pool.request()
                .input('email', sql.NVarChar, testCustomer.email)
                .input('passwordHash', sql.NVarChar, hashedPassword)
                .query('UPDATE Customers SET PasswordHash = @passwordHash WHERE Email = @email');
            
            console.log('✅ Updated password for existing customer');
        } else {
            // Create new customer
            const result = await pool.request()
                .input('email', sql.NVarChar, testCustomer.email)
                .input('passwordHash', sql.NVarChar, hashedPassword)
                .input('fullName', sql.NVarChar, testCustomer.fullName)
                .input('phoneNumber', sql.NVarChar, testCustomer.phoneNumber)
                .input('isActive', sql.Bit, 1)
                .query(`
                    INSERT INTO Customers (Email, PasswordHash, FullName, PhoneNumber, IsActive, CreatedAt)
                    OUTPUT INSERTED.CustomerID
                    VALUES (@email, @passwordHash, @fullName, @phoneNumber, @isActive, GETDATE())
                `);

            const customerId = result.recordset[0].CustomerID;
            console.log('✅ Test customer created successfully');
            console.log('Customer ID:', customerId);
        }

        console.log('\n📋 Test Customer Details:');
        console.log('Email:', testCustomer.email);
        console.log('Password:', testCustomer.password);
        console.log('Full Name:', testCustomer.fullName);
        console.log('Phone:', testCustomer.phoneNumber);
        console.log('\n🔑 You can now use these credentials to test login');

        await pool.close();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error creating test customer:', error);
        console.error('Error details:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
    }
}

// Run the script
createTestCustomer();
