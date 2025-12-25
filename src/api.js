// api.js - Create this file in your src folder
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'https://api.xlitecore.xdialnetworks.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
    accept: 'application/json',
  },
});

// Request interceptor - automatically attaches token to all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage or sessionStorage
    const token = 
      localStorage.getItem('access_token') || 
      sessionStorage.getItem('access_token');
    
    // If token exists, add it to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors globally
api.interceptors.response.use(
  (response) => {
    // If response is successful, just return it
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // 401 Unauthorized - token expired or invalid
      if (error.response.status === 401) {
        // Clear stored tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        sessionStorage.clear();
        
        // Redirect to login
        window.location.href = '/';
      }
      
      // 403 Forbidden
      if (error.response.status === 403) {
        console.error('Access denied');
        // Optionally redirect or show error message
      }
      
      // 404 Not Found
      if (error.response.status === 404) {
        console.error('Resource not found');
      }
      
      // 500 Server Error
      if (error.response.status >= 500) {
        console.error('Server error occurred');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response from server');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;