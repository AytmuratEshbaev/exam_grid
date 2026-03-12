const db = require('./db');

async function migrate() {
  try {
    // Add student_id column (permanent unique identifier that doesn't change between quarters)
    await db.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS student_id VARCHAR(20) UNIQUE
    `);
    console.log('✅ Migration complete: student_id column added to students table');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
