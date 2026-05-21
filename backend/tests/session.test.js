const request = require('supertest');

jest.mock('@prisma/client');
jest.mock('jsonwebtoken');
const { prismaMock } = require('@prisma/client');

const app = require('../src/app');
const jwt = require('jsonwebtoken');

describe('Session Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
        jwt.verify.mockReturnValue({ id: 1, email: 'teacher@test.com', role: 'instructor' });
    });

    describe('POST /api/sessions', () => {
        it('should reject create session with missing title', async () => {
            const res = await request(app)
                .post('/api/sessions')
                .set('Authorization', 'Bearer token')
                .send({ start_time: '2026-06-01T10:00:00Z' });

            expect(res.statusCode).toBe(422);
            expect(res.body.errors).toBeDefined();
        });

        it('should reject create session with empty title', async () => {
            const res = await request(app)
                .post('/api/sessions')
                .set('Authorization', 'Bearer token')
                .send({ title: '', start_time: '2026-06-01T10:00:00Z' });

            expect(res.statusCode).toBe(422);
            expect(res.body.errors).toBeDefined();
        });
    });
});
