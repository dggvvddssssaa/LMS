const UserRepository = require('../repositories/UserRepository');
const bcrypt = require('bcrypt');
const { normalizeRole } = require('../utils/roles');

class UserService {
  async getUserProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateProfile(userId, data) {
    const allowed = {};
    if (data.name !== undefined) allowed.name = data.name;
    if (data.phone !== undefined) allowed.phone = data.phone;
    if (data.bio !== undefined) allowed.bio = data.bio;
    if (data.avatar !== undefined) allowed.avatar = data.avatar;
    return UserRepository.update(userId, allowed);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserRepository.findByIdWithPassword(userId);
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng');

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserRepository.update(userId, { password: hashed });
    return { message: 'Đã đổi mật khẩu thành công' };
  }

  async getAllUsers() {
    return await UserRepository.findAllUsers();
  }

  async verifyInstructor(userId) {
    const id = Number(userId);
    const user = await UserRepository.findById(id);
    if (!user) throw new Error('User not found');

    return await UserRepository.updateRoleAndVerification(id, 'instructor', true);
  }

  async createUser(userData) {
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(userData.password || '123456', 10);
    const userToCreate = {
      ...userData,
      password: hashedPassword,
      role: normalizeRole(userData.role || 'student')
    };

    const newUser = await UserRepository.create(userToCreate);
    // remove password
    delete newUser.password;
    return newUser;
  }

  async getUserDetails(userId) {
    const details = await UserRepository.getUserDetails(userId);
    if (!details) throw new Error('User not found');
    return details;
  }

  async deleteUser(userId) {
    const id = Number(userId);
    const user = await UserRepository.findById(id);
    if (!user) throw new Error('User not found');
    await UserRepository.deleteById(id);
  }

  async giftCourse(userId, courseIds) {
    const prisma = require('../config/prisma');
    
    // Check user
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error('User not found');

    // Filter out invalid IDs
    const validIds = courseIds.map(id => Number(id)).filter(id => !isNaN(id));
    if (validIds.length === 0) throw new Error('No valid course IDs provided');

    // Check courses
    const courses = await prisma.course.findMany({ where: { id: { in: validIds } } });
    if (courses.length === 0) throw new Error('No valid courses found');

    // Transaction
    await prisma.$transaction(async (tx) => {
      for (const course of courses) {
        // Check existing enrollment
        const existing = await tx.enrollment.findUnique({
          where: { student_id_course_id: { student_id: Number(userId), course_id: course.id } }
        });

        if (existing) {
          if (existing.status !== 'active') {
            await tx.enrollment.update({
              where: { id: existing.id },
              data: { status: 'active', enrolled_at: new Date() }
            });
          }
        } else {
          await tx.enrollment.create({
            data: {
              student_id: Number(userId),
              course_id: course.id,
              status: 'active',
              progress: 0,
              enrolled_at: new Date()
            }
          });
        }

        // Create notification
        await tx.notifications.create({
          data: {
            user_id: Number(userId),
            message: `Bạn đã được hệ thống tặng khóa học "${course.title}". Chúc bạn học tốt!`,
            type: 'gift',
            is_read: false
          }
        });
      }
    });
  }
}

module.exports = new UserService();
