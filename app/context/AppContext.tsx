"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  User,
  Complaint,
  Notification,
  DashboardStats,
  Comment,
  FileAttachment,
  Priority,
  ComplaintCategory,
  FilterOptions,
  ReportData,
  ComplaintTemplate,
  ComplaintStatus,
} from "../types";

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
  addComplaint: (
    complaint: Omit<
      Complaint,
      | "id"
      | "complaintId"
      | "dateSubmitted"
      | "lastUpdate"
      | "status"
      | "timeline"
      | "priority"
    >
  ) => void;
  updateComplaint: (id: string, updates: Partial<Complaint>) => void;
  deleteComplaint: (id: string) => void;
  getComplaintById: (id: string) => Complaint | undefined;
  assignComplaint: (
    complaintId: string,
    providerId: string,
    providerName: string
  ) => void;
  bulkUpdateComplaints: (ids: string[], updates: Partial<Complaint>) => void;
  bulkDeleteComplaints: (ids: string[]) => void;
  cloneComplaint: (id: string) => string | null;
  filterComplaints: (filters: FilterOptions) => Complaint[];
  searchComplaints: (query: string) => Complaint[];

  // Comments
  addComment: (
    complaintId: string,
    message: string,
    isInternal?: boolean,
    mentions?: string[],
    attachments?: FileAttachment[]
  ) => void;
  updateComment: (
    complaintId: string,
    commentId: string,
    message: string
  ) => void;
  deleteComment: (complaintId: string, commentId: string) => void;
  getComments: (complaintId: string) => Comment[];

  // Files
  addFileToComplaint: (complaintId: string, file: FileAttachment) => void;
  deleteFileFromComplaint: (complaintId: string, fileId: string) => void;
  uploadFile: (file: File) => Promise<FileAttachment>;

  // Notifications
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "date" | "isRead">
  ) => void;
  markNotificationAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadCount: number;
  sendEmailNotification: (
    email: string,
    subject: string,
    message: string
  ) => void;
  sendSMSNotification: (phone: string, message: string) => void;

  // Stats & Reports
  getDashboardStats: () => DashboardStats;
  getReportData: (dateRange?: { start: string; end: string }) => ReportData;

  // Templates
  templates: ComplaintTemplate[];
  addTemplate: (template: Omit<ComplaintTemplate, "id">) => void;
  updateTemplate: (id: string, updates: Partial<ComplaintTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => ComplaintTemplate | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial data
const initialUsers: User[] = [
  {
    id: "1",
    email: "provider@test.com",
    password: "123456",
    name: "John Doe",
    role: "provider",
  },
  {
    id: "2",
    email: "provider2@test.com",
    password: "123456",
    name: "Sarah Reed",
    role: "provider",
  },
  {
    id: "3",
    email: "admin@test.com",
    password: "123456",
    name: "Admin User",
    role: "admin",
  },
  {
    id: "4",
    email: "jane.smith@test.com",
    password: "123456",
    name: "Jane Smith",
    role: "provider",
  },
  {
    id: "5",
    email: "michael.johnson@test.com",
    password: "123456",
    name: "Michael Johnson",
    role: "provider",
  },
  {
    id: "6",
    email: "emily.davis@test.com",
    password: "123456",
    name: "Emily Davis",
    role: "provider",
  },
  {
    id: "7",
    email: "david.wilson@test.com",
    password: "123456",
    name: "David Wilson",
    role: "provider",
  },
  {
    id: "8",
    email: "sarah.brown@test.com",
    password: "123456",
    name: "Sarah Brown",
    role: "provider",
  },
  {
    id: "9",
    email: "robert.taylor@test.com",
    password: "123456",
    name: "Robert Taylor",
    role: "provider",
  },
  {
    id: "10",
    email: "lisa.anderson@test.com",
    password: "123456",
    name: "Lisa Anderson",
    role: "provider",
  },
  {
    id: "11",
    email: "james.martinez@test.com",
    password: "123456",
    name: "James Martinez",
    role: "provider",
  },
  {
    id: "12",
    email: "mary.thomas@test.com",
    password: "123456",
    name: "Mary Thomas",
    role: "provider",
  },
  {
    id: "13",
    email: "william.jackson@test.com",
    password: "123456",
    name: "William Jackson",
    role: "provider",
  },
  {
    id: "14",
    email: "patricia.white@test.com",
    password: "123456",
    name: "Patricia White",
    role: "provider",
  },
  {
    id: "15",
    email: "richard.harris@test.com",
    password: "123456",
    name: "Richard Harris",
    role: "provider",
  },
];

const initialComplaints: Complaint[] = [
  {
    id: "1",
    complaintId: "CMP-0234",
    caretaker: "Lisa Adams",
    typeOfProblem: "Late arrival",
    category: "Timing Issues",
    description: "Lisa arrived 2 hours late. I missed my appointment.",
    status: "In Progress",
    priority: "High",
    tags: ["urgent", "timing"],
    dateSubmitted: "Oct 29, 2025",
    lastUpdate: "Oct 29 at 3 PM",
    assignedTo: "Sarah Reed",
    assignedToId: "2",
    dueDate: "Nov 5, 2025",
    timeline: [
      {
        date: "Oct 29",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 30",
        status: "Reviewing",
        description: "Supervisor reviewing with Lisa Adams.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
      {
        date: "Oct 31",
        status: "Follow-up",
        description: "Awaiting follow-up confirmation.",
        isCompleted: false,
      },
      {
        date: "Nov 1",
        status: "Closed",
        description: "Case closed, issue resolved. Caretaker reassigned.",
        isCompleted: false,
      },
    ],
    comments: [
      {
        id: "c1",
        complaintId: "CMP-0234",
        userId: "2",
        userName: "Sarah Reed",
        userRole: "provider",
        message: "I have reviewed this complaint and will contact Lisa Adams.",
        isInternal: false,
        createdAt: "Oct 30, 2025 at 10:00 AM",
      },
    ],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Oct 29, 2025",
      acknowledgedBy: "Sarah Reed (Supervisor)",
      investigatedOn: "Oct 30, 2025",
      closedOn: "In Progress",
      notes:
        "The concern was reviewed with the Caretaker. A schedule adjustment was made to ensure timely service delivery.",
    },
    complianceStatement:
      "This case was handled according to internal policy HR-2025/03.",
  },
  {
    id: "2",
    complaintId: "CMP-0235",
    caretaker: "Lisa Adams",
    typeOfProblem: "Behavior",
    category: "Staff Behavior",
    description: "Unprofessional behavior during visit.",
    status: "Open",
    priority: "Medium",
    tags: ["behavior"],
    dateSubmitted: "Oct 28, 2025",
    lastUpdate: "Pending review",
    timeline: [
      {
        date: "Oct 28",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "3",
    complaintId: "CMP-0236",
    caretaker: "Lisa Adams",
    typeOfProblem: "Missed service",
    category: "Service Quality",
    description: "Scheduled service was not provided.",
    status: "Closed",
    priority: "High",
    tags: ["service"],
    dateSubmitted: "Oct 27, 2025",
    lastUpdate: "Oct 29 at 3 PM",
    assignedTo: "Sarah Reed",
    assignedToId: "2",
    timeline: [
      {
        date: "Oct 27",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 28",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
      {
        date: "Oct 29",
        status: "Closed",
        description: "Case closed, issue resolved.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Oct 27, 2025",
      acknowledgedBy: "Sarah Reed (Supervisor)",
      investigatedOn: "Oct 28, 2025",
      closedOn: "Oct 29, 2025",
    },
    rating: 4,
    feedback: "Issue was resolved quickly and professionally.",
  },
  {
    id: "4",
    complaintId: "CMP-0237",
    caretaker: "Lisa Adams",
    typeOfProblem: "Other",
    category: "Other",
    description: "General concern about service quality.",
    status: "Refused",
    priority: "Low",
    tags: ["general"],
    dateSubmitted: "Oct 26, 2025",
    lastUpdate: "Oct 29 at 3 PM",
    assignedTo: "Sarah Reed",
    assignedToId: "2",
    timeline: [
      {
        date: "Oct 26",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 27",
        status: "Reviewing",
        description: "Supervisor reviewing with Lisa Adams.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
      {
        date: "Oct 28",
        status: "Refused",
        description: "No further action will be taken at this time.",
        isCompleted: true,
        isRefused: true,
        userId: "2",
        userName: "Sarah Reed",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Oct 26, 2025",
      acknowledgedBy: "Sarah Reed (Supervisor)",
      investigatedOn: "Oct 27, 2025",
      closedOn: "Refused",
    },
    resolutionSummary: "The concern was reviewed with the Caretaker.",
    complianceStatement:
      "This case was handled according to internal policy HR-2025/03.",
    refusalReasons: [
      "It doesn't meet the complaint criteria (e.g., personal preference, not a service error).",
      "It was duplicated or already resolved elsewhere.",
      "It was unsubstantiated after review.",
      "It involved a non-service issue (out of scope).",
    ],
  },
  {
    id: "5",
    complaintId: "CMP-0238",
    caretaker: "Michael Johnson",
    typeOfProblem: "Late arrival",
    category: "Timing Issues",
    description: "Arrived 45 minutes late without notification.",
    status: "Open",
    priority: "Medium",
    tags: ["timing", "communication"],
    dateSubmitted: "Oct 25, 2025",
    lastUpdate: "Pending review",
    timeline: [
      {
        date: "Oct 25",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "6",
    complaintId: "CMP-0239",
    caretaker: "Emily Davis",
    typeOfProblem: "Behavior",
    category: "Staff Behavior",
    description: "Rude and unprofessional attitude during visit.",
    status: "In Progress",
    priority: "High",
    tags: ["behavior", "urgent"],
    dateSubmitted: "Oct 24, 2025",
    lastUpdate: "Oct 26 at 2 PM",
    assignedTo: "Sarah Reed",
    assignedToId: "2",
    dueDate: "Nov 1, 2025",
    timeline: [
      {
        date: "Oct 24",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 25",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "7",
    complaintId: "CMP-0240",
    caretaker: "David Wilson",
    typeOfProblem: "Missed service",
    category: "Service Quality",
    description: "Did not show up for scheduled appointment.",
    status: "Closed",
    priority: "High",
    tags: ["service", "missed"],
    dateSubmitted: "Oct 23, 2025",
    lastUpdate: "Oct 25 at 4 PM",
    assignedTo: "John Doe",
    assignedToId: "1",
    timeline: [
      {
        date: "Oct 23",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 24",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
      {
        date: "Oct 25",
        status: "Closed",
        description: "Case closed, alternative service arranged.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Oct 23, 2025",
      acknowledgedBy: "John Doe (Supervisor)",
      investigatedOn: "Oct 24, 2025",
      closedOn: "Oct 25, 2025",
    },
    rating: 3,
  },
  {
    id: "8",
    complaintId: "CMP-0241",
    caretaker: "Sarah Brown",
    typeOfProblem: "Other",
    category: "Other",
    description: "General concern about service scheduling.",
    status: "Open",
    priority: "Low",
    tags: ["general"],
    dateSubmitted: "Oct 22, 2025",
    lastUpdate: "Pending review",
    timeline: [
      {
        date: "Oct 22",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "9",
    complaintId: "CMP-0242",
    caretaker: "Robert Taylor",
    typeOfProblem: "Late arrival",
    category: "Timing Issues",
    description: "Consistently arriving 30+ minutes late.",
    status: "In Progress",
    priority: "Medium",
    tags: ["timing", "recurring"],
    dateSubmitted: "Oct 21, 2025",
    lastUpdate: "Oct 23 at 11 AM",
    assignedTo: "Sarah Reed",
    assignedToId: "2",
    dueDate: "Oct 28, 2025",
    timeline: [
      {
        date: "Oct 21",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 22",
        status: "Reviewing",
        description: "Supervisor reviewing with caretaker.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "10",
    complaintId: "CMP-0243",
    caretaker: "Lisa Anderson",
    typeOfProblem: "Behavior",
    category: "Staff Behavior",
    description: "Inappropriate comments made during service.",
    status: "Refused",
    priority: "Low",
    tags: ["behavior"],
    dateSubmitted: "Oct 20, 2025",
    lastUpdate: "Oct 22 at 3 PM",
    assignedTo: "John Doe",
    assignedToId: "1",
    timeline: [
      {
        date: "Oct 20",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 21",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
      {
        date: "Oct 22",
        status: "Refused",
        description: "No further action will be taken.",
        isCompleted: true,
        isRefused: true,
        userId: "1",
        userName: "John Doe",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Oct 20, 2025",
      acknowledgedBy: "John Doe (Supervisor)",
      investigatedOn: "Oct 21, 2025",
      closedOn: "Refused",
    },
    refusalReasons: ["It doesn't meet the complaint criteria."],
  },
  {
    id: "11",
    complaintId: "CMP-0244",
    caretaker: "James Martinez",
    typeOfProblem: "Missed service",
    category: "Service Quality",
    description: "Service not completed as scheduled.",
    status: "Closed",
    priority: "High",
    tags: ["service"],
    dateSubmitted: "Oct 19, 2025",
    lastUpdate: "Oct 21 at 5 PM",
    assignedTo: "Sarah Reed",
    assignedToId: "2",
    timeline: [
      {
        date: "Oct 19",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 20",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
      {
        date: "Oct 21",
        status: "Closed",
        description: "Case closed, service rescheduled.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Oct 19, 2025",
      acknowledgedBy: "Sarah Reed (Supervisor)",
      investigatedOn: "Oct 20, 2025",
      closedOn: "Oct 21, 2025",
    },
    rating: 4,
    feedback: "Issue resolved promptly.",
  },
  {
    id: "12",
    complaintId: "CMP-0245",
    caretaker: "Mary Thomas",
    typeOfProblem: "Late arrival",
    category: "Timing Issues",
    description: "Arrived 1 hour late without prior notice.",
    status: "Open",
    priority: "Medium",
    tags: ["timing"],
    dateSubmitted: "Oct 18, 2025",
    lastUpdate: "Pending review",
    timeline: [
      {
        date: "Oct 18",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "13",
    complaintId: "CMP-0246",
    caretaker: "William Jackson",
    typeOfProblem: "Behavior",
    category: "Staff Behavior",
    description: "Unprofessional conduct during visit.",
    status: "In Progress",
    priority: "High",
    tags: ["behavior", "urgent"],
    dateSubmitted: "Oct 17, 2025",
    lastUpdate: "Oct 19 at 9 AM",
    assignedTo: "John Doe",
    assignedToId: "1",
    dueDate: "Oct 24, 2025",
    timeline: [
      {
        date: "Oct 17",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 18",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "14",
    complaintId: "CMP-0247",
    caretaker: "Patricia White",
    typeOfProblem: "Missed service",
    category: "Service Quality",
    description: "Scheduled service was not provided.",
    status: "Closed",
    priority: "Medium",
    tags: ["service"],
    dateSubmitted: "Oct 16, 2025",
    lastUpdate: "Oct 18 at 2 PM",
    assignedTo: "Sarah Reed",
    assignedToId: "2",
    timeline: [
      {
        date: "Oct 16",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 17",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
      {
        date: "Oct 18",
        status: "Closed",
        description: "Case closed, issue resolved.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Oct 16, 2025",
      acknowledgedBy: "Sarah Reed (Supervisor)",
      investigatedOn: "Oct 17, 2025",
      closedOn: "Oct 18, 2025",
    },
    rating: 5,
    feedback: "Excellent resolution.",
  },
  {
    id: "15",
    complaintId: "CMP-0248",
    caretaker: "Richard Harris",
    typeOfProblem: "Other",
    category: "Other",
    description: "Request for schedule adjustment.",
    status: "Open",
    priority: "Low",
    tags: ["general"],
    dateSubmitted: "Oct 15, 2025",
    lastUpdate: "Pending review",
    timeline: [
      {
        date: "Oct 15",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "16",
    complaintId: "CMP-0249",
    caretaker: "Michael Johnson",
    typeOfProblem: "Late arrival",
    category: "Timing Issues",
    description: "Arrived late multiple times this week.",
    status: "In Progress",
    priority: "High",
    tags: ["timing", "recurring", "urgent"],
    dateSubmitted: "Oct 14, 2025",
    lastUpdate: "Oct 16 at 1 PM",
    assignedTo: "John Doe",
    assignedToId: "1",
    dueDate: "Oct 21, 2025",
    timeline: [
      {
        date: "Oct 14",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 15",
        status: "Reviewing",
        description: "Supervisor reviewing with caretaker.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "17",
    complaintId: "CMP-0250",
    caretaker: "Emily Davis",
    typeOfProblem: "Behavior",
    category: "Staff Behavior",
    description: "Disrespectful behavior observed.",
    status: "Refused",
    priority: "Low",
    tags: ["behavior"],
    dateSubmitted: "Oct 13, 2025",
    lastUpdate: "Oct 15 at 10 AM",
    assignedTo: "Sarah Reed",
    assignedToId: "2",
    timeline: [
      {
        date: "Oct 13",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 14",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
      {
        date: "Oct 15",
        status: "Refused",
        description: "No further action will be taken.",
        isCompleted: true,
        isRefused: true,
        userId: "2",
        userName: "Sarah Reed",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Oct 13, 2025",
      acknowledgedBy: "Sarah Reed (Supervisor)",
      investigatedOn: "Oct 14, 2025",
      closedOn: "Refused",
    },
    refusalReasons: ["It was unsubstantiated after review."],
  },
  {
    id: "18",
    complaintId: "CMP-0251",
    caretaker: "David Wilson",
    typeOfProblem: "Missed service",
    category: "Service Quality",
    description: "Service appointment was missed.",
    status: "Closed",
    priority: "Medium",
    tags: ["service"],
    dateSubmitted: "Oct 12, 2025",
    lastUpdate: "Oct 14 at 3 PM",
    assignedTo: "John Doe",
    assignedToId: "1",
    timeline: [
      {
        date: "Oct 12",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 13",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
      {
        date: "Oct 14",
        status: "Closed",
        description: "Case closed, service rescheduled.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Oct 12, 2025",
      acknowledgedBy: "John Doe (Supervisor)",
      investigatedOn: "Oct 13, 2025",
      closedOn: "Oct 14, 2025",
    },
    rating: 4,
  },
  {
    id: "19",
    complaintId: "CMP-0252",
    caretaker: "Sarah Brown",
    typeOfProblem: "Late arrival",
    category: "Timing Issues",
    description: "Late arrival without notification.",
    status: "Open",
    priority: "Medium",
    tags: ["timing"],
    dateSubmitted: "Oct 11, 2025",
    lastUpdate: "Pending review",
    timeline: [
      {
        date: "Oct 11",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "20",
    complaintId: "CMP-0253",
    caretaker: "Robert Taylor",
    typeOfProblem: "Behavior",
    category: "Staff Behavior",
    description: "Unprofessional attitude during service.",
    status: "In Progress",
    priority: "High",
    tags: ["behavior"],
    dateSubmitted: "Oct 10, 2025",
    lastUpdate: "Oct 12 at 11 AM",
    assignedTo: "Sarah Reed",
    assignedToId: "2",
    dueDate: "Oct 17, 2025",
    timeline: [
      {
        date: "Oct 10",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 11",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "21",
    complaintId: "CMP-0254",
    caretaker: "Lisa Anderson",
    typeOfProblem: "Missed service",
    category: "Service Quality",
    description: "Did not complete scheduled service.",
    status: "Closed",
    priority: "High",
    tags: ["service", "missed"],
    dateSubmitted: "Oct 9, 2025",
    lastUpdate: "Oct 11 at 4 PM",
    assignedTo: "John Doe",
    assignedToId: "1",
    timeline: [
      {
        date: "Oct 9",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 10",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
      {
        date: "Oct 11",
        status: "Closed",
        description: "Case closed, alternative arranged.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Oct 9, 2025",
      acknowledgedBy: "John Doe (Supervisor)",
      investigatedOn: "Oct 10, 2025",
      closedOn: "Oct 11, 2025",
    },
    rating: 3,
  },
  {
    id: "22",
    complaintId: "CMP-0255",
    caretaker: "James Martinez",
    typeOfProblem: "Other",
    category: "Other",
    description: "General feedback about service quality.",
    status: "Open",
    priority: "Low",
    tags: ["general"],
    dateSubmitted: "Oct 8, 2025",
    lastUpdate: "Pending review",
    timeline: [
      {
        date: "Oct 8",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "23",
    complaintId: "CMP-0256",
    caretaker: "Mary Thomas",
    typeOfProblem: "Late arrival",
    category: "Timing Issues",
    description: "Consistently late for appointments.",
    status: "In Progress",
    priority: "Medium",
    tags: ["timing", "recurring"],
    dateSubmitted: "Oct 7, 2025",
    lastUpdate: "Oct 9 at 2 PM",
    assignedTo: "Sarah Reed",
    assignedToId: "2",
    dueDate: "Oct 14, 2025",
    timeline: [
      {
        date: "Oct 7",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 8",
        status: "Reviewing",
        description: "Supervisor reviewing with caretaker.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "24",
    complaintId: "CMP-0257",
    caretaker: "William Jackson",
    typeOfProblem: "Behavior",
    category: "Staff Behavior",
    description: "Inappropriate comments during visit.",
    status: "Refused",
    priority: "Low",
    tags: ["behavior"],
    dateSubmitted: "Oct 6, 2025",
    lastUpdate: "Oct 8 at 9 AM",
    assignedTo: "John Doe",
    assignedToId: "1",
    timeline: [
      {
        date: "Oct 6",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 7",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
      {
        date: "Oct 8",
        status: "Refused",
        description: "No further action will be taken.",
        isCompleted: true,
        isRefused: true,
        userId: "1",
        userName: "John Doe",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Oct 6, 2025",
      acknowledgedBy: "John Doe (Supervisor)",
      investigatedOn: "Oct 7, 2025",
      closedOn: "Refused",
    },
    refusalReasons: ["It doesn't meet the complaint criteria."],
  },
  {
    id: "25",
    complaintId: "CMP-0258",
    caretaker: "Patricia White",
    typeOfProblem: "Missed service",
    category: "Service Quality",
    description: "Service not provided as scheduled.",
    status: "Closed",
    priority: "High",
    tags: ["service"],
    dateSubmitted: "Oct 5, 2025",
    lastUpdate: "Oct 7 at 3 PM",
    assignedTo: "Sarah Reed",
    assignedToId: "2",
    timeline: [
      {
        date: "Oct 5",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 6",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
      {
        date: "Oct 7",
        status: "Closed",
        description: "Case closed, service rescheduled.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Oct 5, 2025",
      acknowledgedBy: "Sarah Reed (Supervisor)",
      investigatedOn: "Oct 6, 2025",
      closedOn: "Oct 7, 2025",
    },
    rating: 4,
    feedback: "Quick resolution.",
  },
  {
    id: "26",
    complaintId: "CMP-0259",
    caretaker: "Richard Harris",
    typeOfProblem: "Late arrival",
    category: "Timing Issues",
    description: "Arrived 50 minutes late.",
    status: "Open",
    priority: "Medium",
    tags: ["timing"],
    dateSubmitted: "Oct 4, 2025",
    lastUpdate: "Pending review",
    timeline: [
      {
        date: "Oct 4",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "27",
    complaintId: "CMP-0260",
    caretaker: "Michael Johnson",
    typeOfProblem: "Behavior",
    category: "Staff Behavior",
    description: "Rude behavior during service.",
    status: "In Progress",
    priority: "High",
    tags: ["behavior", "urgent"],
    dateSubmitted: "Oct 3, 2025",
    lastUpdate: "Oct 5 at 1 PM",
    assignedTo: "John Doe",
    assignedToId: "1",
    dueDate: "Oct 10, 2025",
    timeline: [
      {
        date: "Oct 3",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 4",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "28",
    complaintId: "CMP-0261",
    caretaker: "Emily Davis",
    typeOfProblem: "Missed service",
    category: "Service Quality",
    description: "Did not show up for appointment.",
    status: "Closed",
    priority: "Medium",
    tags: ["service", "missed"],
    dateSubmitted: "Oct 2, 2025",
    lastUpdate: "Oct 4 at 5 PM",
    assignedTo: "Sarah Reed",
    assignedToId: "2",
    timeline: [
      {
        date: "Oct 2",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 3",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
      {
        date: "Oct 4",
        status: "Closed",
        description: "Case closed, issue resolved.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Oct 2, 2025",
      acknowledgedBy: "Sarah Reed (Supervisor)",
      investigatedOn: "Oct 3, 2025",
      closedOn: "Oct 4, 2025",
    },
    rating: 5,
  },
  {
    id: "29",
    complaintId: "CMP-0262",
    caretaker: "David Wilson",
    typeOfProblem: "Other",
    category: "Other",
    description: "Request for schedule modification.",
    status: "Open",
    priority: "Low",
    tags: ["general"],
    dateSubmitted: "Oct 1, 2025",
    lastUpdate: "Pending review",
    timeline: [
      {
        date: "Oct 1",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "30",
    complaintId: "CMP-0263",
    caretaker: "Sarah Brown",
    typeOfProblem: "Late arrival",
    category: "Timing Issues",
    description: "Multiple late arrivals this month.",
    status: "In Progress",
    priority: "High",
    tags: ["timing", "recurring", "urgent"],
    dateSubmitted: "Sep 30, 2025",
    lastUpdate: "Oct 2 at 10 AM",
    assignedTo: "John Doe",
    assignedToId: "1",
    dueDate: "Oct 7, 2025",
    timeline: [
      {
        date: "Sep 30",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Oct 1",
        status: "Reviewing",
        description: "Supervisor reviewing with caretaker.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: "31",
    complaintId: "CMP-0264",
    caretaker: "Robert Taylor",
    typeOfProblem: "Behavior",
    category: "Staff Behavior",
    description: "Unprofessional conduct observed.",
    status: "Refused",
    priority: "Low",
    tags: ["behavior"],
    dateSubmitted: "Sep 29, 2025",
    lastUpdate: "Oct 1 at 11 AM",
    assignedTo: "Sarah Reed",
    assignedToId: "2",
    timeline: [
      {
        date: "Sep 29",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Sep 30",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "2",
        userName: "Sarah Reed",
      },
      {
        date: "Oct 1",
        status: "Refused",
        description: "No further action will be taken.",
        isCompleted: true,
        isRefused: true,
        userId: "2",
        userName: "Sarah Reed",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Sep 29, 2025",
      acknowledgedBy: "Sarah Reed (Supervisor)",
      investigatedOn: "Sep 30, 2025",
      closedOn: "Refused",
    },
    refusalReasons: ["It was unsubstantiated after review."],
  },
  {
    id: "32",
    complaintId: "CMP-0265",
    caretaker: "Lisa Anderson",
    typeOfProblem: "Missed service",
    category: "Service Quality",
    description: "Service appointment was missed.",
    status: "Closed",
    priority: "Medium",
    tags: ["service"],
    dateSubmitted: "Sep 28, 2025",
    lastUpdate: "Sep 30 at 2 PM",
    assignedTo: "John Doe",
    assignedToId: "1",
    timeline: [
      {
        date: "Sep 28",
        status: "Received",
        description: "Complaint received by support team.",
        isCompleted: true,
        userId: "1",
        userName: "System",
      },
      {
        date: "Sep 29",
        status: "Reviewing",
        description: "Supervisor reviewing case.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
      {
        date: "Sep 30",
        status: "Closed",
        description: "Case closed, service rescheduled.",
        isCompleted: true,
        userId: "1",
        userName: "John Doe",
      },
    ],
    comments: [],
    attachments: [],
    complianceSummary: {
      dateSubmitted: "Sep 28, 2025",
      acknowledgedBy: "John Doe (Supervisor)",
      investigatedOn: "Sep 29, 2025",
      closedOn: "Sep 30, 2025",
    },
    rating: 4,
    feedback: "Satisfactory resolution.",
  },
];

const initialNotifications: Notification[] = [
  {
    id: "1",
    message: "Sarah Reed is now reviewing your complaint CMP-0234.",
    complaintId: "CMP-0234",
    date: "Oct 30, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "2",
    message:
      "Your concern was reassigned to a new supervisor for faster review.",
    date: "Oct 30, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "3",
    message: "Please check the update on your complaint CMP-0235.",
    complaintId: "CMP-0235",
    date: "Oct 29, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "4",
    message: "Our staff asked for more details, tap to add information.",
    date: "Oct 29, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "5",
    message: "You have not responded to a follow-up request for CMP-0236.",
    complaintId: "CMP-0236",
    date: "Oct 28, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "6",
    message:
      "We're still working on your complaint CMP-0237, thank you for your patience.",
    complaintId: "CMP-0237",
    date: "Oct 28, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "7",
    message:
      "Your case is taking longer than usual. It has been forwarded for further review.",
    date: "Oct 27, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "8",
    message: "Complaint CMP-0234 is In Progress (Sarah Reed reviewing)",
    complaintId: "CMP-0234",
    date: "Oct 27, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "9",
    message: "John Doe has been assigned to review complaint CMP-0238.",
    complaintId: "CMP-0238",
    date: "Oct 26, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "10",
    message: "Your complaint CMP-0239 requires additional information.",
    complaintId: "CMP-0239",
    date: "Oct 26, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "11",
    message: "Complaint CMP-0240 has been resolved successfully.",
    complaintId: "CMP-0240",
    date: "Oct 25, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "12",
    message: "Sarah Reed is now reviewing your complaint CMP-0241.",
    complaintId: "CMP-0241",
    date: "Oct 25, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "13",
    message: "A new update is available for complaint CMP-0242.",
    complaintId: "CMP-0242",
    date: "Oct 24, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "14",
    message:
      "Your complaint CMP-0243 has been refused. Please review the reasons.",
    complaintId: "CMP-0243",
    date: "Oct 24, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "15",
    message: "Complaint CMP-0244 status changed to Closed.",
    complaintId: "CMP-0244",
    date: "Oct 23, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "16",
    message: "John Doe requested more details for complaint CMP-0245.",
    complaintId: "CMP-0245",
    date: "Oct 23, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "17",
    message: "Your complaint CMP-0246 is being investigated.",
    complaintId: "CMP-0246",
    date: "Oct 22, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "18",
    message: "Sarah Reed added a comment to complaint CMP-0247.",
    complaintId: "CMP-0247",
    date: "Oct 22, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "19",
    message: "Complaint CMP-0248 has been assigned to a new supervisor.",
    complaintId: "CMP-0248",
    date: "Oct 21, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "20",
    message: "Your complaint CMP-0249 requires immediate attention.",
    complaintId: "CMP-0249",
    date: "Oct 21, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "21",
    message: "Complaint CMP-0250 status updated to In Progress.",
    complaintId: "CMP-0250",
    date: "Oct 20, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "22",
    message: "John Doe is now reviewing your complaint CMP-0251.",
    complaintId: "CMP-0251",
    date: "Oct 20, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "23",
    message: "Your complaint CMP-0252 has been resolved.",
    complaintId: "CMP-0252",
    date: "Oct 19, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "24",
    message: "A follow-up is required for complaint CMP-0253.",
    complaintId: "CMP-0253",
    date: "Oct 19, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "25",
    message: "Sarah Reed added new information to complaint CMP-0254.",
    complaintId: "CMP-0254",
    date: "Oct 18, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "26",
    message: "Your complaint CMP-0255 is under review.",
    complaintId: "CMP-0255",
    date: "Oct 18, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "27",
    message: "Complaint CMP-0256 has been closed successfully.",
    complaintId: "CMP-0256",
    date: "Oct 17, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "28",
    message: "John Doe requested clarification on complaint CMP-0257.",
    complaintId: "CMP-0257",
    date: "Oct 17, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "29",
    message: "Your complaint CMP-0258 status changed to Closed.",
    complaintId: "CMP-0258",
    date: "Oct 16, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "30",
    message: "Sarah Reed is investigating complaint CMP-0259.",
    complaintId: "CMP-0259",
    date: "Oct 16, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "31",
    message: "Complaint CMP-0260 requires your response.",
    complaintId: "CMP-0260",
    date: "Oct 15, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "32",
    message: "Your complaint CMP-0261 has been assigned to John Doe.",
    complaintId: "CMP-0261",
    date: "Oct 15, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "33",
    message: "Complaint CMP-0262 is now In Progress.",
    complaintId: "CMP-0262",
    date: "Oct 14, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "34",
    message: "Sarah Reed added a comment to your complaint CMP-0263.",
    complaintId: "CMP-0263",
    date: "Oct 14, 2025",
    isRead: false,
    type: "in-app",
  },
  {
    id: "35",
    message: "Your complaint CMP-0264 has been resolved.",
    complaintId: "CMP-0264",
    date: "Oct 13, 2025",
    isRead: true,
    type: "in-app",
  },
  {
    id: "36",
    message: "Complaint CMP-0265 status updated. Please check for updates.",
    complaintId: "CMP-0265",
    date: "Oct 13, 2025",
    isRead: false,
    type: "in-app",
  },
];

const initialTemplates: ComplaintTemplate[] = [
  {
    id: "t1",
    name: "Late Arrival Template",
    category: "Timing Issues",
    typeOfProblem: "Late arrival",
    description: "Caretaker arrived late for scheduled appointment.",
    priority: "High",
    tags: ["timing", "late"],
  },
  {
    id: "t2",
    name: "Behavior Issue Template",
    category: "Staff Behavior",
    typeOfProblem: "Behavior",
    description: "Unprofessional behavior observed during service.",
    priority: "Medium",
    tags: ["behavior"],
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [templates, setTemplates] =
    useState<ComplaintTemplate[]>(initialTemplates);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  const login = (email: string, password: string): boolean => {
    const user = users.find(
      (u) => u.email === email && u.password === password
    );
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const signup = (email: string, password: string, name: string): boolean => {
    if (users.find((u) => u.email === email)) {
      return false;
    }
    const newUser: User = {
      id: Date.now().toString(),
      email,
      password,
      name,
      role: "provider",
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updatePassword = (
    oldPassword: string,
    newPassword: string
  ): boolean => {
    if (!currentUser || currentUser.password !== oldPassword) {
      return false;
    }
    const updatedUser = { ...currentUser, password: newPassword };
    setCurrentUser(updatedUser);
    setUsers(users.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    return true;
  };

  const updateUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    setUsers(users.map((u) => (u.id === currentUser.id ? updatedUser : u)));
  };

  const generateComplaintId = (): string => {
    const num = complaints.length + 1;
    return `CMP-${String(num).padStart(4, "0")}`;
  };

  const addComplaint = (
    complaintData: Omit<
      Complaint,
      | "id"
      | "complaintId"
      | "dateSubmitted"
      | "lastUpdate"
      | "status"
      | "timeline"
      | "priority"
    >
  ) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = `${now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} at ${now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })}`;

    const newComplaint: Complaint = {
      ...complaintData,
      priority: "Medium",
      id: Date.now().toString(),
      complaintId: generateComplaintId(),
      dateSubmitted: dateStr,
      lastUpdate: timeStr,
      status: "Open",
      comments: [],
      attachments: complaintData.attachments || [],
      timeline: [
        {
          date: now.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          status: "Received",
          description: "Complaint received by support team.",
          isCompleted: true,
          userId: currentUser?.id || "1",
          userName: currentUser?.name || "System",
        },
      ],
    };

    setComplaints([newComplaint, ...complaints]);

    addNotification({
      message: `Your complaint ${newComplaint.complaintId} has been received and is under review.`,
      complaintId: newComplaint.complaintId,
      type: "in-app",
    });
  };

  const updateComplaint = (id: string, updates: Partial<Complaint>) => {
    const now = new Date();
    const timeStr = `${now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} at ${now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })}`;

    setComplaints(
      complaints.map((c) => {
        if (c.id === id) {
          return { ...c, ...updates, lastUpdate: timeStr };
        }
        return c;
      })
    );
  };

  const deleteComplaint = (id: string) => {
    setComplaints(complaints.filter((c) => c.id !== id));
  };

  const getComplaintById = (id: string): Complaint | undefined => {
    return complaints.find((c) => c.id === id || c.complaintId === id);
  };

  const assignComplaint = (
    complaintId: string,
    providerId: string,
    providerName: string
  ) => {
    const complaint = getComplaintById(complaintId);
    if (!complaint) return;

    const now = new Date();
    updateComplaint(complaint.id, {
      assignedTo: providerName,
      assignedToId: providerId,
      status: "In Progress",
      timeline: [
        ...complaint.timeline,
        {
          date: now.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          status: "Assigned",
          description: `Complaint assigned to ${providerName}.`,
          isCompleted: true,
          userId: currentUser?.id || "1",
          userName: currentUser?.name || "System",
        },
      ],
    });

    addNotification({
      message: `Complaint ${complaint.complaintId} has been assigned to you.`,
      complaintId: complaint.complaintId,
      type: "in-app",
    });
  };

  const bulkUpdateComplaints = (ids: string[], updates: Partial<Complaint>) => {
    setComplaints(
      complaints.map((c) => (ids.includes(c.id) ? { ...c, ...updates } : c))
    );
  };

  const bulkDeleteComplaints = (ids: string[]) => {
    setComplaints(complaints.filter((c) => !ids.includes(c.id)));
  };

  const cloneComplaint = (id: string): string | null => {
    const complaint = getComplaintById(id);
    if (!complaint) return null;

    const cloned = {
      ...complaint,
      id: Date.now().toString(),
      complaintId: generateComplaintId(),
      status: "Open" as ComplaintStatus,
      dateSubmitted: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      lastUpdate: "Just now",
      timeline: [
        {
          date: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          status: "Received",
          description: "Complaint received by support team.",
          isCompleted: true,
          userId: currentUser?.id || "1",
          userName: currentUser?.name || "System",
        },
      ],
      comments: [],
      attachments: [],
    };

    setComplaints([cloned, ...complaints]);
    return cloned.id;
  };

  const filterComplaints = (filters: FilterOptions): Complaint[] => {
    let filtered = [...complaints];

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((c) => filters.status!.includes(c.status));
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((c) => filters.priority!.includes(c.priority));
    }

    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(
        (c) => c.category && filters.category!.includes(c.category)
      );
    }

    if (filters.assignedTo) {
      filtered = filtered.filter((c) => c.assignedToId === filters.assignedTo);
    }

    if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
      try {
        const start = new Date(filters.dateRange.start + "T00:00:00");
        const end = new Date(filters.dateRange.end + "T23:59:59");
        filtered = filtered.filter((c) => {
          try {
            const date = new Date(c.dateSubmitted);
            if (
              isNaN(date.getTime()) ||
              isNaN(start.getTime()) ||
              isNaN(end.getTime())
            ) {
              return false;
            }
            return date >= start && date <= end;
          } catch (error) {
            return false;
          }
        });
      } catch (error) {
        console.error("Error filtering by date range:", error);
      }
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(
        (c) => c.tags && filters.tags!.some((tag) => c.tags!.includes(tag))
      );
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
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
    return complaints.filter(
      (c) =>
        c.complaintId.toLowerCase().includes(lowerQuery) ||
        c.caretaker.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery) ||
        c.typeOfProblem.toLowerCase().includes(lowerQuery) ||
        (c.category && c.category.toLowerCase().includes(lowerQuery)) ||
        (c.tags && c.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)))
    );
  };

  const addComment = (
    complaintId: string,
    message: string,
    isInternal = false,
    mentions: string[] = [],
    attachments: FileAttachment[] = []
  ) => {
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
      createdAt: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
    };

    updateComplaint(complaint.id, {
      comments: [...(complaint.comments || []), newComment],
    });

    // Notify mentioned users
    if (mentions.length > 0) {
      mentions.forEach((userId) => {
        const user = users.find((u) => u.id === userId);
        if (user) {
          addNotification({
            message: `${currentUser.name} mentioned you in a comment on ${complaint.complaintId}.`,
            complaintId: complaint.complaintId,
            type: "in-app",
          });
        }
      });
    }
  };

  const updateComment = (
    complaintId: string,
    commentId: string,
    message: string
  ) => {
    const complaint = getComplaintById(complaintId);
    if (!complaint || !complaint.comments) return;

    const updatedComments = complaint.comments.map((c) =>
      c.id === commentId
        ? { ...c, message, updatedAt: new Date().toLocaleString() }
        : c
    );

    updateComplaint(complaint.id, { comments: updatedComments });
  };

  const deleteComment = (complaintId: string, commentId: string) => {
    const complaint = getComplaintById(complaintId);
    if (!complaint || !complaint.comments) return;

    const updatedComments = complaint.comments.filter(
      (c) => c.id !== commentId
    );
    updateComplaint(complaint.id, { comments: updatedComments });
  };

  const getComments = (complaintId: string): Comment[] => {
    const complaint = getComplaintById(complaintId);
    if (!complaint) return [];

    if (currentUser?.role === "provider") {
      return (complaint.comments || []).filter((c) => !c.isInternal);
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
      attachments: complaint.attachments.filter((f) => f.id !== fileId),
    });
  };

  const uploadFile = async (file: File): Promise<FileAttachment> => {
    // Simulate file upload
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      id: Date.now().toString(),
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
      uploadedBy: currentUser?.id || "1",
      uploadedAt: new Date().toLocaleString(),
    };
  };

  const addNotification = (
    notificationData: Omit<Notification, "id" | "date" | "isRead">
  ) => {
    const now = new Date();
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      date: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      isRead: false,
      type: notificationData.type || "in-app",
    };
    setNotifications([newNotification, ...notifications]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const sendEmailNotification = (
    email: string,
    subject: string,
    message: string
  ) => {
    // Simulate email sending
    console.log(`Email sent to ${email}: ${subject} - ${message}`);
    addNotification({
      message: `Email notification sent: ${subject}`,
      type: "email",
    });
  };

  const sendSMSNotification = (phone: string, message: string) => {
    // Simulate SMS sending
    console.log(`SMS sent to ${phone}: ${message}`);
    addNotification({
      message: `SMS notification sent to ${phone}`,
      type: "sms",
    });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getDashboardStats = (): DashboardStats => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Providers and admins see all complaints
    const userComplaints = complaints;

    return {
      openComplaints: userComplaints.filter(
        (c) => c.status === "Open" || c.status === "In Progress"
      ).length,
      pendingFollowups: userComplaints.filter((c) => c.status === "In Progress")
        .length,
      resolvedThisMonth: userComplaints.filter((c) => {
        if (c.status !== "Closed") return false;
        const date = new Date(c.dateSubmitted);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      }).length,
      refusedComplaints: userComplaints.filter((c) => c.status === "Refused")
        .length,
      assignedToMe:
        currentUser?.role === "provider"
          ? complaints.filter(
              (c) =>
                c.assignedToId === currentUser.id &&
                (c.status === "Open" || c.status === "In Progress")
            ).length
          : undefined,
      overdue: userComplaints.filter((c) => {
        if (!c.dueDate) return false;
        return (
          new Date(c.dueDate) < now &&
          (c.status === "Open" || c.status === "In Progress")
        );
      }).length,
      highPriority: userComplaints.filter(
        (c) => c.priority === "High" || c.priority === "Urgent"
      ).length,
    };
  };

  const getReportData = (dateRange?: {
    start: string;
    end: string;
  }): ReportData => {
    const filteredComplaints = dateRange
      ? complaints.filter((c) => {
          try {
            // Parse the dateSubmitted which is in format like "Oct 29, 2025"
            const complaintDate = new Date(c.dateSubmitted);
            // Parse the date range which is in format "2025-10-29"
            const start = new Date(dateRange.start + "T00:00:00");
            const end = new Date(dateRange.end + "T23:59:59");

            // Check if dates are valid
            if (
              isNaN(complaintDate.getTime()) ||
              isNaN(start.getTime()) ||
              isNaN(end.getTime())
            ) {
              return false;
            }

            return complaintDate >= start && complaintDate <= end;
          } catch (error) {
            console.error("Error parsing date:", c.dateSubmitted, error);
            return false;
          }
        })
      : complaints;

    const statusCounts: Record<ComplaintStatus, number> = {
      Open: 0,
      "In Progress": 0,
      Closed: 0,
      Refused: 0,
    };

    const categoryCounts: Record<ComplaintCategory, number> = {
      "Service Quality": 0,
      "Staff Behavior": 0,
      "Timing Issues": 0,
      "Safety Concerns": 0,
      Billing: 0,
      Other: 0,
    };

    const priorityCounts: Record<Priority, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
      Urgent: 0,
    };

    filteredComplaints.forEach((c) => {
      statusCounts[c.status]++;
      if (c.category) categoryCounts[c.category]++;
      priorityCounts[c.priority]++;
    });

    const totalResponseTime = filteredComplaints
      .filter((c) => c.responseTime)
      .reduce((sum, c) => sum + (c.responseTime || 0), 0);
    const avgResponseTime =
      filteredComplaints.filter((c) => c.responseTime).length > 0
        ? totalResponseTime /
          filteredComplaints.filter((c) => c.responseTime).length
        : 0;

    const totalResolutionTime = filteredComplaints
      .filter((c) => c.resolutionTime)
      .reduce((sum, c) => sum + (c.resolutionTime || 0), 0);
    const avgResolutionTime =
      filteredComplaints.filter((c) => c.resolutionTime).length > 0
        ? totalResolutionTime /
          filteredComplaints.filter((c) => c.resolutionTime).length
        : 0;

    // Group by date for time series
    const complaintsOverTime = filteredComplaints.reduce((acc, c) => {
      const date = c.dateSubmitted;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Provider performance
    const providerStats: Record<
      string,
      { resolved: number; totalTime: number; count: number }
    > = {};
    filteredComplaints.forEach((c) => {
      if (c.assignedToId && c.status === "Closed" && c.resolutionTime) {
        if (!providerStats[c.assignedToId]) {
          providerStats[c.assignedToId] = {
            resolved: 0,
            totalTime: 0,
            count: 0,
          };
        }
        providerStats[c.assignedToId].resolved++;
        providerStats[c.assignedToId].totalTime += c.resolutionTime;
        providerStats[c.assignedToId].count++;
      }
    });

    const providerPerformance = Object.entries(providerStats).map(
      ([providerId, stats]) => {
        const provider = users.find((u) => u.id === providerId);
        return {
          providerId,
          providerName: provider?.name || "Unknown",
          resolved: stats.resolved,
          avgResolutionTime:
            stats.count > 0 ? stats.totalTime / stats.count : 0,
        };
      }
    );

    return {
      totalComplaints: filteredComplaints.length,
      complaintsByStatus: statusCounts,
      complaintsByCategory: categoryCounts,
      complaintsByPriority: priorityCounts,
      averageResponseTime: avgResponseTime,
      averageResolutionTime: avgResolutionTime,
      complaintsOverTime: Object.entries(complaintsOverTime).map(
        ([date, count]) => ({ date, count })
      ),
      providerPerformance,
    };
  };

  const addTemplate = (template: Omit<ComplaintTemplate, "id">) => {
    const newTemplate: ComplaintTemplate = {
      ...template,
      id: Date.now().toString(),
    };
    setTemplates([...templates, newTemplate]);
  };

  const updateTemplate = (id: string, updates: Partial<ComplaintTemplate>) => {
    setTemplates(
      templates.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const getTemplateById = (id: string): ComplaintTemplate | undefined => {
    return templates.find((t) => t.id === id);
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
        complaints: complaints,
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
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
