require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const f8CourseData = {
  title: 'JavaScript cơ bản',
  description: 'Khóa học JavaScript cơ bản dành cho người mới bắt đầu tại F8 Fullstack. Nắm vững nền tảng ngôn ngữ lập trình phổ biến nhất thế giới từ số học, hàm, mảng, đối tượng đến DOM APIs, Promise, Fetch và ES6.',
  level: 'beginner',
  price: 0,
  type: 'recorded',
  status: 'published',
  is_published: true,
  thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400',
  sections: [
    {
      title: '1. Giới thiệu & Khái niệm nhập môn',
      lessons: [
        { title: 'Lời khuyên trước khi bắt đầu học', content_type: 'video', video_url: 'https://www.youtube.com/embed/0SJE9dYdpps', duration: 180, is_free_preview: true },
        { title: 'JavaScript là gì? Ứng dụng của JavaScript', content_type: 'text', content_text: '<h3>JavaScript là gì?</h3><p>JavaScript là một ngôn ngữ lập trình kịch bản nhẹ, thường được sử dụng phổ biến nhất để tương tác động trên các trang web...</p>', duration: 300, is_free_preview: true },
        { title: 'Cài đặt môi trường học (Chrome, VS Code)', content_type: 'video', video_url: 'https://www.youtube.com/embed/d3_Dcrv19HY', duration: 420 },
        { title: 'Sử dụng JavaScript với HTML thế nào?', content_type: 'video', video_url: 'https://www.youtube.com/embed/a7S44dZpe5k', duration: 350 },
        { title: 'Làm quen với các hàm built-in phổ biến (alert, console.log)', content_type: 'video', video_url: 'https://www.youtube.com/embed/Zz_j79d9R40', duration: 600 }
      ]
    },
    {
      title: '2. Làm quen với JavaScript cơ bản',
      lessons: [
        { title: 'Khái niệm về Biến (Variables) và cách khai báo', content_type: 'video', video_url: 'https://www.youtube.com/embed/TCoTdQzK1xY', duration: 480 },
        { title: 'Sử dụng chú thích (Comment) hiệu quả', content_type: 'text', content_text: '<h3>Tại sao nên dùng Comment?</h3><p>Dùng để giải thích code, ghi chú hoặc vô hiệu hóa các đoạn code tạm thời...</p>', duration: 150 },
        { title: 'Giới thiệu về Toán tử (Operators)', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 520 },
        { title: 'Các kiểu dữ liệu nguyên bản trong JS', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 710 },
        { title: 'Tạo và gọi hàm (function) đầu tiên', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 400 }
      ]
    },
    {
      title: '3. Toán tử và Câu lệnh điều kiện',
      lessons: [
        { title: 'Toán tử số học (Arithmetic Operators)', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 450 },
        { title: 'Toán tử gán và toán tử tiền tố/hậu tố (++, --)', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 580 },
        { title: 'Toán tử so sánh cơ bản và phức tạp', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 620 },
        { title: 'Câu lệnh điều kiện If đơn giản', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 320 },
        { title: 'Toán tử Logic (&&, ||, !)', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 500 },
        { title: 'Kiểu dữ liệu Boolean và biểu thức điều kiện', content_type: 'text', content_text: '<h3>Kiểu Boolean</h3><p>Chỉ nhận hai giá trị duy nhất: true hoặc false...</p>', duration: 200 }
      ]
    },
    {
      title: '4. Làm việc với Hàm (Functions)',
      lessons: [
        { title: 'Khái niệm Hàm và các tham số (Parameters)', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 540 },
        { title: 'Quy tắc đặt tên và khai báo Hàm an toàn', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 380 },
        { title: 'Hiểu sâu về từ khóa return trong Hàm', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 490 },
        { title: 'Phạm vi hoạt động của biến (Variable Scope)', content_type: 'text', content_text: '<h3>Scope trong JS</h3><p>Tìm hiểu sự khác nhau giữa Global scope, Function scope và Block scope...</p>', duration: 250 },
        { title: 'Phân biệt Declaration, Expression và Arrow Function', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 600 }
      ]
    },
    {
      title: '5. Làm việc với Chuỗi (String)',
      lessons: [
        { title: 'Kiểu dữ liệu Chuỗi và cách khởi tạo', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 320 },
        { title: 'Các phương thức làm việc với Chuỗi phổ biến nhất', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 750 },
        { title: 'Sử dụng Template String (ES6) cực kỳ mạnh mẽ', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 280 }
      ]
    },
    {
      title: '6. Làm việc với Số (Number)',
      lessons: [
        { title: 'Kiểu dữ liệu Số trong JavaScript', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 300 },
        { title: 'Sử dụng toString() và toFixed() để làm tròn số', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 400 }
      ]
    },
    {
      title: '7. Làm việc với Mảng (Array)',
      lessons: [
        { title: 'Khái niệm Mảng (Array) và cách tạo mảng', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 450 },
        { title: 'Các phương thức mảng cơ bản (push, pop, shift, unshift)', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 680 },
        { title: 'Thao tác nâng cao với Mảng: splice, concat, slice', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 520 }
      ]
    },
    {
      title: '8. Làm việc với Đối tượng (Object)',
      lessons: [
        { title: 'Đối tượng (Object) trong JavaScript là gì?', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 460 },
        { title: 'Sử dụng Object Constructor (Hàm tạo đối tượng)', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 590 },
        { title: 'Tìm hiểu về Object Prototype (Nguyên mẫu)', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 430 },
        { title: 'Làm việc với đối tượng Date thời gian thực', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 320 },
        { title: 'Đối tượng Math toán học và các hàm hữu ích', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 510 }
      ]
    },
    {
      title: '9. Câu lệnh rẽ nhánh và Vòng lặp',
      lessons: [
        { title: 'Câu lệnh rẽ nhánh Switch / Case', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 420 },
        { title: 'Toán tử 3 ngôi (Ternary Operator) gọn gàng', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 300 },
        { title: 'Tổng quan về Vòng lặp (Loops) trong lập trình', content_type: 'text', content_text: '<h3>Vòng lặp là gì?</h3><p>Vòng lặp giúp lặp đi lặp lại một đoạn code với số lần xác định hoặc theo một điều kiện...</p>', duration: 180 },
        { title: 'Vòng lặp For cơ bản tăng giảm chỉ số', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 550 },
        { title: 'Vòng lặp For...in duyệt thuộc tính đối tượng', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 410 },
        { title: 'Vòng lặp For...of duyệt phần tử có thể lặp', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 360 },
        { title: 'Vòng lặp While kiểm tra trước điều kiện', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 380 },
        { title: 'Vòng lặp Do...While chạy trước kiểm tra sau', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 340 },
        { title: 'Sử dụng Break và Continue để kiểm soát vòng lặp', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 290 }
      ]
    },
    {
      title: '10. Làm việc với Mảng nâng cao (Array II)',
      lessons: [
        { title: 'Các phương thức duyệt mảng: forEach, every, some', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 620 },
        { title: 'Tìm kiếm phần tử mảng với find và filter', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 510 },
        { title: 'Biến đổi mảng bằng phương thức map()', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 480 },
        { title: 'Tổng hợp dữ liệu mảng bằng reduce() đỉnh cao', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 830 },
        { title: 'Phương thức includes() kiểm tra sự tồn tại', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 300 }
      ]
    },
    {
      title: '11. Khái niệm Callback trong JavaScript',
      lessons: [
        { title: 'Callback là gì? Tại sao phải dùng Callback?', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 520 },
        { title: 'Tự định nghĩa hàm map2() hoạt động như map()', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 650 },
        { title: 'Tự định nghĩa hàm filter2() để hiểu bản chất', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 580 }
      ]
    },
    {
      title: '12. DOM (Document Object Model) nâng cao',
      lessons: [
        { title: 'Giới thiệu về DOM và cây phả hệ DOM tree', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 400 },
        { title: 'DOM HTML vs DOM CSS vs DOM Events', content_type: 'text', content_text: '<h3>Ba nhánh chính của DOM</h3><ul><li>DOM HTML: Thao tác thẻ, thuộc tính</li><li>DOM CSS: Thay đổi inline style</li><li>DOM Events: Gán bộ lắng nghe sự kiện</li></ul>', duration: 300 },
        { title: 'Lấy phần tử qua ID, ClassName, TagName, QuerySelector', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 680 },
        { title: 'Thay đổi DOM Attribute (Thuộc tính thẻ)', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 460 },
        { title: 'Thao tác nội dung bằng innerText và textContent', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 510 },
        { title: 'Thêm phần tử HTML bằng innerHTML và outerHTML', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 530 },
        { title: 'Quản lý class của thẻ bằng ClassList API', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 470 },
        { title: 'Lắng nghe và xử lý Sự kiện DOM Events', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 690 },
        { title: 'Ngăn chặn hành vi mặc định: preventDefault và stopPropagation', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 560 },
        { title: 'Sử dụng addEventListener để gắn đa sự kiện', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 480 }
      ]
    },
    {
      title: '13. JSON, Promise, Fetch & Postman',
      lessons: [
        { title: 'Định dạng dữ liệu JSON là gì?', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 360 },
        { title: 'Chuyển đổi dữ liệu: JSON.parse và JSON.stringify', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 420 },
        { title: 'Khái niệm Promise giải quyết Callback Hell', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 740 },
        { title: 'Ba trạng thái cốt lõi của Promise', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 390 },
        { title: 'Sử dụng Promise.all, Promise.resolve, Promise.reject', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 580 },
        { title: 'Fetch API kết nối lấy dữ liệu từ máy chủ', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 660 },
        { title: 'Làm quen với Postman và các phương thức REST', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 500 },
        { title: 'Thực hành xây dựng ứng dụng CRUD khóa học thực tế', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 980 }
      ]
    },
    {
      title: '14. ECMAScript 6 (ES6+)',
      lessons: [
        { title: 'Sự khác biệt thực sự giữa let, const và var', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 440 },
        { title: 'Arrow Function (Hàm mũi tên) cực ngắn gọn', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 510 },
        { title: 'Sử dụng Template Literals và Multi-line String', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 320 },
        { title: 'Phân rã biến Destructuring và Rest Parameters', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 590 },
        { title: 'Sử dụng toán tử Spread Operator (...)', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 460 },
        { title: 'Tạo Class định hình đối tượng hướng đối tượng', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 610 },
        { title: 'Import và Export Modules trong ES6', content_type: 'video', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 480 }
      ]
    }
  ]
};

async function seedF8JsCourse() {
  console.log('🌱 Starting F8 JavaScript course import...');

  // 1. Find or create the course
  let course = await prisma.course.findFirst({
    where: {
      OR: [
        { title: { contains: 'JavaScript', mode: 'insensitive' } },
        { title: { contains: 'JS', mode: 'insensitive' } }
      ]
    }
  });

  // Get admin or first user to assign as instructor
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } }) || await prisma.user.findFirst();
  if (!admin) {
    throw new Error('❌ No users found in database. Please run general seed first.');
  }

  if (course) {
    console.log(`✅ Found existing course: "${course.title}" (ID: ${course.id})`);
    // Update its properties
    course = await prisma.course.update({
      where: { id: course.id },
      data: {
        title: f8CourseData.title,
        description: f8CourseData.description,
        level: f8CourseData.level,
        thumbnail: f8CourseData.thumbnail,
        price: f8CourseData.price,
        type: f8CourseData.type,
        status: f8CourseData.status,
        is_published: f8CourseData.is_published
      }
    });
  } else {
    console.log(`➕ Creating new course: "${f8CourseData.title}"`);
    course = await prisma.course.create({
      data: {
        title: f8CourseData.title,
        description: f8CourseData.description,
        level: f8CourseData.level,
        thumbnail: f8CourseData.thumbnail,
        price: f8CourseData.price,
        type: f8CourseData.type,
        status: f8CourseData.status,
        is_published: f8CourseData.is_published,
        instructor_id: admin.id
      }
    });
  }

  // 2. Clear old sections & lessons to avoid duplication
  const existingSections = await prisma.section.findMany({
    where: { course_id: course.id }
  });
  const sectionIds = existingSections.map(s => s.id);

  if (sectionIds.length > 0) {
    console.log(`🧹 Clearing ${sectionIds.length} existing sections and their lessons...`);
    // Prisma cascading delete is configured in schema, but we can do it explicitly for safety
    await prisma.lesson.deleteMany({
      where: { section_id: { in: sectionIds } }
    });
    await prisma.section.deleteMany({
      where: { course_id: course.id }
    });
  }

  // 3. Create F8 sections and lessons
  let totalLessonsCreated = 0;
  for (let sIndex = 0; sIndex < f8CourseData.sections.length; sIndex++) {
    const sData = f8CourseData.sections[sIndex];
    console.log(`📦 Creating section [${sIndex + 1}/${f8CourseData.sections.length}]: "${sData.title}"`);

    const section = await prisma.section.create({
      data: {
        course_id: course.id,
        title: sData.title,
        order_index: sIndex
      }
    });

    for (let lIndex = 0; lIndex < sData.lessons.length; lIndex++) {
      const lData = sData.lessons[lIndex];
      await prisma.lesson.create({
        data: {
          section_id: section.id,
          title: lData.title,
          content_type: lData.content_type,
          video_url: lData.video_url || null,
          content_text: lData.content_text || null,
          duration: lData.duration || 0,
          order_index: lIndex,
          is_free_preview: lData.is_free_preview || false,
          video_status: 'ready'
        }
      });
      totalLessonsCreated++;
    }
  }

  console.log(`\n🎉 Success! Seeded "${f8CourseData.title}" with:`);
  console.log(`   - ${f8CourseData.sections.length} Chapters (Sections)`);
  console.log(`   - ${totalLessonsCreated} Lessons`);
}

seedF8JsCourse()
  .catch(e => {
    console.error('❌ Seeding failed:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
