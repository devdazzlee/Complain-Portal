import api from './api';
import axios from 'axios';
import { backendUrl } from '../config/config';

export interface LoginRequest {
  app?: string;
  mobile_identifier?: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  messageLBL?: string | null;
  payload?: {
    id: number;
    username: string;
    email?: string | null;
    first_name: string;
    last_name?: string | null;
    role: 'admin' | 'provider';
    token: string;
    has_reset_default_password?: boolean;
    phone_number?: string;
    [key: string]: any;
  };
  requestId?: string;
  result: boolean;
  [key: string]: any;
}

// Create a simple axios instance for login - direct API call, no CSRF
const loginApi = axios.create({
  baseURL: backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  withCredentials: false, // No cookies needed for stateless API
});

export const authService = {
  /**
   * Login user with username and password
   * Simple direct API call - no CSRF cookies needed
   */
  async login(username: string, password: string, app: string = '', mobile_identifier: string = ''): Promise<LoginResponse> {
    const response = await loginApi.post<LoginResponse>('/login', {
      app,
      mobile_identifier,
      username,
      password,
    });
    
    // Store token immediately if present in response
    if (response.data?.payload?.token) {
      localStorage.setItem('auth_token', response.data.payload.token);
    }
    
    return response.data;
  },

  /**
   * Get current user details
   */
  async getCurrentUser(): Promise<any> {
    const response = await api.get('user');
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    dob?: string;
  }): Promise<any> {
    // Map phone to contact_number_1 if needed, or keep as phone
    const payload: Record<string, unknown> = {
      first_name: updates.first_name,
      last_name: updates.last_name,
      email: updates.email,
      phone: updates.phone, // API might accept 'phone' or 'contact_number_1'
      dob: updates.dob,
    };
    
    const response = await api.post('user-update', payload);
    return response.data;
  },

  /**
   * Update password
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<any> {
    const response = await api.post('user-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  /**
   * Forgot password - Request password reset
   * Sends reset instructions to email/username
   */
  async forgotPassword(emailOrUsername: string): Promise<any> {
    const response = await loginApi.post('user-password', {
      email: emailOrUsername,
      username: emailOrUsername,
    });
    return response.data;
  },

  /**
   * Logout - clear token from localStorage
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('currentUser');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    // Check if token is expired
    const expiry = localStorage.getItem('token_expiry');
    if (expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() >= expiryTime) {
        this.logout();
        return false;
      }
    }

    return true;
  },

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};

