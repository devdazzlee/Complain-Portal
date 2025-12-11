export type UserRole = 'provider' | 'admin';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

export type ComplaintStatus = 'Open' | 'In Progress' | 'Closed' | 'Refused';
export type ProblemType = 'Late arrival' | 'Behavior' | 'Missed service' | 'Other';
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type ComplaintCategory = 'Service Quality' | 'Staff Behavior' | 'Timing Issues' | 'Safety Concerns' | 'Billing' | 'Other';

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  complaintId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  message: string;
  isInternal: boolean; // Internal notes for provider/admin only
  mentions?: string[]; // User IDs mentioned
  attachments?: FileAttachment[];
  createdAt: string;
  updatedAt?: string;
}

export interface Complaint {
  id: string;
  complaintId: string;
  caretaker: string;
  typeOfProblem: ProblemType;
  category?: ComplaintCategory;
  description: string;
  photo?: string;
  attachments?: FileAttachment[];
  status: ComplaintStatus;
  priority: Priority;
  tags?: string[];
  dateSubmitted: string;
  lastUpdate: string;
  assignedTo?: string;
  assignedToId?: string;
  dueDate?: string;
  responseTime?: number; // in hours
  resolutionTime?: number; // in hours
  timeline: ComplaintTimelineItem[];
  comments?: Comment[];
  complianceSummary?: ComplianceSummary;
  resolutionSummary?: string;
  complianceStatement?: string;
  refusalReasons?: string[];
  rating?: number; // 1-5 stars
  feedback?: string;
  relatedComplaints?: string[]; // Complaint IDs
  templateId?: string;
  customFields?: Record<string, any>;
}

export interface ComplaintTimelineItem {
  date: string;
  status: string;
  description: string;
  isCompleted: boolean;
  isRefused?: boolean;
  userId?: string;
  userName?: string;
}

export interface ComplianceSummary {
  dateSubmitted: string;
  acknowledgedBy: string;
  investigatedOn: string;
  closedOn: string | 'In Progress' | 'Refused';
  notes?: string;
}

export interface Notification {
  id: string;
  message: string;
  complaintId?: string;
  date: string;
  isRead: boolean;
  type?: 'email' | 'sms' | 'in-app';
}

export interface DashboardStats {
  openComplaints: number;
  pendingFollowups: number;
  resolvedThisMonth: number;
  refusedComplaints: number;
  assignedToMe?: number;
  overdue?: number;
  highPriority?: number;
}

export interface ComplaintTemplate {
  id: string;
  name: string;
  category: ComplaintCategory;
  typeOfProblem: ProblemType;
  description: string;
  priority: Priority;
  tags?: string[];
}

export interface FilterOptions {
  status?: ComplaintStatus[];
  priority?: Priority[];
  category?: ComplaintCategory[];
  assignedTo?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  searchQuery?: string;
}

export interface ReportData {
  totalComplaints: number;
  complaintsByStatus: Record<ComplaintStatus, number>;
  complaintsByCategory: Record<ComplaintCategory, number>;
  complaintsByPriority: Record<Priority, number>;
  averageResponseTime: number;
  averageResolutionTime: number;
  complaintsOverTime: Array<{ date: string; count: number }>;
  providerPerformance: Array<{ providerId: string; providerName: string; resolved: number; avgResolutionTime: number }>;
}
