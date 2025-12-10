// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "secret";

// 1. Kiểm tra đăng nhập
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1]; // Bearer <token>

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // Lưu thông tin user vào request để dùng sau
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token." });
  }
};

// 2. Kiểm tra quyền (Role)
// Ví dụ dùng: checkRole(['INSTRUCTOR', 'ADMIN'])
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          error: "Permission denied. You are not " + roles.join(" or "),
        });
    }
    next();
  };
};

module.exports = { authenticate, checkRole };
