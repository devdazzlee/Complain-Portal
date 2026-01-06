/**
 * Example API services using the axios instance with interceptors
 * 
 * This file demonstrates how to use the api instance (from lib/api.ts)
 * throughout your application. The interceptors will automatically:
 * - Add the Bearer token to all requests
 * - Store tokens from responses
 * - Handle 401 errors and redirect to login
 * 
 * Import and use these services in your components:
 * 
 * import { complaintService } from '@/lib/services';
 * 
 * const complaints = await complaintService.getAll();
 */

import api from './api';

// Complaints Service
export const complaintService = {
  /**
   * Get all complaints
   * @param title - Optional search query parameter for filtering by title
   */
  async getAll(title?: string) {
    const params = title ? { title } : {};
    const response = await api.get('all-complaints', { params });
    return response.data;
  },

  /**
   * Get a single complaint by ID
   */
  async getById(complaintId: string | number) {
    // Since API doesn't have a single complaint endpoint, 
    // we'll fetch all and find the one we need
    const response = await api.get('all-complaints');
    const complaints = response.data?.complaints || response.data?.payload || response.data?.data || response.data;
    const complaintsList = Array.isArray(complaints) ? complaints : [];
    
    // Handle both numeric ID and "CMP-X" format
    let numericId: number;
    if (typeof complaintId === 'string') {
      numericId = parseInt(complaintId.replace('CMP-', ''));
    } else {
      numericId = complaintId;
    }
    
    const complaint = complaintsList.find((c: Record<string, unknown>) => {
      const cId = c.id as number;
      return cId === numericId || cId === complaintId || String(cId) === String(complaintId);
    });
    
    return complaint ? { complaint } : { complaint: null };
  },

  /**
   * Add a new complaint
   */
  async add(complaintData: FormData) {
    const response = await api.post('add-complaint', complaintData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update a complaint (with FormData for file uploads)
   */
  async update(complaintData: FormData) {
    const response = await api.post('update-complaint', complaintData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete a complaint
   */
  async delete(complaintId: number) {
    const response = await api.post('delete-complaint', {
      complaint_id: complaintId,
    });
    return response.data;
  },

  /**
   * Advanced search complaints
   */
  async search(filters: {
    general_search?: string;
    status_id?: number;
    priority_id?: number;
    type_id?: number;
    starting_date?: string;
    end_date?: string;
    sort_by?: number;
  }) {
    const response = await api.post('advance-search-complaints', filters);
    return response.data;
  },

  /**
   * Get complaint report
   * @param startDate - Date string in YYYY-MM-DD format
   * @param endDate - Date string in YYYY-MM-DD format
   * @returns Report data from API
   */
  async getReport(startDate: string, endDate: string) {
    // Convert YYYY-MM-DD to YYYY-MM-DD HH:mm:ss format
    const startingDate = `${startDate} 00:00:00`;
    const endingDate = `${endDate} 23:59:59`;
    
    const response = await api.post('report-complaints', {
      starting_date: startingDate,
      end_date: endingDate,
    });
    return response.data;
  },

  /**
   * Get all complaint statuses
   */
  async getStatuses() {
    const response = await api.get('all-statuses');
    return response.data;
  },

  /**
   * Get all complaint types
   */
  async getTypes() {
    const response = await api.get('all-types');
    // API returns { status: true, message: "all Types.", types: [...] }
    const types = response.data?.types || response.data?.payload || response.data?.data || response.data || [];
    return Array.isArray(types) ? types : [];
  },

  /**
   * Add a new type
   */
  async addType(name: string) {
    const response = await api.post('add-type', { name });
    return response.data;
  },

  /**
   * Get all complaint priorities
   */
  async getPriorities() {
    const response = await api.get('all-priorities');
    // API returns { status: true, message: "all Priorities.", priorities: [...] }
    const priorities = response.data?.priorities || response.data?.data || response.data || [];
    return Array.isArray(priorities) ? priorities : [];
  },

  /**
   * Get all sort by options
   */
  async getSortByOptions() {
    const response = await api.get('sort_by');
    return response.data;
  },

  /**
   * Get all open complaints
   */
  async getOpenComplaints() {
    const response = await api.get('all-open-complaints');
    return response.data;
  },

  /**
   * Get all pending complaints
   */
  async getPendingComplaints() {
    const response = await api.get('all-pending-complaints');
    return response.data;
  },

  /**
   * Get all resolved complaints
   */
  async getResolvedComplaints() {
    const response = await api.get('all-resolved-complaints');
    return response.data;
  },

  /**
   * Get all refused complaints
   */
  async getRefusedComplaints() {
    const response = await api.get('all-refused-complaints');
    return response.data;
  },
};

// Notifications Service
export const notificationService = {
  /**
   * Get all notifications
   * @param title - Optional search query parameter for filtering by title
   */
  async getAll(title?: string) {
    const params = title ? { title } : {};
    const response = await api.get('all-notifications', { params });
    return response.data;
  },

  /**
   * Add a notification
   */
  async add(title: string, body: string) {
    const response = await api.post('store-notification', {
      title,
      body,
    });
    return response.data;
  },

  /**
   * Delete a notification
   */
  async delete(notificationId: number) {
    const response = await api.post('delete-notification', {
      notification_id: notificationId,
    });
    return response.data;
  },

  /**
   * Mark notification as read (if API supports it)
   * Note: If API doesn't support this, we'll handle it client-side
   */
  async markAsRead(notificationId: number) {
    // If API has a mark-as-read endpoint, uncomment and use:
    // const response = await api.post('mark-notification-read', {
    //   notification_id: notificationId,
    // });
    // return response.data;
    
    // For now, return success (handled client-side)
    return { status: true, message: 'Notification marked as read' };
  },
};

// Dashboard Service
export const dashboardService = {
  /**
   * Get dashboard stats
   */
  async getStats() {
    const response = await api.get('dashboard_states');
    return response.data;
  },

  /**
   * Get all roles
   */
  async getRoles() {
    const response = await api.get('all-roles');
    return response.data;
  },

  /**
   * Get all users
   */
  async getUsers(name?: string) {
    const params = name ? { name } : {};
    const response = await api.get('all-users', { params });
    return response.data;
  },

  /**
   * Update user
   */
  async updateUser(userId: number, updates: {
    email?: string;
    role_id?: number;
  }) {
    const response = await api.post('update-list-user', {
      user_id: userId,
      ...updates,
    });
    return response.data;
  },
};

// User Management Service
export const userManagementService = {
  /**
   * Get all users (with optional name filter)
   */
  async getAllUsers(name?: string) {
    const params = name ? { name } : {};
    const response = await api.get('all-users', { params });
    return response.data;
  },

  /**
   * Get all roles
   */
  async getAllRoles() {
    const response = await api.get('all-roles');
    return response.data;
  },

  /**
   * Update user
   * Note: Based on API documentation, update-list-user only accepts: user_id, email, role_id
   * Name fields are not supported by this endpoint
   */
  async updateUser(userId: number, updates: {
    email?: string | null;
    role_id?: number;
  }) {
    const response = await api.post('update-list-user', {
      user_id: userId,
      ...updates,
    });
    return response.data;
  },

  /**
   * Delete user (if API supports it)
   */
  async deleteUser(userId: number) {
    // If API has delete endpoint, uncomment:
    // const response = await api.post('delete-user', { user_id: userId });
    // return response.data;
    
    // For now, return success (handled client-side if needed)
    return { status: true, message: 'User deleted successfully' };
  },

  /**
   * Get all users with no limit
   */
  async getAllUsersNoLimit() {
    const response = await api.get('all-users-no-limit');
    return response.data;
  },

  /**
   * Get all admins
   */
  async getAllAdmins() {
    const response = await api.get('all-users', { params: { admins: 1 } });
    return response.data;
  },

  /**
   * Get all providers
   */
  async getAllProviders() {
    const response = await api.get('all-users', { params: { providers: 1 } });
    return response.data;
  },
};

// Example: Settings Service
export const settingsService = {
  /**
   * Get settings
   */
  async get() {
    const response = await api.get('settings');
    return response.data;
  },

  /**
   * Update settings
   */
  async update(settings: {
    email_notifications?: number;
    sms_notifications?: number;
  }) {
    const response = await api.post('update-setting', settings);
    return response.data;
  },
};

// DSWs Service
export const dswService = {
  /**
   * Get all DSWs
   * @param title - Optional search query parameter for filtering by title
   */
  async getAll(title?: string) {
    const params = title ? { title } : {};
    const response = await api.get('all-dsws', { params });
    // API returns { status: true, message: "all DSWs.", workers: [...] }
    const dsws = response.data?.workers || response.data?.dsws || response.data?.data || response.data || [];
    return Array.isArray(dsws) ? dsws : [];
  },
};

// Example: Providers Service
export const providerService = {
  /**
   * Get all providers
   */
  async getAll() {
    const response = await api.get('all-providers');
    return response.data;
  },
};

// Clients Service
export const clientService = {
  /**
   * Get all clients
   * @param title - Optional search query parameter for filtering by title
   */
  async getAll(title?: string) {
    const params = title ? { title } : {};
    const response = await api.get('all-clients', { params });
    const clients = response.data?.clients || response.data?.data || response.data || [];
    return Array.isArray(clients) ? clients : [];
  },
};

// Assignment Workflow Service
export const assignmentService = {
  /**
   * Get assigned complaints (complaints assigned to other providers)
   */
  async getAssignedComplaints() {
    const response = await api.get('assigned-to-other-complaints');
    const complaints = response.data?.complaints || response.data?.data || response.data;
    
    // Handle different response structures
    if (Array.isArray(complaints)) {
      return complaints;
    } else if (complaints && typeof complaints === 'object') {
      // If complaints is an object (like { "0": {...}, "1": {...} }), convert to array
      return Object.values(complaints);
    }
    
    return [];
  },

  /**
   * Get unassigned complaints (complaints with status "open")
   * Note: Shows all open complaints for assignment workflow
   */
  async getUnassignedComplaints() {
    const response = await api.get('all-complaints');
    const complaints = response.data?.complaints || response.data?.data || [];
    const complaintsList = Array.isArray(complaints) ? complaints : [];
    
    // Filter for open complaints (can be assigned/reassigned)
    // Check the latest history entry for status
    return complaintsList.filter((c: Record<string, unknown>) => {
      const history = c.history as Array<Record<string, unknown>> | undefined;
      if (!history || history.length === 0) {
        // If no history, consider it open/unassigned
        return true;
      }
      
      const latestHistory = history[history.length - 1];
      const status = latestHistory?.status as Record<string, unknown> | undefined;
      const statusCode = status?.code as string | undefined;
      
      // Show complaints with status "open" (can be assigned or reassigned)
      return statusCode === 'open';
    });
  },

  /**
   * Get all providers (users with provider or admin role)
   */
  async getProviders() {
    const response = await api.get('all-providers');
    const providers = response.data?.providers || response.data?.data || [];
    return Array.isArray(providers) ? providers : [];
  },

  /**
   * Assign complaint to a provider/handler
   * Uses process-complaint endpoint with current_handler_id
   */
  async assignComplaint(complaintId: number, handlerId: number, remarks?: string) {
    const response = await api.post('process-complaint', {
      complaint_id: complaintId,
      current_handler_id: handlerId,
      status_id: 1, // Keep status as "open" when assigning
      remarks: remarks || `Complaint assigned to handler ${handlerId}`,
    });
    return response.data;
  },
};

// Comment Service
export const commentService = {
  /**
   * Add a comment to a complaint
   */
  async addComment(complaintId: string | number, commentBy: number, comment: string) {
    const formData = new FormData();
    formData.append('complaint_id', String(complaintId));
    formData.append('comment_by', String(commentBy));
    formData.append('comment', comment);

    const response = await api.post('add-complaint-comment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get all comments for complaints
   */
  async getComments() {
    const response = await api.post('get-user-comments');
    return response.data;
  },

  /**
   * Update a comment
   */
  async updateComment(complaintId: string | number, commentBy: number, comment: string) {
    const formData = new FormData();
    formData.append('complaint_id', String(complaintId));
    formData.append('comment_by', String(commentBy));
    formData.append('comment', comment);

    const response = await api.post('update-complaint-comment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete a comment
   */
  async deleteComment(complaintId: string | number, commentBy: number) {
    const formData = new FormData();
    formData.append('complaint_id', String(complaintId));
    formData.append('comment_by', String(commentBy));

    const response = await api.post('delete-complaint-comment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

