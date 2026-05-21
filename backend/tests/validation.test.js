const request = require('supertest');
const app = require('../src/app');

describe('Validation Edge Cases', () => {
    describe('Auth Validation', () => {
        it('should reject register with invalid role', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test', email: 'test@test.com', password: 'password123', role: 'superadmin' });

            expect(res.statusCode).toBe(422);
        });

        it('should reject login with empty password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@test.com', password: '' });

            expect(res.statusCode).toBe(422);
        });

        it('should reject login with missing email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ password: 'password123' });

            expect(res.statusCode).toBe(422);
        });
    });

    describe('User Validation', () => {
        it('should reject create user without auth', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({ name: 'New', email: 'new@test.com', password: 'pass123' });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('Notifications', () => {
        it('should require auth for notifications', async () => {
            const res = await request(app).get('/api/notifications');
            expect(res.statusCode).toBe(401);
        });
    });

    describe('Enrollments', () => {
        it('should require auth for enrollments', async () => {
            const res = await request(app)
                .post('/api/enrollments')
                .send({ courseId: 1 });
            expect(res.statusCode).toBe(401);
        });
    });
});
