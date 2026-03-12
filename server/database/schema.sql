-- Database schema for ExamGrid

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
    student_code VARCHAR(20) UNIQUE,
    student_id VARCHAR(20) UNIQUE,
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
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    quarter INTEGER NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' -- scheduled, active, done
);

-- 5. assignments table
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

-- 6. admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default superadmin (password: admin123)
-- Hash generated for 'admin123' using bcrypt
INSERT INTO admins (username, password_hash, full_name, role) 
VALUES ('admin', '$2b$10$qNswKewnFqbb4uw6qtbJf.a6vvFnx6QfpjI72kbJKgv3ZeQRkpTay', 'Super Admin', 'superadmin')
ON CONFLICT (username) DO NOTHING;
