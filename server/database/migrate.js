require('../config/env');
if (process.env.DATABASE_URL_UNPOOLED) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_UNPOOLED;
}
const fs = require('fs');
const path = require('path');
const db = require('./db');

(async () => {
    let client;
    try {
        client = await db.pool.connect();
        await client.query('BEGIN');
        const dir = path.join(__dirname, 'migrations');
        for (const file of fs.readdirSync(dir).filter(name => name.endsWith('.sql')).sort()) {
            await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
        }
        await client.query('COMMIT');
        console.log('Database migrations applied successfully.');
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Migration failed:', error.message);
        process.exitCode = 1;
    } finally {
        if (client) client.release();
        await db.pool.end();
    }
})();
