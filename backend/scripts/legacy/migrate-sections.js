const db = require('./src/config/db');

async function migrate() {
  try {
    // The lessons table already exists with old schema (course_id, video_url).
    // We need to add the new columns for the F8-style curriculum.
    
    // Add section_id column
    try {
      await db.query("ALTER TABLE lessons ADD COLUMN section_id INTEGER REFERENCES sections(id) ON DELETE CASCADE");
      console.log('Added section_id column');
    } catch(e) {
      if (e.message.includes('already exists')) console.log('section_id already exists');
      else console.log('section_id error:', e.message);
    }

    // Add content_type column
    try {
      await db.query("ALTER TABLE lessons ADD COLUMN content_type VARCHAR(20) DEFAULT 'video'");
      console.log('Added content_type column');
    } catch(e) {
      if (e.message.includes('already exists')) console.log('content_type already exists');
      else console.log('content_type error:', e.message);
    }

    // Add content_url column
    try {
      await db.query("ALTER TABLE lessons ADD COLUMN content_url TEXT");
      console.log('Added content_url column');
    } catch(e) {
      if (e.message.includes('already exists')) console.log('content_url already exists');
      else console.log('content_url error:', e.message);
    }

    // Add content_text column
    try {
      await db.query("ALTER TABLE lessons ADD COLUMN content_text TEXT");
      console.log('Added content_text column');
    } catch(e) {
      if (e.message.includes('already exists')) console.log('content_text already exists');
      else console.log('content_text error:', e.message);
    }

    console.log('Lessons table migration complete!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
