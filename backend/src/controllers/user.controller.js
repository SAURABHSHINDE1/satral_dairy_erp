const userService = require('../services/user.service');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const filters = {
        role: req.query.role,
        is_active: req.query.is_active,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const users = await userService.getAllUsers(filters);

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserStatistics(req, res, next) {
    try {
      const stats = await userService.getUserStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
