const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    describe('Auth Endpoints', () => {
        it('should register a new user successfully', async () => {
            bcrypt.hash.mockResolvedValue('hashedpassword');
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({
                    rows: [{ id: 1, name: 'Test User', email: 'test@example.com', role: 'student', is_verified: false }],
                });
            jwt.sign.mockReturnValue('mocked.jwt.token');

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data.user).toHaveProperty('id', 1);
            expect(res.body.data.user).toHaveProperty('email', 'test@example.com');
            expect(res.body.data).toHaveProperty('token', 'mocked.jwt.token');
        });

        it('should login an existing user successfully', async () => {
            db.query.mockResolvedValue({
                rows: [{ id: 1, name: 'Test User', email: 'test@example.com', password: 'hashedpassword', role: 'student' }],
            });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mocked.jwt.token');
            process.env.JWT_SECRET = 'secret';

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveProperty('token', 'mocked.jwt.token');
            expect(res.body.data.user).toHaveProperty('email', 'test@example.com');
        });

        it('should fail login with wrong password', async () => {
            db.query.mockResolvedValue({
                rows: [{ id: 1, name: 'Test User', email: 'test@example.com', password: 'hashedpassword', role: 'student' }],
            });
            bcrypt.compare.mockResolvedValue(false);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                });

            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('message', 'Invalid email or password');
        });
    });

    describe('Missing Route', () => {
        it('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/api/unknown/route');
            expect(res.statusCode).toBe(404);
        });
    });
});
