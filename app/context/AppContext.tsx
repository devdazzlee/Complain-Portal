'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, Complaint, Notification, DashboardStats, Comment, FileAttachment, 
  Priority, ComplaintCategory, FilterOptions, ReportData, ComplaintTemplate, ComplaintStatus 
} from '../types';

interface AppContextType {
  // Auth
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => boolean;
  signup: (email: string, password: string, name: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  updatePassword: (oldPassword: string, newPassword: string) => boolean;
  updateUser: (updates: Partial<User>) => void;

  // Complaints
  complaints: Complaint[];
  addComplaint: (complaint: Omit<Complaint, 'id' | 'complaintId' | 'dateSubmitted' | 'lastUpdate' | 'status' | 'timeline' | 'priority'>) => void;
  updateComplaint: (id: string, updates: Partial<Complaint>) => void;
  deleteComplaint: (id: string) => void;
  getComplaintById: (id: string) => Complaint | undefined;
  assignComplaint: (complaintId: string, providerId: string, providerName: string) => void;
  bulkUpdateComplaints: (ids: string[], updates: Partial<Complaint>) => void;
  bulkDeleteComplaints: (ids: string[]) => void;
  cloneComplaint: (id: string) => string | null;
  filterComplaints: (filters: FilterOptions) => Complaint[];
  searchComplaints: (query: string) => Complaint[];

  // Comments
  addComment: (complaintId: string, message: string, isInternal?: boolean, mentions?: string[], attachments?: FileAttachment[]) => void;
  updateComment: (complaintId: string, commentId: string, message: string) => void;
  deleteComment: (complaintId: string, commentId: string) => void;
  getComments: (complaintId: string) => Comment[];

  // Files
  addFileToComplaint: (complaintId: string, file: FileAttachment) => void;
  deleteFileFromComplaint: (complaintId: string, fileId: string) => void;
  uploadFile: (file: File) => Promise<FileAttachment>;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadCount: number;
  sendEmailNotification: (email: string, subject: string, message: string) => void;
  sendSMSNotification: (phone: string, message: string) => void;

  // Stats & Reports
  getDashboardStats: () => DashboardStats;
  getReportData: (dateRange?: { start: string; end: string }) => ReportData;

  // Templates
  templates: ComplaintTemplate[];
  addTemplate: (template: Omit<ComplaintTemplate, 'id'>) => void;
  updateTemplate: (id: string, updates: Partial<ComplaintTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => ComplaintTemplate | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial data
const initialUsers: User[] = [
  { id: '1', email: 'customer@test.com', password: '123456', name: 'John Doe', role: 'customer' },
  { id: '2', email: 'provider@test.com', password: '123456', name: 'Sarah Reed', role: 'provider' },
  { id: '3', email: 'admin@test.com', password: '123456', name: 'Admin User', role: 'admin' },
];

const initialComplaints: Complaint[] = [
  {
    id: '1',
    complaintId: 'CMP-0234',
    caretaker: 'Lisa Adams',
    typeOfProblem: 'Late arrival',
    category: 'Timing Issues',
    description: 'Lisa arrived 2 hours late. I missed my appointment.',
    status: 'In Progress',
    priority: 'High',
    tags: ['urgent', 'timing'],
    dateSubmitted: 'Oct 29, 2025',
    lastUpdate: 'Oct 29 at 3 PM',
    assignedTo: 'Sarah Reed',
    assignedToId: '2',
    dueDate: 'Nov 5, 2025',
    timeline: [
      { date: 'Oct 29', status: 'Received', description: 'Complaint received by support team.', isCompleted: true, userId: '1', userName: 'System' },
      { date: 'Oct 30', status: 'Reviewing', description: 'Supervisor reviewing with Lisa Adams.', isCompleted: true, userId: '2', userName: 'Sarah Reed' },
      { date: 'Oct 31', status: 'Follow-up', description: 'Awaiting follow-up confirmation.', isCompleted: false },
      { date: 'Nov 1', status: 'Closed', description: 'Case closed, issue resolved. Caretaker reassigned.', isCompleted: false },
    ],
    comments: [
      {
        id: 'c1',
        complaintId: 'CMP-0234',
        userId: '2',
        userName: 'Sarah Reed',
        userRole: 'provider',
        message: 'I have reviewed this complaint and will contact Lisa Adams.',
        isInternal: false,
        createdAt: 'Oct 30, 2025 at 10:00 AM',
      },
    ],
    attachments: [],
    complianceSummary: {
      dateSubmitted: 'Oct 29, 2025',
      acknowledgedBy: 'Sarah Reed (Supervisor)',
      investigatedOn: 'Oct 30, 2025',
      closedOn: 'In Progress',
      notes: "The concern was reviewed with the Caretaker. A schedule adjustment was made to ensure timely service delivery.",
    },
    complianceStatement: 'This case was handled according to internal policy HR-2025/03.',
  },
  {
    id: '2',
    complaintId: 'CMP-0235',
    caretaker: 'Lisa Adams',
    typeOfProblem: 'Behavior',
    category: 'Staff Behavior',
    description: 'Unprofessional behavior during visit.',
    status: 'Open',
    priority: 'Medium',
    tags: ['behavior'],
    dateSubmitted: 'Oct 28, 2025',
    lastUpdate: 'Pending review',
    timeline: [
      { date: 'Oct 28', status: 'Received', description: 'Complaint received by support team.', isCompleted: true, userId: '1', userName: 'System' },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: '3',
    complaintId: 'CMP-0236',
    caretaker: 'Lisa Adams',
    typeOfProblem: 'Missed service',
    category: 'Service Quality',
    description: 'Scheduled service was not provided.',
    status: 'Closed',
    priority: 'High',
    tags: ['service'],
    dateSubmitted: 'Oct 27, 2025',
    lastUpdate: 'Oct 29 at 3 PM',
    assignedTo: 'Sarah Reed',
    assignedToId: '2',
    timeline: [
      { date: 'Oct 27', status: 'Received', description: 'Complaint received by support team.', isCompleted: true, userId: '1', userName: 'System' },
      { date: 'Oct 28', status: 'Reviewing', description: 'Supervisor reviewing case.', isCompleted: true, userId: '2', userName: 'Sarah Reed' },
      { date: 'Oct 29', status: 'Closed', description: 'Case closed, issue resolved.', isCompleted: true, userId: '2', userName: 'Sarah Reed' },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: 'Oct 27, 2025',
      acknowledgedBy: 'Sarah Reed (Supervisor)',
      investigatedOn: 'Oct 28, 2025',
      closedOn: 'Oct 29, 2025',
    },
    rating: 4,
    feedback: 'Issue was resolved quickly and professionally.',
  },
  {
    id: '4',
    complaintId: 'CMP-0237',
    caretaker: 'Lisa Adams',
    typeOfProblem: 'Other',
    category: 'Other',
    description: 'General concern about service quality.',
    status: 'Refused',
    priority: 'Low',
    tags: ['general'],
    dateSubmitted: 'Oct 26, 2025',
    lastUpdate: 'Oct 29 at 3 PM',
    assignedTo: 'Sarah Reed',
    assignedToId: '2',
    timeline: [
      { date: 'Oct 26', status: 'Received', description: 'Complaint received by support team.', isCompleted: true, userId: '1', userName: 'System' },
      { date: 'Oct 27', status: 'Reviewing', description: 'Supervisor reviewing with Lisa Adams.', isCompleted: true, userId: '2', userName: 'Sarah Reed' },
      { date: 'Oct 28', status: 'Refused', description: 'No further action will be taken at this time.', isCompleted: true, isRefused: true, userId: '2', userName: 'Sarah Reed' },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: 'Oct 26, 2025',
      acknowledgedBy: 'Sarah Reed (Supervisor)',
      investigatedOn: 'Oct 27, 2025',
      closedOn: 'Refused',
    },
    resolutionSummary: 'The concern was reviewed with the Caretaker.',
    complianceStatement: 'This case was handled according to internal policy HR-2025/03.',
    refusalReasons: [
      "It doesn't meet the complaint criteria (e.g., personal preference, not a service error).",
      'It was duplicated or already resolved elsewhere.',
      'It was unsubstantiated after review.',
      'It involved a non-service issue (out of scope).',
    ],
  },
];

const initialNotifications: Notification[] = [
  { id: '1', message: 'Sarah Reed is now reviewing your complaint CMP-0234.', complaintId: 'CMP-0234', date: 'Oct 30, 2025', isRead: false, type: 'in-app' },
  { id: '2', message: 'Your concern was reassigned to a new supervisor for faster review.', date: 'Oct 30, 2025', isRead: false, type: 'in-app' },
  { id: '3', message: 'Please check the update on your complaint CMP-0235.', complaintId: 'CMP-0235', date: 'Oct 29, 2025', isRead: false, type: 'in-app' },
  { id: '4', message: "Our staff asked for more details, tap to add information.", date: 'Oct 29, 2025', isRead: false, type: 'in-app' },
  { id: '5', message: 'You have not responded to a follow-up request for CMP-0236.', complaintId: 'CMP-0236', date: 'Oct 28, 2025', isRead: false, type: 'in-app' },
  { id: '6', message: "We're still working on your complaint CMP-0237, thank you for your patience.", complaintId: 'CMP-0237', date: 'Oct 28, 2025', isRead: false, type: 'in-app' },
  { id: '7', message: 'Your case is taking longer than usual. It has been forwarded for further review.', date: 'Oct 27, 2025', isRead: false, type: 'in-app' },
  { id: '8', message: 'Complaint CMP-0234 is In Progress (Sarah Reed reviewing)', complaintId: 'CMP-0234', date: 'Oct 27, 2025', isRead: false, type: 'in-app' },
];

const initialTemplates: ComplaintTemplate[] = [
  {
    id: 't1',
    name: 'Late Arrival Template',
    category: 'Timing Issues',
    typeOfProblem: 'Late arrival',
    description: 'Caretaker arrived late for scheduled appointment.',
    priority: 'High',
    tags: ['timing', 'late'],
  },
  {
    id: 't2',
    name: 'Behavior Issue Template',
    category: 'Staff Behavior',
    typeOfProblem: 'Behavior',
    description: 'Unprofessional behavior observed during service.',
    priority: 'Medium',
    tags: ['behavior'],
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [templates, setTemplates] = useState<ComplaintTemplate[]>(initialTemplates);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const login = (email: string, password: string): boolean => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const signup = (email: string, password: string, name: string): boolean => {
    if (users.find(u => u.email === email)) {
      return false;
    }
    const newUser: User = {
      id: Date.now().toString(),
      email,
      password,
      name,
      role: 'customer',
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updatePassword = (oldPassword: string, newPassword: string): boolean => {
    if (!currentUser || currentUser.password !== oldPassword) {
      return false;
    }
    const updatedUser = { ...currentUser, password: newPassword };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
    return true;
  };

  const updateUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const generateComplaintId = (): string => {
    const num = complaints.length + 1;
    return `CMP-${String(num).padStart(4, '0')}`;
  };

  const addComplaint = (complaintData: Omit<Complaint, 'id' | 'complaintId' | 'dateSubmitted' | 'lastUpdate' | 'status' | 'timeline' | 'priority'>) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;

    const newComplaint: Complaint = {
      ...complaintData,
      priority: 'Medium',
      id: Date.now().toString(),
      complaintId: generateComplaintId(),
      dateSubmitted: dateStr,
      lastUpdate: timeStr,
      status: 'Open',
      comments: [],
      attachments: complaintData.attachments || [],
      timeline: [
        {
          date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          status: 'Received',
          description: 'Complaint received by support team.',
          isCompleted: true,
          userId: currentUser?.id || '1',
          userName: currentUser?.name || 'System',
        },
      ],
    };

    setComplaints([newComplaint, ...complaints]);
    
    addNotification({
      message: `Your complaint ${newComplaint.complaintId} has been received and is under review.`,
      complaintId: newComplaint.complaintId,
      type: 'in-app',
    });
  };

  const updateComplaint = (id: string, updates: Partial<Complaint>) => {
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
    
    setComplaints(complaints.map(c => {
      if (c.id === id) {
        return { ...c, ...updates, lastUpdate: timeStr };
      }
      return c;
    }));
  };

  const deleteComplaint = (id: string) => {
    setComplaints(complaints.filter(c => c.id !== id));
  };

  const getComplaintById = (id: string): Complaint | undefined => {
    return complaints.find(c => c.id === id || c.complaintId === id);
  };

  const assignComplaint = (complaintId: string, providerId: string, providerName: string) => {
    const complaint = getComplaintById(complaintId);
    if (!complaint) return;

    const now = new Date();
    updateComplaint(complaint.id, {
      assignedTo: providerName,
      assignedToId: providerId,
      status: 'In Progress',
      timeline: [
        ...complaint.timeline,
        {
          date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          status: 'Assigned',
          description: `Complaint assigned to ${providerName}.`,
          isCompleted: true,
          userId: currentUser?.id || '1',
          userName: currentUser?.name || 'System',
        },
      ],
    });

    addNotification({
      message: `Complaint ${complaint.complaintId} has been assigned to you.`,
      complaintId: complaint.complaintId,
      type: 'in-app',
    });
  };

  const bulkUpdateComplaints = (ids: string[], updates: Partial<Complaint>) => {
    setComplaints(complaints.map(c => ids.includes(c.id) ? { ...c, ...updates } : c));
  };

  const bulkDeleteComplaints = (ids: string[]) => {
    setComplaints(complaints.filter(c => !ids.includes(c.id)));
  };

  const cloneComplaint = (id: string): string | null => {
    const complaint = getComplaintById(id);
    if (!complaint) return null;

    const cloned = {
      ...complaint,
      id: Date.now().toString(),
      complaintId: generateComplaintId(),
      status: 'Open' as ComplaintStatus,
      dateSubmitted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUpdate: 'Just now',
      timeline: [{
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: 'Received',
        description: 'Complaint received by support team.',
        isCompleted: true,
        userId: currentUser?.id || '1',
        userName: currentUser?.name || 'System',
      }],
      comments: [],
      attachments: [],
    };

    setComplaints([cloned, ...complaints]);
    return cloned.id;
  };

  const filterComplaints = (filters: FilterOptions): Complaint[] => {
    let filtered = [...complaints];

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(c => filters.status!.includes(c.status));
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(c => filters.priority!.includes(c.priority));
    }

    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(c => c.category && filters.category!.includes(c.category));
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(c => c.assignedToId === filters.assignedTo);
    }

    if (filters.dateRange) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      filtered = filtered.filter(c => {
        const date = new Date(c.dateSubmitted);
        return date >= start && date <= end;
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(c => 
        c.tags && filters.tags!.some(tag => c.tags!.includes(tag))
      );
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.complaintId.toLowerCase().includes(query) ||
        c.caretaker.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.typeOfProblem.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const searchComplaints = (query: string): Complaint[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return complaints.filter(c =>
      c.complaintId.toLowerCase().includes(lowerQuery) ||
      c.caretaker.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.typeOfProblem.toLowerCase().includes(lowerQuery) ||
      (c.category && c.category.toLowerCase().includes(lowerQuery)) ||
      (c.tags && c.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  };

  const addComment = (complaintId: string, message: string, isInternal = false, mentions: string[] = [], attachments: FileAttachment[] = []) => {
    const complaint = getComplaintById(complaintId);
    if (!complaint || !currentUser) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      complaintId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      message,
      isInternal,
      mentions,
      attachments,
      createdAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }),
    };

    updateComplaint(complaint.id, {
      comments: [...(complaint.comments || []), newComment],
    });

    // Notify mentioned users
    if (mentions.length > 0) {
      mentions.forEach(userId => {
        const user = users.find(u => u.id === userId);
        if (user) {
          addNotification({
            message: `${currentUser.name} mentioned you in a comment on ${complaint.complaintId}.`,
            complaintId: complaint.complaintId,
            type: 'in-app',
          });
        }
      });
    }
  };

  const updateComment = (complaintId: string, commentId: string, message: string) => {
    const complaint = getComplaintById(complaintId);
    if (!complaint || !complaint.comments) return;

    const updatedComments = complaint.comments.map(c =>
      c.id === commentId ? { ...c, message, updatedAt: new Date().toLocaleString() } : c
    );

    updateComplaint(complaint.id, { comments: updatedComments });
  };

  const deleteComment = (complaintId: string, commentId: string) => {
    const complaint = getComplaintById(complaintId);
    if (!complaint || !complaint.comments) return;

    const updatedComments = complaint.comments.filter(c => c.id !== commentId);
    updateComplaint(complaint.id, { comments: updatedComments });
  };

  const getComments = (complaintId: string): Comment[] => {
    const complaint = getComplaintById(complaintId);
    if (!complaint) return [];
    
    if (currentUser?.role === 'customer') {
      return (complaint.comments || []).filter(c => !c.isInternal);
    }
    return complaint.comments || [];
  };

  const addFileToComplaint = (complaintId: string, file: FileAttachment) => {
    const complaint = getComplaintById(complaintId);
    if (!complaint) return;

    updateComplaint(complaint.id, {
      attachments: [...(complaint.attachments || []), file],
    });
  };

  const deleteFileFromComplaint = (complaintId: string, fileId: string) => {
    const complaint = getComplaintById(complaintId);
    if (!complaint || !complaint.attachments) return;

    updateComplaint(complaint.id, {
      attachments: complaint.attachments.filter(f => f.id !== fileId),
    });
  };

  const uploadFile = async (file: File): Promise<FileAttachment> => {
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: Date.now().toString(),
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
      uploadedBy: currentUser?.id || '1',
      uploadedAt: new Date().toLocaleString(),
    };
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'date' | 'isRead'>) => {
    const now = new Date();
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isRead: false,
      type: notificationData.type || 'in-app',
    };
    setNotifications([newNotification, ...notifications]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const sendEmailNotification = (email: string, subject: string, message: string) => {
    // Simulate email sending
    console.log(`Email sent to ${email}: ${subject} - ${message}`);
    addNotification({
      message: `Email notification sent: ${subject}`,
      type: 'email',
    });
  };

  const sendSMSNotification = (phone: string, message: string) => {
    // Simulate SMS sending
    console.log(`SMS sent to ${phone}: ${message}`);
    addNotification({
      message: `SMS notification sent to ${phone}`,
      type: 'sms',
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getDashboardStats = (): DashboardStats => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const userComplaints = currentUser?.role === 'customer' 
      ? complaints 
      : currentUser?.role === 'provider'
      ? complaints.filter(c => c.assignedToId === currentUser.id)
      : complaints;

    return {
      openComplaints: userComplaints.filter(c => c.status === 'Open' || c.status === 'In Progress').length,
      pendingFollowups: userComplaints.filter(c => c.status === 'In Progress').length,
      resolvedThisMonth: userComplaints.filter(c => {
        if (c.status !== 'Closed') return false;
        const date = new Date(c.dateSubmitted);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).length,
      refusedComplaints: userComplaints.filter(c => c.status === 'Refused').length,
      assignedToMe: currentUser?.role === 'provider' 
        ? complaints.filter(c => c.assignedToId === currentUser.id && (c.status === 'Open' || c.status === 'In Progress')).length
        : undefined,
      overdue: userComplaints.filter(c => {
        if (!c.dueDate) return false;
        return new Date(c.dueDate) < now && (c.status === 'Open' || c.status === 'In Progress');
      }).length,
      highPriority: userComplaints.filter(c => c.priority === 'High' || c.priority === 'Urgent').length,
    };
  };

  const getReportData = (dateRange?: { start: string; end: string }): ReportData => {
    const filteredComplaints = dateRange
      ? complaints.filter(c => {
          const date = new Date(c.dateSubmitted);
          const start = new Date(dateRange.start);
          const end = new Date(dateRange.end);
          return date >= start && date <= end;
        })
      : complaints;

    const statusCounts: Record<ComplaintStatus, number> = {
      'Open': 0,
      'In Progress': 0,
      'Closed': 0,
      'Refused': 0,
    };

    const categoryCounts: Record<ComplaintCategory, number> = {
      'Service Quality': 0,
      'Staff Behavior': 0,
      'Timing Issues': 0,
      'Safety Concerns': 0,
      'Billing': 0,
      'Other': 0,
    };

    const priorityCounts: Record<Priority, number> = {
      'Low': 0,
      'Medium': 0,
      'High': 0,
      'Urgent': 0,
    };

    filteredComplaints.forEach(c => {
      statusCounts[c.status]++;
      if (c.category) categoryCounts[c.category]++;
      priorityCounts[c.priority]++;
    });

    const totalResponseTime = filteredComplaints
      .filter(c => c.responseTime)
      .reduce((sum, c) => sum + (c.responseTime || 0), 0);
    const avgResponseTime = filteredComplaints.filter(c => c.responseTime).length > 0
      ? totalResponseTime / filteredComplaints.filter(c => c.responseTime).length
      : 0;

    const totalResolutionTime = filteredComplaints
      .filter(c => c.resolutionTime)
      .reduce((sum, c) => sum + (c.resolutionTime || 0), 0);
    const avgResolutionTime = filteredComplaints.filter(c => c.resolutionTime).length > 0
      ? totalResolutionTime / filteredComplaints.filter(c => c.resolutionTime).length
      : 0;

    // Group by date for time series
    const complaintsOverTime = filteredComplaints.reduce((acc, c) => {
      const date = c.dateSubmitted;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Provider performance
    const providerStats: Record<string, { resolved: number; totalTime: number; count: number }> = {};
    filteredComplaints.forEach(c => {
      if (c.assignedToId && c.status === 'Closed' && c.resolutionTime) {
        if (!providerStats[c.assignedToId]) {
          providerStats[c.assignedToId] = { resolved: 0, totalTime: 0, count: 0 };
        }
        providerStats[c.assignedToId].resolved++;
        providerStats[c.assignedToId].totalTime += c.resolutionTime;
        providerStats[c.assignedToId].count++;
      }
    });

    const providerPerformance = Object.entries(providerStats).map(([providerId, stats]) => {
      const provider = users.find(u => u.id === providerId);
      return {
        providerId,
        providerName: provider?.name || 'Unknown',
        resolved: stats.resolved,
        avgResolutionTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
      };
    });

    return {
      totalComplaints: filteredComplaints.length,
      complaintsByStatus: statusCounts,
      complaintsByCategory: categoryCounts,
      complaintsByPriority: priorityCounts,
      averageResponseTime: avgResponseTime,
      averageResolutionTime: avgResolutionTime,
      complaintsOverTime: Object.entries(complaintsOverTime).map(([date, count]) => ({ date, count })),
      providerPerformance,
    };
  };

  const addTemplate = (template: Omit<ComplaintTemplate, 'id'>) => {
    const newTemplate: ComplaintTemplate = {
      ...template,
      id: Date.now().toString(),
    };
    setTemplates([...templates, newTemplate]);
  };

  const updateTemplate = (id: string, updates: Partial<ComplaintTemplate>) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  const getTemplateById = (id: string): ComplaintTemplate | undefined => {
    return templates.find(t => t.id === id);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        login,
        signup,
        logout,
        isAuthenticated: !!currentUser,
        updatePassword,
        updateUser,
        complaints: currentUser?.role === 'customer' 
          ? complaints 
          : complaints,
        addComplaint,
        updateComplaint,
        deleteComplaint,
        getComplaintById,
        assignComplaint,
        bulkUpdateComplaints,
        bulkDeleteComplaints,
        cloneComplaint,
        filterComplaints,
        searchComplaints,
        addComment,
        updateComment,
        deleteComment,
        getComments,
        addFileToComplaint,
        deleteFileFromComplaint,
        uploadFile,
        notifications,
        addNotification,
        markNotificationAsRead,
        deleteNotification,
        markAllNotificationsAsRead,
        unreadCount,
        sendEmailNotification,
        sendSMSNotification,
        getDashboardStats,
        getReportData,
        templates,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        getTemplateById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
