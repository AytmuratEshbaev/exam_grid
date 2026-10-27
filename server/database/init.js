// Bazani tayyorlaydi: schema.sql ni qo'llaydi va superadmin yaratadi (yoki parolini yangilaydi).
// Ishlatish: DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD ni .env da belgilab, `npm run db:init`
require('../config/env');
// Use a direct Neon connection for schema changes when provided.
if (process.env.DATABASE_URL_UNPOOLED) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_UNPOOLED;
}
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function initialize() {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD;

    if (!password || password.length < 8) {
        console.error('ADMIN_PASSWORD kamida 8 belgidan iborat bo\'lishi kerak');
        process.exit(1);
    }

    let client;
    try {
        client = await db.pool.connect();
        await client.query('BEGIN');
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await client.query(schema);

        const hash = await bcrypt.hash(password, 10);
        await client.query(
            `INSERT INTO admins (username, password_hash, full_name, role)
             VALUES ($1, $2, 'Super Admin', 'superadmin')
             ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'superadmin'`,
            [username, hash]
        );
        await client.query('COMMIT');
        console.log('Schema applied successfully.');
        console.log(`Superadmin "${username}" is ready.`);
        console.log('Initialization complete.');
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Initialization error:', error.message);
        process.exitCode = 1;
    } finally {
        if (client) client.release();
        await db.pool.end();
    }
}

initialize();
