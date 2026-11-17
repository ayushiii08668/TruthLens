import api from './api';

export const investigationService = {
  async createInvestigation({ originalInput, inputType = 'text', imageFile = null, caption = '', title = null }) {
    if (inputType === 'image' && imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('inputType', 'image');
      formData.append('caption', caption || originalInput || '');
      formData.append('originalInput', originalInput || caption || imageFile.name);

      const res = await api.post('/investigations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    }

    const payload = { originalInput, inputType };
    if (title) payload.title = title;

    const res = await api.post('/investigations', payload);
    return res.data; // { investigation, reports }
  },

  async getInvestigations({ page = 1, limit = 10, status, inputType } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    if (inputType) params.inputType = inputType;
    const res = await api.get('/investigations', { params });
    return res; // { success, message, data: { investigations }, pagination }
  },

  async getInvestigationById(id) {
    const res = await api.get(`/investigations/${id}`);
    return res.data; // { investigation, reports }
  },

  async deleteInvestigation(id) {
    const res = await api.delete(`/investigations/${id}`);
    return res;
  }
};

export default investigationService;
