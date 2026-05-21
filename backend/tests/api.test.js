const request = require('supertest');

jest.mock('@prisma/client');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
const { prismaMock } = require('@prisma/client');

const app = require('../src/app');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    describe('Auth Endpoints', () => {
        it('should register a new user successfully', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashedpassword');
            prismaMock.user.create.mockResolvedValue({
                id: 1, name: 'Test User', email: 'test@example.com',
                role: 'student', is_verified: false, created_at: new Date()
            });
            jwt.sign.mockReturnValue('mocked.jwt.token');

            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe('test@example.com');
            expect(res.body.data.token).toBe('mocked.jwt.token');
        });

        it('should fail register if email already exists', async () => {
            prismaMock.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/already registered/i);
        });

        it('should login an existing user successfully', async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                id: 1, name: 'Test User', email: 'test@example.com',
                password: 'hashedpassword', role: 'student'
            });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mocked.jwt.token');

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.token).toBe('mocked.jwt.token');
            expect(res.body.data.user.email).toBe('test@example.com');
        });

        it('should fail login with wrong password', async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                id: 1, email: 'test@example.com',
                password: 'hashedpassword', role: 'student'
            });
            bcrypt.compare.mockResolvedValue(false);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'wrongpassword' });

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toMatch(/Invalid/i);
        });

        it('should fail login with non-existent email', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'notfound@example.com', password: 'password123' });

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toMatch(/Invalid/i);
        });

        it('should reject register with short name', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'A', email: 'test@example.com', password: 'password123' });

            expect(res.statusCode).toBe(422);
            expect(res.body.errors).toBeDefined();
        });

        it('should reject register with invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test User', email: 'not-an-email', password: 'password123' });

            expect(res.statusCode).toBe(422);
            expect(res.body.errors).toBeDefined();
        });

        it('should reject register with short password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test User', email: 'test@example.com', password: '12345' });

            expect(res.statusCode).toBe(422);
            expect(res.body.errors).toBeDefined();
        });
    });

    describe('Validate Middleware', () => {
        it('should reject login with missing fields', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com' });

            expect(res.statusCode).toBe(422);
            expect(res.body.errors).toBeDefined();
        });
    });

    describe('Missing Route', () => {
        it('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/api/unknown/route');
            expect(res.statusCode).toBe(404);
        });
    });
});
