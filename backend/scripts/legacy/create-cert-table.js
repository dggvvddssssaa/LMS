const { Client } = require('pg');
const config = { user: 'postgres', password: '0989221782', host: 'localhost', port: 5432, database: 'lms_db' };
const client = new Client(config);
async function run() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        certificate_url TEXT,
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(enrollment_id)
    );
  `);
  console.log('Certificates table created');
  await client.end();
}
run();
