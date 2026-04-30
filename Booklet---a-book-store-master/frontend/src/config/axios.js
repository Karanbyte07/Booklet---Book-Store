import axios from 'axios';

// Create axios instance with base URL
const axiosInstance = axios.create({
  // Use same-origin/proxy by default so ngrok frontend URLs can reach backend via CRA proxy.
  baseURL: process.env.REACT_APP_API_URL || "",
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const auth = localStorage.getItem('auth');
    if (auth) {
      const authData = JSON.parse(auth);
      if (authData.token) {
        config.headers.Authorization = authData.token;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
