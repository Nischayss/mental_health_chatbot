import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds for AI responses
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.message);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - the server took too long to respond');
    }
    
    if (!error.response) {
      throw new Error('Network error - please check your connection');
    }
    
    throw error;
  }
);

export const chatAPI = {
  sendMessage: async (message, responseType = 'training') => {
    try {
      const response = await api.post('/chat', {
        message,
        response_type: responseType,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to send message');
    }
  },

  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Backend health check failed');
    }
  },
};

export default api;