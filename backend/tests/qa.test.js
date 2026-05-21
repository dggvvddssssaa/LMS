const request = require('supertest');

jest.mock('@prisma/client');
jest.mock('jsonwebtoken');
const { prismaMock } = require('@prisma/client');

const app = require('../src/app');
const jwt = require('jsonwebtoken');

describe('QA Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
        jwt.verify.mockReturnValue({ id: 1, email: 'student@test.com', role: 'student' });
    });

    describe('POST /api/qa/question', () => {
        it('should reject question with empty title', async () => {
            const res = await request(app)
                .post('/api/qa/question')
                .set('Authorization', 'Bearer token')
                .send({ courseId: 1, title: '', content: 'Some content' });

            expect(res.statusCode).toBe(422);
            expect(res.body.errors).toBeDefined();
        });

        it('should reject question with empty content', async () => {
            const res = await request(app)
                .post('/api/qa/question')
                .set('Authorization', 'Bearer token')
                .send({ courseId: 1, title: 'My Question', content: '' });

            expect(res.statusCode).toBe(422);
            expect(res.body.errors).toBeDefined();
        });
    });

    describe('POST /api/qa/answer', () => {
        it('should reject answer with empty content', async () => {
            const res = await request(app)
                .post('/api/qa/answer')
                .set('Authorization', 'Bearer token')
                .send({ questionId: 1, content: '' });

            expect(res.statusCode).toBe(422);
            expect(res.body.errors).toBeDefined();
        });
    });
});
