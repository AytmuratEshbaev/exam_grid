require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initialize() {
    const defaultClient = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: 'postgres',
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        await defaultClient.connect();
        
        // Create database
        const dbName = process.env.DB_NAME || 'examgrid_db';
        try {
            await defaultClient.query(`CREATE DATABASE ${dbName}`);
            console.log(`Database ${dbName} created successfully.`);
        } catch (err) {
            if (err.code === '42P04') {
                console.log(`Database ${dbName} already exists.`);
            } else {
                throw err;
            }
        }
        await defaultClient.end();

        // Connect to new database to apply schema
        const appClient = new Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: dbName,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        });

        await appClient.connect();
        
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        await appClient.query(schema);
        console.log('Schema applied successfully.');
        
        await appClient.end();
        console.log('Initialization complete.');
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

initialize();
