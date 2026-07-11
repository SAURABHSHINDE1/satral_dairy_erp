const express = require('express');
const router = express.Router();
const settingsRepository = require('../repositories/settings.repository');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// GET all settings (all authenticated users)
router.get('/', async (req, res, next) => {
  try {
    const settings = await settingsRepository.findAll();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// PUT update a setting (admin only)
router.put('/:key', authorize('admin'), async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const setting = await settingsRepository.upsert(key, value, req.user.userId);
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
