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

// Submit session (all quality roles can submit)
router.put('/:id/submit', authorize(...CAN_WRITE), pouchWeighingController.submitSession);

// Lab approval
router.post('/:id/approve-lab', authorize('lab_incharge', 'quality_incharge', 'admin'), pouchWeighingController.approveByLab);
router.post('/:id/reject-lab', authorize('lab_incharge', 'quality_incharge', 'admin'), pouchWeighingController.rejectByLab);

// Admin approval
router.post('/:id/approve-admin', authorize('admin'), pouchWeighingController.approveByAdmin);
router.post('/:id/reject-admin', authorize('admin'), pouchWeighingController.rejectByAdmin);

module.exports = router;
