const express = require('express');
const router = express.Router();
const investigationController = require('../controllers/investigationController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { createInvestigationValidator } = require('../validators/investigationValidators');

/**
 * @swagger
 * tags:
 *   name: Investigations
 *   description: Create and manage information verification investigations
 */

router.use(protect);

router.post('/', upload.single('image'), createInvestigationValidator, validate, investigationController.createInvestigation);
router.get('/', investigationController.getInvestigations);
router.get('/:id', investigationController.getInvestigationById);
router.delete('/:id', investigationController.deleteInvestigation);

module.exports = router;

