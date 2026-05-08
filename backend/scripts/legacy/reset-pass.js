require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./src/config/db');

async function resetPass() {
    try {
        const hash = await bcrypt.hash('admin123', 10);
        await db.query('UPDATE users SET password = $1 WHERE email = $2', [hash, 'admin@lms.com']);
        console.log('Password reset successful');
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
resetPass();
