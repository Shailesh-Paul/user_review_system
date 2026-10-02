import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error?.response) {
    return 'Unable to reach the server. Check your connection and try again.';
  }
  const { status, data } = error.response;
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (status >= 500) {
    return 'Server error. Please try again later.';
  }
  return fallback;
};

// Response Interceptor: Uniform error handling & 401 token cleanup
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default api;
