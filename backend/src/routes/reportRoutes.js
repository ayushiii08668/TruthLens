const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Verification reports, bookmarking, and public sharing
 */

// Public route for shared reports (safe public share ID, no JWT required)
router.get('/public/:shareId', reportController.getPublicReport);

router.use(protect);

router.get('/saved', reportController.getSavedReports);
router.get('/:id', reportController.getReportById);
router.post('/:id/save', reportController.saveReport);
router.delete('/:id/save', reportController.unsaveReport);
router.patch('/:id/share', reportController.toggleShareReport);

module.exports = router;

