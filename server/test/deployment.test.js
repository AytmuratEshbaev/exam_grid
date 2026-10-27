const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/examgrid_test';
process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters';
const app = require('../../api/index');
const db = require('../database/db');
let server;
let baseUrl;
const originalQuery = db.query;
const originalConnect = db.pool.connect;

before(async () => {
    server = await new Promise((resolve) => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    db.query = originalQuery;
    db.pool.connect = originalConnect;
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
});

test('serverless entry serves liveness without a database connection', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).status, 'ok');
});

test('database readiness checks schema and reports failures without leaking details', async () => {
    db.query = async (sql) => {
        assert.match(sql, /FROM admins/);
        return { rows: [] };
    };
    assert.equal((await fetch(`${baseUrl}/api/health/db`)).status, 200);
    db.query = async () => { throw new Error('test connection unavailable'); };
    const response = await fetch(`${baseUrl}/api/health/db`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: 'error', database: 'unavailable' });
    db.query = originalQuery;
});

test('unknown API requests return JSON instead of the frontend', async () => {
    const response = await fetch(`${baseUrl}/api/does-not-exist`);
    assert.equal(response.status, 404);
    assert.match(response.headers.get('content-type'), /application\/json/);
});

test('protected API rejects requests without credentials', async () => {
    assert.equal((await fetch(`${baseUrl}/api/admin/classes`)).status, 401);
});

test('database acquisition rejection in a transaction handler returns HTTP 500', async () => {
    db.pool.connect = async () => { throw new Error('test pool unavailable'); };
    const token = jwt.sign({ id: 1, role: 'superadmin' }, process.env.JWT_SECRET);
    const response = await fetch(`${baseUrl}/api/admin/exams`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}',
        signal: AbortSignal.timeout(3000),
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { message: 'Server error' });
    db.pool.connect = originalConnect;
});

test('public exam date windows explicitly use Tashkent time', async () => {
    db.query = async (sql) => {
        assert.match(sql, /CURRENT_TIMESTAMP AT TIME ZONE 'Asia\/Tashkent'/);
        return { rows: [] };
    };
    const response = await fetch(`${baseUrl}/api/public/today-exams`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), []);
    db.query = originalQuery;
});

test('Neon connections verify TLS certificates and attach the Vercel pool lifecycle', () => {
    const result = spawnSync(process.execPath, ['-e', `
        const assert = require('node:assert/strict');
        const { pool } = require('./server/database/db');
        const { Client } = require('./server/node_modules/pg');
        const client = new Client(pool.options);
        assert.ok(client.connectionParameters.ssl);
        assert.notEqual(client.connectionParameters.ssl.rejectUnauthorized, false);
        assert.equal(pool.options.max, 5);
        assert.equal(pool.options.connectionTimeoutMillis, 15000);
        pool.end();
    `], {
        cwd: path.join(__dirname, '../..'),
        env: {
            ...process.env,
            VERCEL: '1',
            DATABASE_URL: 'postgresql://test:test@ep-example-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require',
        },
        encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
});
