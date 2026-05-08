const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const { normalizeRole } = require('../utils/roles');
const { getJwtSecret } = require('../utils/jwtSecret');

class AuthService {
  async register(userData) {
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const userToCreate = {
      ...userData,
      password: hashedPassword,
      role: normalizeRole(userData.role || 'student')
    };

    const newUser = await UserRepository.create(userToCreate);
    return this.generateAuthResponse(newUser);
  }

  async login(email, password) {
    // Assuming you need to fetch user including pass. Let's add findByEmailWithPassword in repo, 
    // but for now, we'll query directly if need password. Oh wait, findByEmail returns `*` so it has password.
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    return this.generateAuthResponse(user);
  }

  generateAuthResponse(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: normalizeRole(user.role)
    };

    const token = jwt.sign(payload, getJwtSecret(), {
      expiresIn: '24h'
    });

    // Remove password from returned user object
    delete user.password;
    user.role = normalizeRole(user.role);
    
    return {
      user,
      token
    };
  }
}

module.exports = new AuthService();
