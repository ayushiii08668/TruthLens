import axios from 'axios';

// Resolve production vs local API base URL
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || import.meta.env.BACKEND_URL;
  if (!envUrl) return '/api';
  return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
};

// API client instance
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 120 seconds buffer for cloud cold-starts and deep multimodal wire discovery
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
    // Helpful diagnostic if Vercel static host receives API call due to missing VITE_API_URL
    if (error.response?.status === 405) {
      return Promise.reject(new Error(
        'Backend service not connected (HTTP 405). Please configure VITE_API_URL in your Vercel Project Settings with your deployed Render backend URL, then redeploy.'
      ));
    }

    if (error.code === 'ERR_NETWORK') {
      return Promise.reject(new Error(
        'Cannot connect to backend server. Please verify your Render service is running and VITE_API_URL is configured correctly.'
      ));
    }

    if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
      return Promise.reject(new Error(
        'Verification timed out. Render free tier may be cold-starting the Python AI container (~30s). Please try your verification again now that the container is awake!'
      ));
    }

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

