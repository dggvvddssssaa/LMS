require('dotenv').config();
const db = require('./src/config/db');

async function runMigrate() {
  try {
    console.log('Starting Phase 2 Migration...');
    await db.query(`
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2) DEFAULT 0.00;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_total_minutes INTEGER DEFAULT 0;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_count INTEGER DEFAULT 0;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS what_you_will_learn TEXT[];

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE,
        slug VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS course_categories (
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        PRIMARY KEY(course_id, category_id)
      );

      ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
      ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;
      ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled';

      CREATE TABLE IF NOT EXISTS global_settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB
      );
    `);
    console.log('Migration Complete.');
  } catch(e) {
    console.error('Migration Error:', e);
  } finally {
    process.exit();
  }
}
runMigrate();
