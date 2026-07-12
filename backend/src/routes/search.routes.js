const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', searchController.globalSearch);

module.exports = router;
