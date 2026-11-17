const mongoose = require('mongoose');

const EvidenceSnippetSchema = new mongoose.Schema({
  title: { type: String, default: 'Archival Evidence' },
  quote: { type: String, required: true },
  sourceName: { type: String, required: true },
  sourceUrl: { type: String, required: true },
  publishDate: { type: String, default: null },
  sourceType: { type: String, default: 'Wire Service Reporting' },
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

const SourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  reliabilityTier: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'],
    default: 'MEDIUM'
  }
}, { _id: false });

const TimelineEventSchema = new mongoose.Schema({
  stage: { type: String, required: true },
  title: { type: String, required: true },
  status: { type: String, default: 'completed' },
  timestamp: { type: Date, default: Date.now },
  durationMs: { type: Number, default: 0 },
  detail: { type: String, default: '' }
}, { _id: false });

const VerificationReportSchema = new mongoose.Schema({
  investigationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investigation',
    required: [true, 'Investigation ID is required'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  claim: {
    type: String,
    required: [true, 'Claim text is required'],
    trim: true
  },
  verdict: {
    type: String,
    enum: {
      values: [
        'SUPPORTED',
        'MOSTLY SUPPORTED',
        'MISLEADING',
        'MOSTLY FALSE',
        'FALSE',
        'UNVERIFIED',
        'CONFLICTING EVIDENCE',
        'NOT A FACTUAL CLAIM',
        'TRUE',
        'MOSTLY_TRUE',
        'MIXED'
      ],
      message: '{VALUE} is not a valid verdict'
    },
    required: [true, 'Verdict is required']
  },
  confidence: {
    type: Number,
    default: 50,
    min: [0, 'Confidence must be at least 0'],
    max: [100, 'Confidence cannot exceed 100']
  },
  evidenceSufficiency: {
    type: String,
    enum: {
      values: ['Insufficient', 'Limited', 'Moderate', 'Strong', 'INSUFFICIENT', 'PARTIAL', 'SUFFICIENT'],
      message: '{VALUE} is not a valid evidence sufficiency rating'
    },
    default: 'Limited'
  },
  explanation: {
    type: String,
    required: [true, 'Explanation is required']
  },
  supportingEvidence: [EvidenceSnippetSchema],
  contradictingEvidence: [EvidenceSnippetSchema],
  neutralEvidence: [EvidenceSnippetSchema],
  sources: [SourceSchema],
  limitations: [{
    type: String
  }],
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
  sharedAt: {
    type: Date,
    default: null
  },
  timeline: [TimelineEventSchema]
}, {
  timestamps: true
});

VerificationReportSchema.index({ investigationId: 1, userId: 1 });
VerificationReportSchema.index({ verdict: 1 });
VerificationReportSchema.index({ isPublic: 1, shareId: 1 });

module.exports = mongoose.model('VerificationReport', VerificationReportSchema);
