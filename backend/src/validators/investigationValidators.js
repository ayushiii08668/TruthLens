const { body } = require('express-validator');

const createInvestigationValidator = [
  body('originalInput')
    .custom((val, { req }) => {
      if (req.file && (!val || val.trim().length === 0)) {
        req.body.originalInput = req.body.caption || req.file.originalname;
        return true;
      }
      if (!val || typeof val !== 'string' || val.trim().length < 3) {
        throw new Error('Original input content is required and must be at least 3 characters long');
      }
      return true;
    }),
  body('inputType')
    .notEmpty().withMessage('Input type is required')
    .isIn(['text', 'headline', 'url', 'image']).withMessage('Input type must be one of: text, headline, url, image')
];

module.exports = {
  createInvestigationValidator
};
