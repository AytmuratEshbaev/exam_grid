require('dotenv').config();
const db = require('./db'); 

async function runMigration() {
    try {
        console.log('Starting migration for exam_rooms and academic_year removal...');
        
        // 1. Create the junction table
        await db.query(`
            CREATE TABLE IF NOT EXISTS exam_rooms (
                exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
                room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
                PRIMARY KEY (exam_id, room_id)
            )
        `);
        console.log('Created exam_rooms table.');

        // 2. Drop the academic_year column from exams table
        await db.query(`
            ALTER TABLE exams 
            DROP COLUMN IF EXISTS academic_year CASCADE
        `);
        console.log('Dropped academic_year column from exams table.');

        console.log('Migration completed successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
