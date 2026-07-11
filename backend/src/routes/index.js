const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const tankRoutes = require('./tank.routes');
const reportRoutes = require('./report.routes');
const activityRoutes = require('./activity.routes');
const settingsRoutes = require('./settings.routes');
const finalProductRoutes = require('./finalProduct.routes');
const biProductRoutes = require('./biProduct.routes');
const rawBulkMilkRoutes = require('./rawBulkMilk.routes');
const packingMilkReportRoutes = require('./packingMilkReport.routes');
const milkTakenReportBiProductRoutes = require('./milkTakenReportBiProduct.routes');
const buttermilkAnalysisRecordRoutes = require('./buttermilkAnalysisRecord.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tank-records', tankRoutes);
router.use('/reports', reportRoutes);
router.use('/activities', activityRoutes);
router.use('/settings', settingsRoutes);
router.use('/final-product-records', finalProductRoutes);
router.use('/bi-product-reports', biProductRoutes);
router.use('/raw-bulk-milk-records', rawBulkMilkRoutes);
router.use('/packing-milk-reports', packingMilkReportRoutes);
router.use('/milk-taken-reports-bi-product', milkTakenReportBiProductRoutes);
router.use('/buttermilk-analysis-records', buttermilkAnalysisRecordRoutes);


router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
