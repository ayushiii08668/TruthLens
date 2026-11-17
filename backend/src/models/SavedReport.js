const mongoose = require('mongoose');

const SavedReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VerificationReport',
    required: [true, 'Report ID is required'],
    index: true
  }
}, {
  timestamps: true
});

// Ensure a user cannot save the same report more than once
SavedReportSchema.index({ userId: 1, reportId: 1 }, { unique: true });

module.exports = mongoose.model('SavedReport', SavedReportSchema);
