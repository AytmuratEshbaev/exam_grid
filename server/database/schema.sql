-- Database schema for ExamGrid
-- Barcha eski migratsiyalar (exam_classes, exam_rooms, student_id) shu faylga birlashtirilgan

-- Toshkent vaqtiga bog'liq taqqoslashlar API so'rovlarida AT TIME ZONE bilan beriladi.
-- Neon pooled ulanishlarida session yoki database timezone sozlamasiga tayanmaymiz.

-- 1. classes table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    grade_level INTEGER NOT NULL,
    student_count INTEGER DEFAULT 0
);

-- 2. students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    student_code VARCHAR(20) UNIQUE, -- login, har chorakda o'zgarishi mumkin
    student_password TEXT,          -- external exam platform credential; staff API only
    student_id VARCHAR(20) UNIQUE CONSTRAINT students_numeric_student_id CHECK (student_id ~ '^[0-9]+$'), -- permanent numeric ID
    is_active BOOLEAN DEFAULT true
);

-- 3. rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL,
    rows_count INTEGER NOT NULL,
    seats_per_row INTEGER NOT NULL,
    building VARCHAR(100)
);

-- 4. exams table
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    exam_time TIME NOT NULL,
    quarter INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' -- scheduled, active, done
);

-- 5. exam_classes table (imtihon <-> sinflar)
CREATE TABLE IF NOT EXISTS exam_classes (
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, class_id)
);

-- 6. exam_rooms table (imtihon <-> xonalar)
CREATE TABLE IF NOT EXISTS exam_rooms (
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, room_id)
);

-- 7. assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    seat_row INTEGER NOT NULL,
    seat_number INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, student_id) -- Bitta imtihonda 1 o'quvchi faqat 1 ta o'ringa taqsimlanadi
);

CREATE INDEX IF NOT EXISTS idx_assignments_exam_id ON assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);

-- 8. admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Superadmin bu yerda yaratilmaydi: `npm run db:init` uni ADMIN_USERNAME / ADMIN_PASSWORD dan yaratadi
