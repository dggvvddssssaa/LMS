const db = require('./src/config/db');

const seedTemplate = async () => {
  try {
    const layout = {
      orientation: "landscape",
      size: "A4",
      elements: [
        { type: "text", content: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", fontSize: 18, bold: true, align: "center", y: 40 },
        { type: "text", content: "Độc lập - Tự do - Hạnh phúc", fontSize: 14, bold: true, align: "center", y: 70 },
        { type: "line", width: 150, align: "center", y: 95 },
        { type: "text", content: "CHỨNG NHẬN HOÀN THÀNH KHÓA HỌC", fontSize: 32, bold: true, align: "center", color: "#1e3a8a", y: 150 },
        { type: "text", content: "Chứng nhận học viên:", fontSize: 16, align: "center", y: 220 },
        { type: "variable", name: "student_name", fontSize: 28, bold: true, align: "center", color: "#000000", y: 260 },
        { type: "text", content: "Đã hoàn thành xuất sắc khóa học:", fontSize: 16, align: "center", y: 320 },
        { type: "variable", name: "course_title", fontSize: 22, bold: true, align: "center", color: "#1e40af", y: 360 },
        { type: "text", content: "Ngày cấp: {{issued_date_text}}", fontSize: 14, align: "left", x: 100, y: 450 },
        { type: "text", content: "Mã xác minh: {{certificate_code}}", fontSize: 12, align: "left", x: 100, y: 480 },
        { type: "variable", name: "issuer_title", fontSize: 16, bold: true, align: "right", x: 700, y: 450 },
        { type: "variable", name: "issuer_name", fontSize: 16, bold: true, align: "right", x: 700, y: 550 },
      ]
    };

    const res = await db.query(
      `INSERT INTO certificate_templates (
        name, type, status, layout_json, issuer_name, issuer_title, background_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        'Mẫu Chứng Nhận Việt Nam Tiêu Chuẩn',
        'completion',
        'active',
        JSON.stringify(layout),
        'Giám Đốc Đào Tạo',
        'ĐẠI DIỆN TRUNG TÂM',
        'https://example.com/bg-certificate.png'
      ]
    );
    console.log('Seed template success:', res.rows[0].id);
    process.exit(0);
  } catch (err) {
    console.error('Seed template failed:', err);
    process.exit(1);
  }
};

seedTemplate();
