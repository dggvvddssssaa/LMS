const db = require('./src/config/db');

async function prepareForPrisma() {
  try {
    // Add updated_at to courses if missing
    try {
      await db.query("ALTER TABLE courses ADD COLUMN updated_at TIMESTAMP DEFAULT NOW() NOT NULL");
      console.log('Added updated_at to courses');
    } catch(e) {
      if (e.message.includes('already exists')) console.log('updated_at already exists on courses');
      else console.log('courses.updated_at error:', e.message);
    }

    // Add updated_at to lessons if missing  
    try {
      await db.query("ALTER TABLE lessons ADD COLUMN updated_at TIMESTAMP DEFAULT NOW() NOT NULL");
      console.log('Added updated_at to lessons');
    } catch(e) {
      if (e.message.includes('already exists')) console.log('updated_at already exists on lessons');
      else console.log('lessons.updated_at error:', e.message);
    }

    // Add level to courses if missing
    try {
      await db.query("ALTER TABLE courses ADD COLUMN level VARCHAR(20) DEFAULT 'beginner'");
      console.log('Added level to courses');
    } catch(e) {
      if (e.message.includes('already exists')) console.log('level already exists on courses');
      else console.log('courses.level error:', e.message);
    }

    // Add live_link to courses if missing
    try {
      await db.query("ALTER TABLE courses ADD COLUMN live_link TEXT");
      console.log('Added live_link to courses');
    } catch(e) {
      if (e.message.includes('already exists')) console.log('live_link already exists on courses');
      else console.log('courses.live_link error:', e.message);
    }

    // Add schedule_time to courses if missing
    try {
      await db.query("ALTER TABLE courses ADD COLUMN schedule_time TIMESTAMP");
      console.log('Added schedule_time to courses');
    } catch(e) {
      if (e.message.includes('already exists')) console.log('schedule_time already exists on courses');
      else console.log('courses.schedule_time error:', e.message);
    }

    // Add status to courses if missing
    try {
      await db.query("ALTER TABLE courses ADD COLUMN status VARCHAR(20) DEFAULT 'draft'");
      console.log('Added status to courses');
    } catch(e) {
      if (e.message.includes('already exists')) console.log('status already exists on courses');
      else console.log('courses.status error:', e.message);
    }

    // Add content to lessons if missing
    try {
      await db.query("ALTER TABLE lessons ADD COLUMN content TEXT");
      console.log('Added content to lessons');
    } catch(e) {
      if (e.message.includes('already exists')) console.log('content already exists on lessons');
      else console.log('lessons.content error:', e.message);
    }

    // Create quizzes table if not exists
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS quizzes (
          id SERIAL PRIMARY KEY,
          lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
          question TEXT NOT NULL,
          options JSONB,
          correct_answer TEXT NOT NULL
        )
      `);
      console.log('Quizzes table OK');
    } catch(e) {
      console.log('Quizzes error:', e.message);
    }

    console.log('Database prepared for Prisma!');
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

prepareForPrisma();
