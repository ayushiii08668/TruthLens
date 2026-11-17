const mongoose = require('mongoose');

const InvestigationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  originalInput: {
    type: String,
    required: [true, 'Original input content is required'],
    trim: true
  },
  inputType: {
    type: String,
    enum: {
      values: ['text', 'headline', 'url', 'image'],
      message: '{VALUE} is not a valid input type'
    },
    required: [true, 'Input type is required']
  },
  extractedClaims: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: [
      'pending',
      'extracting_claims',
      'searching_evidence',
      'comparing_evidence',
      'generating_assessment',
      'completed',
      'failed'
    ],
    default: 'pending',
    index: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  shareId: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

InvestigationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Investigation', InvestigationSchema);
