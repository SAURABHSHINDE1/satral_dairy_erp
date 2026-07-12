const express    = require('express');
const router     = express.Router();
const pouchWeighingController = require('../controllers/pouchWeighing.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const CAN_WRITE = ['admin', 'quality_incharge', 'lab_incharge', 'qc_manager'];

router.use(authenticate);

// GET all sessions (filter by ?date=) — all authenticated users
router.get('/',    pouchWeighingController.getSessions);

// GET single session by id
router.get('/:id', pouchWeighingController.getSessionById);

// POST create full session (heads + readings) — quality roles
router.post('/',    authorize(...CAN_WRITE), pouchWeighingController.createSession);

// PUT update session (replaces heads + readings) — quality roles
router.put('/:id', authorize(...CAN_WRITE), pouchWeighingController.updateSession);

// DELETE session — quality roles
router.delete('/:id', authorize(...CAN_WRITE), pouchWeighingController.deleteSession);

module.exports = router;
