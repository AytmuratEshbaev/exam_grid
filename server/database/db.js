const { Pool, types } = require('pg');
require('../config/env');

// DATE ustunlarini JS Date'ga aylantirmasdan "YYYY-MM-DD" ko'rinishida qaytaramiz,
// aks holda server vaqt zonasiga qarab sana bir kunga siljib ketishi mumkin
types.setTypeParser(types.builtins.DATE, (value) => value);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const databaseUrl = new URL(connectionString);
const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(databaseUrl.hostname);
// pg parses SSL options from the URL. Require certificate verification for Neon.
databaseUrl.searchParams.set('sslmode', isLocal ? 'disable' : 'verify-full');

const pool = new Pool({
  connectionString: databaseUrl.toString(),
  max: 5,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 5000,
  allowExitOnIdle: true,
});

if (process.env.VERCEL) {
  require('@vercel/functions').attachDatabasePool(pool);
}

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Tranzaksiyalar uchun db.query('BEGIN') emas, pool.connect() bilan olingan bitta client ishlating:
// pool orqali har bir so'rov boshqa ulanishga tushishi mumkin
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
