const request = require('supertest');

jest.mock('@prisma/client');
jest.mock('jsonwebtoken');
const { prismaMock } = require('@prisma/client');

const app = require('../src/app');
const jwt = require('jsonwebtoken');

const mockToken = 'mocked.jwt.token';
const mockUser = { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' };

describe('Course Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
        jwt.verify.mockReturnValue({ id: 1, email: 'admin@test.com', role: 'admin' });
    });

    describe('GET /api/courses', () => {
        it('should list published courses', async () => {
            const courses = [
                { id: 1, title: 'Course 1', type: 'video', is_published: true, price: '0' },
                { id: 2, title: 'Course 2', type: 'live', is_published: true, price: '99.99' },
            ];
            prismaMock.course.count.mockResolvedValue(2);
            prismaMock.course.findMany.mockResolvedValue(courses);

            const res = await request(app).get('/api/courses');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
        });
    });

    describe('POST /api/courses', () => {
        it('should reject create course with missing title', async () => {
            const res = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ description: 'No title here' });

            expect(res.statusCode).toBe(422);
            expect(res.body.errors).toBeDefined();
        });

        it('should reject create course with short title', async () => {
            const res = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ title: 'AB' });

            expect(res.statusCode).toBe(422);
            expect(res.body.errors).toBeDefined();
        });
    });

    describe('GET /api/courses/:id', () => {
        it('should return 404 for non-existent course', async () => {
            prismaMock.course.findUnique.mockResolvedValue(null);

            const res = await request(app).get('/api/courses/99999');

            expect(res.statusCode).toBe(404);
        });
    });
});
