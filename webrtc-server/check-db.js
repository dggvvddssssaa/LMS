// check-db.js
const { PrismaClient } = require("@prisma/client");

// --- SỬA LỖI TẠI ĐÂY ---
// Thêm dấu {} vào trong ngoặc để tránh lỗi InitializationError
const prisma = new PrismaClient({});

async function checkConnection() {
  console.log("🔄 Đang thử kết nối tới PostgreSQL...");

  try {
    // 1. Thử mở kết nối
    await prisma.$connect();
    console.log("✅ Kết nối thành công! (Credentials OK)");

    // 2. Thử truy vấn dữ liệu
    // Lưu ý: Nếu trong file schema.prisma bạn KHÔNG có model User
    // thì dòng dưới đây sẽ báo lỗi: "Cannot read properties of undefined".
    // Nếu bị lỗi đó thì yên tâm là kết nối DB vẫn thành công nhé.
    if (prisma.user) {
      const userCount = await prisma.user.count();
      console.log(
        `📊 Truy vấn thành công! Hiện có ${userCount} users trong DB.`
      );
    } else {
      console.log(
        "⚠️ Kết nối OK nhưng không tìm thấy bảng 'User' để test đếm."
      );
    }
  } catch (error) {
    console.error("\n❌ KẾT NỐI THẤT BẠI:");
    console.error("---------------------------------------------------");
    console.error("Lỗi chi tiết:", error.message || error);
    console.error("---------------------------------------------------");
    console.error("👉 Gợi ý sửa lỗi:");
    console.error("1. Kiểm tra file .env xem mật khẩu/tên DB đúng chưa?");
    console.error("2. Đảm bảo PostgreSQL đang chạy.");
    console.error("3. Chạy `npx prisma generate` lại nếu vừa sửa schema.");
  } finally {
    // Đóng kết nối sau khi test xong
    await prisma.$disconnect();
  }
}

checkConnection();
