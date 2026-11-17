const crypto = require('crypto');
const { VerificationReport, SavedReport } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get single verification report by ID
 * GET /api/reports/:id
 */
const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await VerificationReport.findById(id).populate('investigationId').lean();
    if (!report) {
      return sendError(res, 404, 'Verification report not found.');
    }

    // Ownership check
    if (report.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 403, 'Access denied. You do not have permission to view this report.');
    }

    // Check if currently saved by user
    const isSaved = Boolean(await SavedReport.findOne({
      userId: req.user._id,
      reportId: id
    }));

    return sendSuccess(res, 200, 'Verification report retrieved', {
      report,
      isSaved
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save/Bookmark a report
 * POST /api/reports/:id/save
 */
const saveReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await VerificationReport.findById(id);
    if (!report) {
      return sendError(res, 404, 'Verification report not found.');
    }

    // Verify user has access to this report
    if (report.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 403, 'Access denied. You cannot save reports that do not belong to you.');
    }

    // Check if already saved
    const existingSave = await SavedReport.findOne({
      userId: req.user._id,
      reportId: id
    });

    if (existingSave) {
      return sendSuccess(res, 200, 'Report is already saved.', { savedReport: existingSave });
    }

    const savedReport = new SavedReport({
      userId: req.user._id,
      reportId: id
    });

    await savedReport.save();

    return sendSuccess(res, 201, 'Report saved successfully to bookmarks.', { savedReport });
  } catch (error) {
    next(error);
  }
};

/**
 * Unsave/Remove a bookmarked report
 * DELETE /api/reports/:id/save
 */
const unsaveReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await SavedReport.findOneAndDelete({
      userId: req.user._id,
      reportId: id
    });

    if (!deleted) {
      return sendError(res, 404, 'Report was not in your saved list.');
    }

    return sendSuccess(res, 200, 'Report removed from saved bookmarks.');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all saved reports for the authenticated user
 * GET /api/reports/saved
 */
const getSavedReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [savedList, total] = await Promise.all([
      SavedReport.find({ userId: req.user._id })
        .populate({
          path: 'reportId',
          populate: { path: 'investigationId' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SavedReport.countDocuments({ userId: req.user._id })
    ]);

    // Format output
    const reports = savedList
      .filter(item => item.reportId !== null)
      .map(item => ({
        savedId: item._id,
        savedAt: item.createdAt,
        ...item.reportId
      }));

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, 'Saved reports retrieved', {
      reports
    }, {
      page,
      limit,
      total,
      totalPages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle public sharing for a report
 * PATCH /api/reports/:id/share
 */
const toggleShareReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;

    const report = await VerificationReport.findById(id);
    if (!report) {
      return sendError(res, 404, 'Verification report not found.');
    }

    // Ownership check
    if (report.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 403, 'Access denied. You do not own this report.');
    }

    report.isPublic = Boolean(isPublic);
    if (report.isPublic) {
      if (!report.shareId) {
        report.shareId = `tl_${crypto.randomBytes(8).toString('hex')}`;
      }
      report.sharedAt = new Date();
    }
    await report.save();

    return sendSuccess(res, 200, `Report sharing ${report.isPublic ? 'enabled' : 'disabled'} successfully`, {
      isPublic: report.isPublic,
      shareId: report.shareId,
      sharedAt: report.sharedAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Access a publicly shared report
 * GET /api/reports/public/:shareId
 */
const getPublicReport = async (req, res, next) => {
  try {
    const { shareId } = req.params;

    const report = await VerificationReport.findOne({ shareId, isPublic: true })
      .populate('investigationId', 'originalInput inputType metadata createdAt')
      .lean();

    if (!report) {
      return sendError(res, 404, 'This verification report is private or does not exist.');
    }

    // Return sanitized public report (excluding user's private ID)
    const publicReport = {
      _id: report._id,
      shareId: report.shareId,
      claim: report.claim,
      verdict: report.verdict,
      confidence: report.confidence,
      evidenceSufficiency: report.evidenceSufficiency,
      explanation: report.explanation,
      supportingEvidence: report.supportingEvidence,
      contradictingEvidence: report.contradictingEvidence,
      neutralEvidence: report.neutralEvidence,
      sources: report.sources,
      limitations: report.limitations,
      timeline: report.timeline,
      investigation: report.investigationId,
      sharedAt: report.sharedAt,
      createdAt: report.createdAt
    };

    return sendSuccess(res, 200, 'Public verification report retrieved', {
      report: publicReport
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportById,
  saveReport,
  unsaveReport,
  getSavedReports,
  toggleShareReport,
  getPublicReport
};
