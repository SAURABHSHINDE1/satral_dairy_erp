const authService = require('../services/auth.service');

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const result = await authService.login(username, password, ipAddress, userAgent);

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      await authService.logout(req.user.id, ipAddress, userAgent);

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      res.json({
        success: true,
        data: req.user
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current and new password are required' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }
      await authService.changePassword(req.user.userId, currentPassword, newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
