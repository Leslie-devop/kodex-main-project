
-- TypingTutor Database Schema and Sample Data
-- Generated for PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user role enum
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');

-- Sessions table for Replit Auth
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IDX_session_expire ON sessions(expire);

-- Users table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lessons table
CREATE TABLE lessons (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    difficulty VARCHAR NOT NULL DEFAULT 'beginner',
    estimated_time INTEGER,
    created_by VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lesson assignments table
CREATE TABLE lesson_assignments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id VARCHAR NOT NULL REFERENCES lessons(id),
    student_id VARCHAR NOT NULL REFERENCES users(id),
    teacher_id VARCHAR NOT NULL REFERENCES users(id),
    due_date TIMESTAMP,
    status VARCHAR NOT NULL DEFAULT 'pending',
    progress DECIMAL(5,2) DEFAULT 0.00,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Typing activities table
CREATE TABLE typing_activities (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id VARCHAR REFERENCES lessons(id),
    student_id VARCHAR NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    time_limit INTEGER,
    min_accuracy DECIMAL(5,2) DEFAULT 85.00,
    min_wpm INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Typing sessions table
CREATE TABLE typing_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id VARCHAR REFERENCES typing_activities(id),
    student_id VARCHAR NOT NULL REFERENCES users(id),
    text TEXT,
    wpm DECIMAL(5,2),
    accuracy DECIMAL(5,2),
    errors INTEGER DEFAULT 0,
    time_spent INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    passed BOOLEAN DEFAULT FALSE,
    keystroke_data JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Keystroke analytics table
CREATE TABLE keystroke_analytics (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR NOT NULL REFERENCES typing_sessions(id),
    student_id VARCHAR NOT NULL REFERENCES users(id),
    key_pressed VARCHAR NOT NULL,
    timing_ms INTEGER,
    was_error BOOLEAN DEFAULT FALSE,
    finger_used VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI suggestions table
CREATE TABLE ai_suggestions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR NOT NULL REFERENCES users(id),
    type VARCHAR NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR DEFAULT 'medium',
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Error patterns table
CREATE TABLE error_patterns (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR NOT NULL REFERENCES users(id),
    pattern VARCHAR NOT NULL,
    error_type VARCHAR NOT NULL,
    frequency INTEGER DEFAULT 1,
    last_occurrence TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data

-- Sample users
INSERT INTO users (id, email, first_name, last_name, role) VALUES
('admin-1', 'admin@typingtutor.com', 'Admin', 'User', 'admin'),
('teacher-1', 'teacher@typingtutor.com', 'John', 'Smith', 'teacher'),
('student-1', 'student1@typingtutor.com', 'Alice', 'Johnson', 'student'),
('student-2', 'student2@typingtutor.com', 'Bob', 'Wilson', 'student'),
('student-3', 'student3@typingtutor.com', 'Carol', 'Davis', 'student');

-- Sample lessons
INSERT INTO lessons (id, title, description, content, difficulty, estimated_time, created_by) VALUES
('lesson-1', 'Basic Home Row Keys', 'Learn the fundamental home row keys: a, s, d, f, j, k, l, semicolon', 'asdf jkl; asdf jkl; fff jjj ddd kkk sss lll aaa ;;; asdf jkl; fjdk slal fjdk slal asdf jkl;', 'beginner', 15, 'teacher-1'),
('lesson-2', 'Top Row Introduction', 'Introduction to the top row keys: q, w, e, r, t, y, u, i, o, p', 'qwert yuiop qwert yuiop qqq www eee rrr ttt yyy uuu iii ooo ppp qwert yuiop', 'beginner', 20, 'teacher-1'),
('lesson-3', 'Bottom Row Basics', 'Learn the bottom row keys: z, x, c, v, b, n, m, comma, period', 'zxcv bnm,. zxcv bnm,. zzz xxx ccc vvv bbb nnn mmm ,,, ... zxcv bnm,.', 'beginner', 18, 'teacher-1'),
('lesson-4', 'Number Row Practice', 'Practice typing numbers 1-9 and 0 with proper finger placement', '1234567890 1234567890 111 222 333 444 555 666 777 888 999 000 1234567890', 'intermediate', 25, 'teacher-1'),
('lesson-5', 'Common Words Practice', 'Practice typing common English words to build fluency', 'the and for are but not you all can had her was one our out day get has him his how its may new now old see two who boy did oil sit yes yet zoo', 'intermediate', 30, 'teacher-1');

-- Sample lesson assignments
INSERT INTO lesson_assignments (id, lesson_id, student_id, teacher_id, status, progress, due_date) VALUES
('assign-1', 'lesson-1', 'student-1', 'teacher-1', 'completed', 100.00, '2024-01-20 23:59:59'),
('assign-2', 'lesson-2', 'student-1', 'teacher-1', 'in_progress', 75.00, '2024-01-25 23:59:59'),
('assign-3', 'lesson-1', 'student-2', 'teacher-1', 'in_progress', 50.00, '2024-01-22 23:59:59'),
('assign-4', 'lesson-3', 'student-2', 'teacher-1', 'pending', 0.00, '2024-01-30 23:59:59'),
('assign-5', 'lesson-1', 'student-3', 'teacher-1', 'completed', 100.00, '2024-01-18 23:59:59');

-- Sample typing activities
INSERT INTO typing_activities (id, lesson_id, student_id, text, time_limit, min_accuracy, min_wpm) VALUES
('activity-1', 'lesson-1', 'student-1', 'asdf jkl; asdf jkl; fff jjj ddd kkk', 300, 85.00, 25),
('activity-2', 'lesson-2', 'student-1', 'qwert yuiop qwert yuiop', 300, 85.00, 30),
('activity-3', 'lesson-1', 'student-2', 'asdf jkl; asdf jkl;', 300, 80.00, 20);

-- Sample typing sessions
INSERT INTO typing_sessions (id, activity_id, student_id, text, wpm, accuracy, errors, time_spent, completed, passed, completed_at) VALUES
('session-1', 'activity-1', 'student-1', 'asdf jkl; asdf jkl; fff jjj ddd kkk', 28.50, 92.50, 3, 180, TRUE, TRUE, '2024-01-15 14:30:00'),
('session-2', 'activity-2', 'student-1', 'qwert yuiop qwert yuiop', 32.00, 88.75, 5, 220, TRUE, TRUE, '2024-01-16 15:45:00'),
('session-3', 'activity-3', 'student-2', 'asdf jkl; asdf jkl;', 22.00, 85.00, 4, 200, TRUE, TRUE, '2024-01-17 10:20:00');

-- Sample AI suggestions
INSERT INTO ai_suggestions (id, student_id, type, content, priority) VALUES
('suggestion-1', 'student-1', 'technique', 'Focus on maintaining proper finger position on the home row. Your ring finger tends to drift when typing the letter "l".', 'medium'),
('suggestion-2', 'student-2', 'practice', 'Consider practicing the "f" and "j" keys more frequently. These anchor keys will improve your overall hand position.', 'high'),
('suggestion-3', 'student-3', 'posture', 'Remember to keep your wrists straight and floating above the keyboard. This will reduce fatigue and improve accuracy.', 'low');

-- Sample error patterns
INSERT INTO error_patterns (id, student_id, pattern, error_type, frequency) VALUES
('error-1', 'student-1', 'l → ;', 'swap', 5),
('error-2', 'student-2', 'f → g', 'wrong', 8),
('error-3', 'student-3', 'missing space', 'missing', 3);

-- Create indexes for better performance
CREATE INDEX idx_lesson_assignments_student ON lesson_assignments(student_id);
CREATE INDEX idx_lesson_assignments_teacher ON lesson_assignments(teacher_id);
CREATE INDEX idx_typing_sessions_student ON typing_sessions(student_id);
CREATE INDEX idx_keystroke_analytics_session ON keystroke_analytics(session_id);
CREATE INDEX idx_ai_suggestions_student ON ai_suggestions(student_id);
CREATE INDEX idx_error_patterns_student ON error_patterns(student_id);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
