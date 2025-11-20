import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Content API
export const contentAPI = {
  getContent: async (skip = 0, limit = 20) => {
    const response = await api.get(`/api/content?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getContentById: async (id) => {
    const response = await api.get(`/api/content/${id}`);
    return response.data;
  },

  createContent: async (contentData) => {
    const formData = new FormData();
    formData.append('title', contentData.title);
    formData.append('description', contentData.description);
    formData.append('file', contentData.file);

    const response = await api.post('/api/content', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Payment API
export const paymentAPI = {
  initiatePayment: async (paymentData) => {
    const response = await api.post('/api/payments/initiate', paymentData);
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getCreatorDashboard: async () => {
    const response = await api.get('/api/dashboard/creator');
    return response.data;
  },

  getUserDashboard: async () => {
    const response = await api.get('/api/dashboard/user');
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getWeeklyEarnings: async (weekStart) => {
    const response = await api.get(`/api/admin/weekly-earnings?week_start=${weekStart}`);
    return response.data;
  },

  exportEarnings: async (weekStart) => {
    const response = await api.get(`/api/admin/export-earnings?week_start=${weekStart}`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `earnings_${weekStart}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default api;
