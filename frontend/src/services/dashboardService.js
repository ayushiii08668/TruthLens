import api from './api';

export const dashboardService = {
  async getStats() {
    const res = await api.get('/dashboard/stats');
    return res.data; // { totalInvestigations, totalReports, averageConfidence, verdicts, inputTypes }
  },

  async getRecent(params = {}) {
    const res = await api.get('/dashboard/recent', { params });
    return res.data; // { recentInvestigations, recentReports, activityTimeline }
  }
};

export default dashboardService;

