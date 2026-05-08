const { Client } = require('pg');

const config = {
    user: 'postgres',
    password: '0989221782',
    host: 'localhost',
    port: 5432,
    database: 'lms_db'
};

const client = new Client(config);

async function alterDB() {
    try {
        await client.connect();
        await client.query(`
            ALTER TABLE courses 
            ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'online';
        `);
        console.log('✅ Altered courses table successfully!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

alterDB();
