const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: User analytics, verification metrics, and recent activities
 */

router.use(protect);

router.get('/stats', dashboardController.getDashboardStats);
router.get('/recent', dashboardController.getDashboardRecent);

module.exports = router;

