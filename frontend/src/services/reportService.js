import api from './api';

export const reportService = {
  async getReportById(id) {
    const res = await api.get(`/reports/${id}`);
    return res.data; // { report, isSaved }
  },

  async saveReport(id) {
    const res = await api.post(`/reports/${id}/save`);
    return res.data; // { savedReport }
  },

  async unsaveReport(id) {
    const res = await api.delete(`/reports/${id}/save`);
    return res;
  },

  async getSavedReports({ page = 1, limit = 10 } = {}) {
    const res = await api.get('/reports/saved', { params: { page, limit } });
    return res; // { success, message, data: { reports }, pagination }
  },

  async toggleShareReport(id, isPublic) {
    const res = await api.patch(`/reports/${id}/share`, { isPublic });
    return res.data; // { isPublic, shareId, sharedAt }
  },

  async getPublicReport(shareId) {
    const res = await api.get(`/reports/public/${shareId}`);
    return res.data; // { report }
  }
};

export default reportService;
