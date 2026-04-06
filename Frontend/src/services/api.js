// src/services/api.js
import axios from 'axios';

export let API_BASE_URL = 'http://127.0.0.1:8000/iti-web/api'; // default for local

if (typeof window !== 'undefined') {
  const origin = window.location.origin;

  // UAT domain
  if (origin.includes('uat.spairyx.com')) {
    API_BASE_URL = 'https://uat.spairyx.com/iti-web/api';
  }

}

// Central axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if 401 AND it's not the login request itself
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config.url && error.config.url.includes('/auth/login');

      if (!isLoginRequest) {
        sessionStorage.clear();
        window.location.href = '/iti/'; // keep your existing redirect
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Function to get full upload URL
export const getUploadUrl = (path) => {
  if (!path) return '';

  // If the backend already sent a full URL, just return it
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Normalise leading slash
  const cleanPath = String(path).replace(/^\/+/, '');

  // Base origin, e.g. "http://127.0.0.1:8000"
  const origin = API_BASE_URL.split('/iti-web/api')[0];

  // If backend already prefixed with "uploads" or "media", don't double it
  if (cleanPath.startsWith('uploads/') || cleanPath.startsWith('media/')) {
    return `${origin}/${cleanPath}`;
  }

  // Default: map the API base to the uploads directory and append the relative path
  return `${origin}/uploads/${cleanPath}`;
};
