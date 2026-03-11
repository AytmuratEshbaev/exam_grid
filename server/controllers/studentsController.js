const db = require('../database/db');

// Get all students
exports.getStudents = async (req, res) => {
  const { class_id } = req.query;
  try {
    let query = `
      SELECT s.*, c.name as class_name 
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id 
    `;
    const params = [];

    if (class_id) {
      query += ' WHERE s.class_id = $1';
      params.push(class_id);
    }
    
    query += ' ORDER BY s.full_name';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a student
exports.createStudent = async (req, res) => {
  const { full_name, class_id, student_code, is_active } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO students (full_name, class_id, student_code, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [full_name, class_id, student_code, is_active !== undefined ? is_active : true]
    );
    
    // Update class student count
    if (class_id) {
      await db.query('UPDATE classes SET student_count = student_count + 1 WHERE id = $1', [class_id]);
    }
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Import students
exports.importStudents = async (req, res) => {
  const students = req.body.students; // array of { full_name, class_name, student_code }
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: 'Invalid students data' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Cache to hold class name -> class_id mapping to avoid redundant inserts/selects
    const classMap = {};

    for (const student of students) {
      if (!student.full_name || !student.class_name || !student.student_code) {
        continue; // skip invalid rows
      }

      const classNameInput = student.class_name.toString().trim();
      let classId = classMap[classNameInput];

      if (!classId) {
        // Try to find the class. Using ILIKE for case-insensitive match (e.g., '9-A', '9-a')
        // We'll concatenate grade_level and name temporarily or handle standard formats like "9-A"
        
        let gradeLevel = 9;
        let cName = classNameInput;
        
        // Try to parse standard "9-A" format
        const match = classNameInput.match(/^(\d+)[-\s]*(.*)$/);
        if (match) {
            gradeLevel = parseInt(match[1]);
            cName = match[2].trim() || 'A';
        }

        // Check if a class with exact or similar structure exists
        const existingClass = await client.query('SELECT id FROM classes WHERE grade_level = $1 AND name ILIKE $2', [gradeLevel, cName]);
        
        if (existingClass.rows.length > 0) {
           classId = existingClass.rows[0].id;
        } else {
           // Create new class
           const newClass = await client.query('INSERT INTO classes (grade_level, name) VALUES ($1, $2) RETURNING id', [gradeLevel, cName]);
           classId = newClass.rows[0].id;
        }
        classMap[classNameInput] = classId;
      }

      await client.query(
        'INSERT INTO students (full_name, class_id, student_code) VALUES ($1, $2, $3) ON CONFLICT (student_code) DO NOTHING',
        [student.full_name.trim(), classId, student.student_code.toString().trim()]
      );
    }
    
    // Recalculate student counts for all classes
    await client.query(`
      UPDATE classes 
      SET student_count = (
        SELECT COUNT(*) FROM students WHERE students.class_id = classes.id AND students.is_active = true
      )
    `);

    await client.query('COMMIT');
    res.json({ message: 'Students imported successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const studentCheck = await db.query('SELECT class_id FROM students WHERE id = $1', [id]);
    if (studentCheck.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    
    const classId = studentCheck.rows[0].class_id;
    await db.query('DELETE FROM students WHERE id = $1', [id]);

    if (classId) {
      await db.query('UPDATE classes SET student_count = student_count - 1 WHERE id = $1 AND student_count > 0', [classId]);
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update student (FIO, login, class)
exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const { full_name, student_code, class_id } = req.body;
  try {
    // Get old class_id
    const old = await db.query('SELECT class_id FROM students WHERE id = $1', [id]);
    if (old.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    const oldClassId = old.rows[0].class_id;

    const result = await db.query(
      'UPDATE students SET full_name=$1, student_code=$2, class_id=$3 WHERE id=$4 RETURNING *',
      [full_name, student_code, class_id, id]
    );

    // Recalculate counts for both old and new class
    if (oldClassId) {
      await db.query('UPDATE classes SET student_count = (SELECT COUNT(*) FROM students WHERE class_id = $1 AND is_active = true) WHERE id = $1', [oldClassId]);
    }
    if (class_id && class_id !== oldClassId) {
      await db.query('UPDATE classes SET student_count = (SELECT COUNT(*) FROM students WHERE class_id = $1 AND is_active = true) WHERE id = $1', [class_id]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Bulk transfer students to another class
exports.bulkTransfer = async (req, res) => {
  const { student_ids, target_class_id } = req.body;
  if (!Array.isArray(student_ids) || student_ids.length === 0 || !target_class_id) {
    return res.status(400).json({ message: 'student_ids va target_class_id kerak' });
  }
  try {
    await db.query('BEGIN');
    
    // Get affected old classes
    const oldClasses = await db.query('SELECT DISTINCT class_id FROM students WHERE id = ANY($1::int[])', [student_ids]);
    
    // Update all students
    await db.query('UPDATE students SET class_id = $1 WHERE id = ANY($2::int[])', [target_class_id, student_ids]);
    
    // Recalculate counts for old classes
    for (const row of oldClasses.rows) {
      if (row.class_id) {
        await db.query('UPDATE classes SET student_count = (SELECT COUNT(*) FROM students WHERE class_id = $1 AND is_active = true) WHERE id = $1', [row.class_id]);
      }
    }
    // Recalculate count for target class
    await db.query('UPDATE classes SET student_count = (SELECT COUNT(*) FROM students WHERE class_id = $1 AND is_active = true) WHERE id = $1', [target_class_id]);
    
    await db.query('COMMIT');
    res.json({ message: `${student_ids.length} ta o'quvchi ko'chirildi` });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
};
