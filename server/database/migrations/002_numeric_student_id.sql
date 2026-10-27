DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'students'::regclass AND conname = 'students_numeric_student_id'
    ) THEN
        ALTER TABLE students ADD CONSTRAINT students_numeric_student_id
            CHECK (student_id ~ '^[0-9]+$');
    END IF;
END
$$;
