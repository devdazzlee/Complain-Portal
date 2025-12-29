import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { backendUrl } from '../config/config';

// Create axios instance
// Using stateless API authentication with Bearer tokens (no CSRF required)
const api: AxiosInstance = axios.create({
  baseURL: backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
    'X-Requested-With': 'XMLHttpRequest', // Helps Laravel identify AJAX requests
  },
  // Don't use withCredentials for API routes - we're using Bearer token auth, not cookie-based
  withCredentials: false,
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Get CSRF token from meta tag or cookie if available
    // Laravel typically sets CSRF token in a meta tag or cookie
    if (typeof document !== 'undefined') {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
                       getCookie('XSRF-TOKEN');
      
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
      }
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Helper function to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Response interceptor - Handle token storage and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle token from different response structures
    let token: string | null = null;
    
    // Check for token in payload (new structure)
    if (response.data?.payload?.token) {
      token = response.data.payload.token;
    }
    // Check for token at root level (old structure)
    else if (response.data?.access_token || response.data?.token) {
      token = response.data.access_token || response.data.token;
    }
    
    if (token) {
      localStorage.setItem('auth_token', token);
      
      // Store token expiry if provided
      if (response.data.expires_in) {
        const expiryTime = Date.now() + (response.data.expires_in * 1000);
        localStorage.setItem('token_expiry', expiryTime.toString());
      }
    }
    
    return response;
  },
  (error: AxiosError) => {
    // Log error details for debugging
    if (error.config) {
      console.error('API Error:', {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('currentUser');
      
      // Only redirect if we're not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle 419 CSRF Token Mismatch
    if (error.response?.status === 419) {
      console.warn('CSRF token mismatch. This might require backend configuration changes.');
      // For API routes, CSRF should typically be disabled
      // If this persists, the backend needs to exclude API routes from CSRF verification
    }
    
    return Promise.reject(error);
  }
);

export default api;

