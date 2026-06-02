require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Create admin user if not exists
  let admin = await prisma.user.findUnique({ where: { email: 'admin@admin.com' } });
  if (!admin) {
    const pw = await bcrypt.hash('Admin@123', 10);
    admin = await prisma.user.create({
      data: { name: 'Super Admin', email: 'admin@admin.com', password: pw, role: 'admin', is_verified: true }
    });
    console.log('✅ Admin created');
  } else {
    console.log('✅ Admin exists');
  }

  // 2. Prevent duplicate courses by checking if any exist
  const existingCourse = await prisma.course.findFirst();
  if (existingCourse) {
    console.log('✅ Courses already exist, skipping seed.');
    return;
  }

  // 2. Create courses
  const c1 = await prisma.course.create({
    data: {
      title: 'Lập trình JavaScript từ cơ bản đến nâng cao',
      description: 'Khóa học JavaScript toàn diện.',
      level: 'beginner', price: 0, type: 'recorded',
      status: 'published', is_published: true, instructor_id: admin.id,
      thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400'
    }
  });
  console.log('✅ Course 1 created:', c1.title);

  const c2 = await prisma.course.create({
    data: {
      title: 'ReactJS - Xây dựng Web App hiện đại',
      description: 'Học React từ zero: Components, Hooks, Router.',
      level: 'intermediate', price: 499000, type: 'recorded',
      status: 'published', is_published: true, instructor_id: admin.id,
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400'
    }
  });
  console.log('✅ Course 2 created:', c2.title);

  const c3 = await prisma.course.create({
    data: {
      title: 'Node.js & Express - Backend Development',
      description: 'REST API với Node.js, Express, PostgreSQL.',
      level: 'intermediate', price: 599000, type: 'live',
      live_link: 'https://zoom.us/j/123456789',
      schedule_time: new Date('2026-04-01T09:00:00Z'),
      status: 'draft', is_published: false, instructor_id: admin.id,
      thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400'
    }
  });
  console.log('✅ Course 3 created:', c3.title);

  // 3. Create sections + lessons for Course 1
  const s1 = await prisma.section.create({ data: { course_id: c1.id, title: '1. Giới thiệu JavaScript', order_index: 0 } });
  await prisma.lesson.create({ data: { section_id: s1.id, title: 'JavaScript là gì?', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order_index: 0 } });
  await prisma.lesson.create({ data: { section_id: s1.id, title: 'Cài đặt môi trường', content_type: 'text', content_text: '<h2>Cài đặt Node.js</h2><p>Tải từ nodejs.org</p>', order_index: 1 } });

  const s2 = await prisma.section.create({ data: { course_id: c1.id, title: '2. Biến và Kiểu dữ liệu', order_index: 1 } });
  await prisma.lesson.create({ data: { section_id: s2.id, title: 'var, let, const', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order_index: 0 } });
  const ql = await prisma.lesson.create({ data: { section_id: s2.id, title: 'Quiz: Biến', content_type: 'video', order_index: 1 } });

  // 4. Create MCQ assignments (quiz model removed — using assignments with payload)
  await prisma.assignments.create({
    data: {
      course_id: c1.id, lesson_id: ql.id, title: 'Quiz: Kiểu biến JavaScript',
      kind: 'mcq', assignment_scope: 'lesson', score_max: 100, pass_percent: 80,
      payload: {
        questions: [
          { question: 'Từ khóa nào khai báo biến có thể thay đổi?', options: ['const', 'let', 'var', 'Cả let và var'], correct_answer: 'Cả let và var' },
          { question: 'const có thể gán lại giá trị không?', options: ['Có', 'Không'], correct_answer: 'Không' }
        ]
      }
    }
  });

  // 5. Course 2 sections
  const s3 = await prisma.section.create({ data: { course_id: c2.id, title: '1. React Fundamentals', order_index: 0 } });
  await prisma.lesson.create({ data: { section_id: s3.id, title: 'JSX và Components', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order_index: 0 } });
  await prisma.lesson.create({ data: { section_id: s3.id, title: 'Props và State', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', order_index: 1 } });

  console.log('✅ Seeded 3 courses + sections + lessons + assignments');
  console.log('🎉 Done!');
}

seed()
  .catch(e => { console.error('❌ Error:', e.message); })
  .finally(() => prisma.$disconnect());
