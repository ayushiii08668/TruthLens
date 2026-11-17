const { Investigation, VerificationReport, SavedReport } = require('../models');
const { sendSuccess } = require('../utils/response');

/**
 * Get dashboard verification statistics for the authenticated user
 * GET /api/dashboard/stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalInvestigations,
      totalReports,
      totalSavedReports,
      verdictAggregation,
      inputTypeAggregation
    ] = await Promise.all([
      Investigation.countDocuments({ userId }),
      VerificationReport.countDocuments({ userId }),
      SavedReport.countDocuments({ userId }),
      VerificationReport.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$verdict',
            count: { $sum: 1 },
            avgConfidence: { $avg: '$confidence' }
          }
        }
      ]),
      Investigation.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$inputType',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Format all 8 canonical verdicts + aliases
    const verdicts = {
      SUPPORTED: 0,
      MOSTLY_SUPPORTED: 0,
      MISLEADING: 0,
      MOSTLY_FALSE: 0,
      FALSE: 0,
      UNVERIFIED: 0,
      CONFLICTING_EVIDENCE: 0,
      NOT_A_FACTUAL_CLAIM: 0,
      TRUE: 0,
      MOSTLY_TRUE: 0,
      MIXED: 0
    };

    let totalConfidence = 0;
    let confidenceCount = 0;

    verdictAggregation.forEach(v => {
      const key = (v._id || '').replace(/\s+/g, '_').toUpperCase();
      if (verdicts[key] !== undefined) {
        verdicts[key] = v.count;
      } else {
        verdicts[v._id] = v.count;
      }
      if (v.avgConfidence) {
        totalConfidence += v.avgConfidence * v.count;
        confidenceCount += v.count;
      }
    });

    const averageConfidence = confidenceCount > 0 
      ? Math.round(totalConfidence / confidenceCount) 
      : 0;

    const inputTypes = {
      text: 0,
      headline: 0,
      url: 0,
      image: 0
    };

    inputTypeAggregation.forEach(t => {
      if (inputTypes[t._id] !== undefined) {
        inputTypes[t._id] = t.count;
      }
    });

    return sendSuccess(res, 200, 'Dashboard statistics retrieved', {
      totalInvestigations,
      totalReports,
      totalSavedReports,
      averageConfidence,
      verdicts,
      inputTypes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activity and chronological timeline stream
 * GET /api/dashboard/recent
 */
const getDashboardRecent = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));

    // Optional search query
    const invQuery = { userId };
    const repQuery = { userId };

    if (req.query.query) {
      const regex = new RegExp(req.query.query, 'i');
      invQuery.originalInput = regex;
      repQuery.claim = regex;
    }
    if (req.query.inputType) {
      invQuery.inputType = req.query.inputType;
    }
    if (req.query.verdict) {
      repQuery.verdict = req.query.verdict;
    }

    const [recentInvestigations, recentReports] = await Promise.all([
      Investigation.find(invQuery)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      VerificationReport.find(repQuery)
        .populate('investigationId', 'originalInput inputType metadata')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
    ]);

    // Synthesize chronological activity timeline
    const activityTimeline = [
      ...recentInvestigations.map(inv => ({
        id: inv._id,
        type: 'investigation_created',
        title: `Investigation: ${inv.originalInput.substring(0, 80)}`,
        status: inv.status,
        timestamp: inv.createdAt,
        inputType: inv.inputType
      })),
      ...recentReports.map(rep => ({
        id: rep._id,
        type: 'report_generated',
        title: `Dossier: ${rep.claim.substring(0, 80)}`,
        verdict: rep.verdict,
        confidence: rep.confidence,
        timestamp: rep.createdAt,
        investigationId: rep.investigationId?._id
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15);

    return sendSuccess(res, 200, 'Recent activity retrieved', {
      recentInvestigations,
      recentReports,
      activityTimeline
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getDashboardRecent
};
