import api from './api';

export const authService = {
  async register(name, email, password, role = 'user') {
    const res = await api.post('/auth/register', { name, email, password, role });
    return res.data;
  },

  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async updateProfile(updates) {
    const res = await api.patch('/auth/profile', updates);
    return res.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
  },

  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token, password) {
    const res = await api.post(`/auth/reset-password/${token}`, { password });
    return res.data;
  }
};

export default authService;

