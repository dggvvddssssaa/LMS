const { Client } = require('pg');
require('dotenv').config();

// Use DATABASE_URL for the target database, derive admin connection from it
const targetUrl = process.env.DATABASE_URL || 'postgresql://postgres:YOUR_PASSWORD@localhost:5432/lms_db';
const url = new URL(targetUrl);
const config = {
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: parseInt(url.port, 10) || 5432,
    database: 'postgres' // connect to default db first to create lms_db
};

const client = new Client(config);

async function setup() {
    try {
        await client.connect();
        console.log('Connected to Postgres.');

        // Drop and Recreate Database for a fresh start (optional, but requested for the F8-style rebuild)
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'lms_db'");
        if (res.rowCount === 0) {
            console.log('Database lms_db does not exist. Creating...');
            await client.query('CREATE DATABASE lms_db');
            console.log('✅ Database lms_db created successfully!');
        } else {
            console.log('Database lms_db already exists. Recreating...');
            // Need to drop connections first if it's in use, but assuming we can just connect to it and drop schema.
        }
        await client.end();

        // Connect to the specific DB
        const dbClient = new Client({ ...config, database: 'lms_db' });
        await dbClient.connect();

        // Drop existing schema completely
        console.log('Dropping existing schema public...');
        await dbClient.query('DROP SCHEMA public CASCADE;');
        await dbClient.query('CREATE SCHEMA public;');
        console.log('✅ Schema public dropped and recreated.');

        // Create new F8-style Schema
        await dbClient.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('admin', 'instructor', 'student')),
                is_verified BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                thumbnail TEXT,
                type VARCHAR(20) DEFAULT 'recorded' CHECK (type IN ('recorded', 'live')),
                price NUMERIC(10, 2) DEFAULT 0,
                is_published BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS live_classes (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                schedule_config JSONB, -- e.g. {"days": ["Mon", "Wed", "Fri"], "time": "19:00"}
                total_sessions INTEGER DEFAULT 0,
                max_students INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS lessons (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                video_url TEXT,
                duration INTEGER DEFAULT 0, -- in seconds
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                live_class_id INTEGER REFERENCES live_classes(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                meeting_link TEXT,
                meeting_id VARCHAR(100),
                notes TEXT,
                status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS session_attendance (
                id SERIAL PRIMARY KEY,
                session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                left_at TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                file_url TEXT NOT NULL,
                type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS assignments (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                deadline TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS enrollments (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
                progress NUMERIC(5, 2) DEFAULT 0, -- e.g. 50.00%
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(student_id, course_id)
            );

            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                amount NUMERIC(10, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
                payment_method VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                type VARCHAR(50), -- e.g. 'course_update', 'live_reminder'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(course_id, student_id)
            );

            CREATE TABLE IF NOT EXISTS lesson_progress (
                id SERIAL PRIMARY KEY,
                enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
                lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                is_completed BOOLEAN DEFAULT false,
                last_position INTEGER DEFAULT 0, -- last watched second
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(enrollment_id, lesson_id)
            );
        `);
        console.log('✅ New F8-style schema and tables created successfully.');
        await dbClient.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

setup();
