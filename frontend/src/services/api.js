import axios from 'axios';

// Resolve production vs local API base URL
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
};

// API client instance
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90 seconds for thorough AI multimodal & wire discovery
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('truthlens_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Extract server error message or fallback safely without [object Object]
    const serverErr = error.response?.data?.error;
    const message =
      (typeof serverErr === 'string' ? serverErr : serverErr?.message) ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    // If 401 Unauthorized and not already on auth request, optionally trigger clean logout
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      // Clear token if invalid/expired
      localStorage.removeItem('truthlens_token');
      localStorage.removeItem('truthlens_user');
      // Trigger a custom event so UI can react without hard reloading
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

