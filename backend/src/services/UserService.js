const UserRepository = require('../repositories/UserRepository');
const bcrypt = require('bcrypt');
const { normalizeRole } = require('../utils/roles');

class UserService {
  async getUserProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  async getAllUsers() {
    return await UserRepository.findAllUsers();
  }

  async verifyInstructor(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error('User not found');

    return await UserRepository.updateRoleAndVerification(userId, 'instructor', true);
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
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error('User not found');
    await UserRepository.deleteById(userId);
  }
}

module.exports = new UserService();
