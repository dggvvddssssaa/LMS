require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./src/utils/db');

async function seedAdmin() {
    try {
        const email = 'admin@lms.com';
        const rawPassword = 'admin'; // Mật khẩu dễ test: admin

        // Kiểm tra xem đã có admin chưa
        const checkResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (checkResult.rows.length > 0) {
            console.log(`Tài khoản admin ${email} đã tồn tại! Vui lòng sử dụng tài khoản này.`);
        } else {
            const hashedPassword = await bcrypt.hash(rawPassword, 10);

            await pool.query(
                'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
                ['System Admin', email, hashedPassword, 'admin']
            );

            console.log(`Đã tạo thành công tài khoản Admin:`);
            console.log(`Email: ${email}`);
            console.log(`Mật khẩu: ${rawPassword}`);
        }
    } catch (error) {
        console.error('Lỗi khi seed tài khoản admin:', error);
    } finally {
        process.exit();
    }
}

seedAdmin();
