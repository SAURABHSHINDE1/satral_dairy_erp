const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const activityRepository = require('../repositories/activity.repository');

class UserService {
  async getAllUsers(filters = {}) {
    return await userRepository.findAll(filters);
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async createUser(userData) {
    const existingUser = await userRepository.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    if (userData.email) {
      // Check if email exists (you might want to add this to repository)
      const existingEmail = await userRepository.findByEmail(userData.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(userData.password, rounds);

    const userId = await userRepository.create({
      ...userData,
      password: hashedPassword
    });

    return await userRepository.findById(userId);
  }

  async updateUser(id, userData) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    if (userData.username && userData.username !== user.username) {
      const existingUser = await userRepository.findByUsername(userData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }
    }

    if (userData.password) {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
      userData.password = await bcrypt.hash(userData.password, rounds);
    }

    await userRepository.update(id, userData);
    return await userRepository.findById(id);
  }

  async deleteUser(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.username === 'admin') {
      throw new Error('Cannot delete admin user');
    }

    await userRepository.delete(id);
    return { message: 'User deleted successfully' };
  }

  async getUserStatistics() {
    const total = await userRepository.count();
    const admins = await userRepository.count({ role: 'admin' });
    const labIncharges = await userRepository.count({ role: 'lab_incharge' });
    const operators = await userRepository.count({ role: 'operator' });
    const active = await userRepository.count({ is_active: true });

    return {
      total,
      admins,
      labIncharges,
      operators,
      active,
      inactive: total - active
    };
  }
}

module.exports = new UserService();
