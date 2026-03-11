require('dotenv').config();
const db = require('./db'); // Reusing existing DB connection logic

async function runMigration() {
    try {
        console.log('Starting migration for multi-class exams...');
        
        // 1. Create the junction table
        await db.query(`
            CREATE TABLE IF NOT EXISTS exam_classes (
                exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
                class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
                PRIMARY KEY (exam_id, class_id)
            )
        `);
        console.log('Created exam_classes table.');

        // 2. Migrate existing references from exams to exam_classes
        // Get all exams with class_id
        const examsRes = await db.query('SELECT id, class_id FROM exams WHERE class_id IS NOT NULL');
        
        if (examsRes.rows.length > 0) {
            console.log(`Migrating ${examsRes.rows.length} existing exam bindings...`);
            for (let exam of examsRes.rows) {
                await db.query(
                    'INSERT INTO exam_classes (exam_id, class_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [exam.id, exam.class_id]
                );
            }
        }

        // We can choose to drop the constraint and column or keep it.
        // It's cleaner to drop it, but dropping a column requires care. 
        // For safety, let's just make it null and remove the NOT NULL constraint if any.
        // And then drop the column.
        await db.query('ALTER TABLE exams DROP COLUMN class_id CASCADE');
        console.log('Dropped legacy class_id column from exams table.');

        console.log('Migration completed successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
