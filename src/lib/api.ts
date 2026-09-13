import axios from 'axios';

// Create a custom Axios instance
const api = axios.create({
  // Point this to your C# backend URL. E.g., http://localhost:5056/api
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5056/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Before every request, attach the JWT token if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
