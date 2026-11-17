const mongoose = require('mongoose');

const EvidenceItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  quote: { type: String, required: true },
  sourceName: { type: String, required: true },
  sourceUrl: { type: String, required: true },
  publishDate: { type: String, default: null },
  credibilityTier: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'],
    default: 'MEDIUM'
  },
  stance: {
    type: String,
    enum: ['SUPPORTS', 'CONTRADICTS', 'NEUTRAL'],
    required: true
  },
  relevanceScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  }
}, { _id: false });

const ClaimVerificationSchema = new mongoose.Schema({
  investigationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investigation',
    required: true,
    index: true
  },
  claimText: {
    type: String,
    required: true,
    trim: true
  },
  claimContext: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['politics', 'science', 'economy', 'health', 'technology', 'general'],
    default: 'general'
  },
  verdict: {
    type: String,
    enum: ['TRUE', 'MOSTLY_TRUE', 'MIXED', 'MOSTLY_FALSE', 'FALSE', 'UNVERIFIED'],
    required: true
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  evidenceSufficiency: {
    type: String,
    enum: ['INSUFFICIENT', 'PARTIAL', 'SUFFICIENT'],
    required: true
  },
  explanation: {
    type: String,
    required: true
  },
  supportingEvidence: [EvidenceItemSchema],
  contradictingEvidence: [EvidenceItemSchema],
  uncertainties: [{
    type: String
  }],
  orderIndex: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ClaimVerification', ClaimVerificationSchema);

