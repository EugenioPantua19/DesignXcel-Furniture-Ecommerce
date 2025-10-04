require('dotenv').config();
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Database configuration for Azure SQL
const dbConfig = {
    server: process.env.DB_SERVER,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, // Required for Azure SQL
        trustServerCertificate: false, // Required for Azure SQL
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    requestTimeout: 30000,
    connectionTimeout: 30000
};

async function setupDatabase() {
    try {
        console.log('Connecting to Azure SQL Database...');
        const pool = new sql.ConnectionPool(dbConfig);
        await pool.connect();
        console.log('Connected to Azure SQL Database successfully!');

        // Read and execute all SQL schema files
        const schemaDir = path.join(__dirname, '../../database-schemas');
        const schemaFiles = fs.readdirSync(schemaDir).filter(file => file.endsWith('.sql'));

        console.log(`Found ${schemaFiles.length} schema files to execute...`);

        for (const file of schemaFiles) {
            console.log(`Executing ${file}...`);
            const sqlContent = fs.readFileSync(path.join(schemaDir, file), 'utf8');
            
            // Split by GO statements (SQL Server batch separator)
            const batches = sqlContent.split(/\bGO\b/i).filter(batch => batch.trim());
            
            for (const batch of batches) {
                if (batch.trim()) {
                    try {
                        await pool.request().query(batch);
                        console.log(`✓ Executed batch from ${file}`);
                    } catch (err) {
                        console.error(`✗ Error executing batch from ${file}:`, err.message);
                        // Continue with other batches
                    }
                }
            }
        }

        console.log('Database setup completed successfully!');
        await pool.close();
        
    } catch (err) {
        console.error('Database setup failed:', err);
        process.exit(1);
    }
}

// Run the setup
setupDatabase();
