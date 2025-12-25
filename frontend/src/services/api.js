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

// Add these new API functions after chatAPI
export const authAPI = {
  // Check if email already exists
  checkEmail: async (email) => {
    try {
      const response = await api.post('/auth/check-email', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to check email');
    }
  },

  // Send verification code to email
  sendVerification: async (email) => {
    try {
      const response = await api.post('/auth/send-verification', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to send verification code');
    }
  },

  // Verify the code
  verifyCode: async (email, code) => {
    try {
      const response = await api.post('/auth/verify-code', { email, code });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Invalid verification code');
    }
  },

  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  // Signup (requires verified email)
  signup: async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Signup failed');
    }
  },
};

export default api;