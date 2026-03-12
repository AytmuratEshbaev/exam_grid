const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'examshuffle_db',
  password: '#Aytmurat3003',
  port: 5432,
});

async function run() {
  await client.connect();
  
  // Future Exam +10 Days (Should NOT be visible to Invigilator/Public)
  await client.query(`
    INSERT INTO exams (name, exam_date, exam_time, quarter, academic_year, status) 
    VALUES ('Future Exam +10 Days', CURRENT_DATE + INTERVAL '10 days', '10:00:00', 1, '2025', 'active')
  `);

  // Past Exam -10 Days (Should NOT be visible to Invigilator/Public)
  await client.query(`
    INSERT INTO exams (name, exam_date, exam_time, quarter, academic_year, status) 
    VALUES ('Past Exam -10 Days', CURRENT_DATE - INTERVAL '10 days', '10:00:00', 1, '2025', 'done')
  `);

  // Near Future Exam +3 Days (SHOULD be visible)
  await client.query(`
    INSERT INTO exams (name, exam_date, exam_time, quarter, academic_year, status) 
    VALUES ('Near Future Exam +3 Days', CURRENT_DATE + INTERVAL '3 days', '10:00:00', 1, '2025', 'active')
  `);

  console.log('Test exams inserted.');
  await client.end();
}

run().catch(console.error);
