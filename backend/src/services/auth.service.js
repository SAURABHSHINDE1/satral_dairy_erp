const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt.config');
const activityRepository = require('../repositories/activity.repository');
const notificationRepository = require('../repositories/notification.repository');

class AuthService {
  async login(username, password, ipAddress, userAgent) {
    const user = await userRepository.findByUsername(username);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate tokens
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Log activity
    await activityRepository.create({
      user_id: user.id,
      action: 'login',
      entity_type: 'auth',
      ip_address: ipAddress,
      user_agent: userAgent,
      details: 'User logged in'
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  }

  async refreshToken(refreshToken) {
    try {
      const { verifyRefreshToken } = require('../config/jwt.config');
      const decoded = verifyRefreshToken(refreshToken);

      const user = await userRepository.findById(decoded.userId);

      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      const payload = {
        userId: user.id,
        username: user.username,
        role: user.role
      };

      const accessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId, ipAddress, userAgent) {
    await activityRepository.create({
      user_id: userId,
      action: 'logout',
      entity_type: 'auth',
      ip_address: ipAddress,
      user_agent: userAgent,
      details: 'User logged out'
    });
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('Current password is incorrect');

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(newPassword, rounds);
    await userRepository.update(userId, { password: hashedPassword });
  }

  async createDefaultUsers() {
    const bcrypt = require('bcryptjs');
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;

    const users = [
      {
        username: 'admin',
        password: await bcrypt.hash('Admin@123', rounds),
        email: 'admin@satral.com',
        full_name: 'System Administrator',
        role: 'admin'
      },
      {
        username: 'lab',
        password: await bcrypt.hash('123456', rounds),
        email: 'lab@satral.com',
        full_name: 'Lab Incharge',
        role: 'lab_incharge'
      },
      {
        username: 'operator',
        password: await bcrypt.hash('123456', rounds),
        email: 'operator@satral.com',
        full_name: 'Process Operator',
        role: 'operator'
      }
    ];

    for (const user of users) {
      const existing = await userRepository.findByUsername(user.username);
      if (!existing) {
        await userRepository.create(user);
      }
    }
  }
}

module.exports = new AuthService();
