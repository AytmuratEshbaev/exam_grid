const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config({path: '.env'});

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function addInvigilator() {
  try {
    const hash = await bcrypt.hash('123456', 10);
    await pool.query('INSERT INTO admins (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', ['invigilator', hash, 'Nazoratchi Akrom', 'invigilator']);
    console.log('Invigilator created (username: invigilator, password: 123456)');
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
addInvigilator();
