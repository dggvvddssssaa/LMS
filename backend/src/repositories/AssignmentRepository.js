const prisma = require('../config/prisma');

class AssignmentRepository {
  async getByLesson(lessonId) {
    return prisma.assignments.findMany({
      where: { lesson_id: Number(lessonId), assignment_scope: 'lesson' },
      orderBy: { created_at: 'desc' }
    });
  }

  async getBySection(sectionId) {
    return prisma.assignments.findMany({
      where: { section_id: Number(sectionId), assignment_scope: 'section' },
      orderBy: { created_at: 'desc' }
    });
  }

  async getByCourseFinal(courseId) {
    return prisma.assignments.findFirst({
      where: { course_id: Number(courseId), assignment_scope: 'final' },
      orderBy: { created_at: 'desc' }
    });
  }

  async getById(id) {
    return prisma.assignments.findUnique({ where: { id: Number(id) } });
  }

  async create(data) {
    return prisma.assignments.create({
      data: {
        lesson_id: data.lesson_id ? Number(data.lesson_id) : null,
        section_id: data.section_id ? Number(data.section_id) : null,
        course_id: data.course_id ? Number(data.course_id) : null,
        title: data.title,
        description: data.description || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        kind: data.kind || 'mcq',
        payload: data.payload || undefined,
        score_max: data.score_max || 100,
        assignment_scope: data.assignment_scope || 'lesson',
        pass_percent: data.pass_percent || 80,
        time_limit_minutes: data.time_limit_minutes || null
      }
    });
  }

  async update(id, data) {
    const cleanData = {};
    const fields = ['title', 'description', 'deadline', 'kind', 'payload', 'score_max', 'assignment_scope', 'pass_percent', 'section_id', 'time_limit_minutes'];
    for (const key of fields) {
      if (data[key] !== undefined) cleanData[key] = data[key];
    }
    if (data.deadline) cleanData.deadline = new Date(data.deadline);
    if (data.section_id) cleanData.section_id = Number(data.section_id);

    return prisma.assignments.update({
      where: { id: Number(id) },
      data: cleanData
    });
  }

  async delete(id) {
    return prisma.assignments.delete({ where: { id: Number(id) }, select: { id: true } });
  }

  async submitAssignment(data) {
    const { assignment_id, student_id, answers, score, status } = data;
    const existing = await prisma.assignment_submissions.findUnique({
      where: { assignment_id_student_id: { assignment_id: Number(assignment_id), student_id } }
    });

    const submissionData = {
      answers: answers || undefined,
      score: score || 0,
      status: status || 'submitted',
      created_at: new Date()
    };

    if (existing) {
      return prisma.assignment_submissions.update({
        where: { id: existing.id },
        data: submissionData
      });
    }

    return prisma.assignment_submissions.create({
      data: {
        assignment_id: Number(assignment_id),
        student_id,
        ...submissionData
      }
    });
  }

  async getSubmission(assignmentId, studentId) {
    return prisma.assignment_submissions.findUnique({
      where: { assignment_id_student_id: { assignment_id: Number(assignmentId), student_id: studentId } }
    });
  }
}

module.exports = new AssignmentRepository();
