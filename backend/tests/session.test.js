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
        prismaMock.course.findUnique.mockResolvedValue({ id: 1, instructor_id: 1 });
    });

    describe('POST /api/sessions', () => {
        it('should reject create session with missing title', async () => {
            prismaMock.live_classes.findUnique.mockResolvedValue({ course_id: 1 });

            const res = await request(app)
                .post('/api/sessions')
                .set('Authorization', 'Bearer token')
                .send({ start_time: '2026-06-01T10:00:00Z', live_class_id: 1 });

            expect(res.statusCode).toBe(422);
            expect(res.body.errors).toBeDefined();
        });

        it('should reject create session with empty title', async () => {
            const res = await request(app)
                .post('/api/sessions')
                .set('Authorization', 'Bearer token')
                .send({ title: '', start_time: '2026-06-01T10:00:00Z', course_id: 1 });

            expect(res.statusCode).toBe(422);
            expect(res.body.errors).toBeDefined();
        });
    });

    describe('PUT /api/sessions/:id/open', () => {
        it('should let the assigned teacher open a session and auto-publish the course', async () => {
            jwt.verify.mockReturnValue({ id: 1, email: 'teacher@test.com', role: 'instructor' });

            prismaMock.sessions.findUnique
                .mockResolvedValueOnce({
                    id: 10,
                    teacher_id: 1,
                    status: 'scheduled',
                    title: 'Live 1',
                    meeting_id: 'meeting-10',
                    live_classes: { course_id: 5 },
                })
                .mockResolvedValueOnce({
                    id: 10,
                    teacher_id: 1,
                    status: 'scheduled',
                    title: 'Live 1',
                    meeting_id: 'meeting-10',
                    live_classes: { course_id: 5 },
                });
            prismaMock.course.findUnique.mockResolvedValue({
                title: 'Course 5',
                instructor_id: 99,
                is_published: false,
                status: 'draft',
            });
            prismaMock.course.update.mockResolvedValue({ id: 5, is_published: true, status: 'published' });
            prismaMock.sessions.update.mockResolvedValue({
                id: 10,
                status: 'open',
                meeting_id: 'meeting-10',
            });
            prismaMock.enrollment.findMany.mockResolvedValue([]);

            const res = await request(app)
                .put('/api/sessions/10/open')
                .set('Authorization', 'Bearer token');

            expect(res.statusCode).toBe(200);
            expect(prismaMock.course.update).toHaveBeenCalledWith({
                where: { id: 5 },
                data: { is_published: true, status: 'published' },
            });
            expect(prismaMock.sessions.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: expect.objectContaining({ status: 'open' }),
            });
        });
    });
});
