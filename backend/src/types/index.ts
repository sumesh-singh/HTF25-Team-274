import { Request } from "express";

// Common API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;
  timezone: string;
  isVerified: boolean;
  isAdmin: boolean;
  rating: number | any; // Allow Prisma Decimal type
  totalSessions: number;
  creditBalance: number;
  joinedAt: Date;
  lastActive: Date;
}

// Skill types
export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description?: string;
  isActive: boolean;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  proficiencyLevel: number; // 0-100
  canTeach: boolean;
  wantsToLearn: boolean;
  isVerified: boolean;
  verificationCount: number;
  skill: Skill;
}

// Session types
export interface Session {
  id: string;
  teacherId: string;
  learnerId: string;
  skillId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // minutes
  status: SessionStatus;
  type: SessionType;
  videoLink?: string;
  creditCost: number;
}

// Message types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  attachments?: Attachment[];
  sentAt: Date;
  readAt?: Date;
  editedAt?: Date;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

// Credit types
export interface CreditTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  sessionId?: string;
  stripePaymentId?: string;
  createdAt: Date;
}

// Enums
export enum ProficiencyLevel {
  BEGINNER = "beginner", // 0-25%
  INTERMEDIATE = "intermediate", // 26-60%
  ADVANCED = "advanced", // 61-85%
  EXPERT = "expert", // 86-100%
}

export enum SessionStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

export enum SessionType {
  ONE_TIME = "one_time",
  RECURRING = "recurring",
  LEARNING_CIRCLE = "learning_circle",
  MICRO_LEARNING = "micro_learning",
}

export enum MessageType {
  TEXT = "text",
  FILE = "file",
  IMAGE = "image",
  SYSTEM = "system",
}

export enum TransactionType {
  EARNED = "earned",
  SPENT = "spent",
  PURCHASED = "purchased",
  REFUNDED = "refunded",
  BONUS = "bonus",
}

export enum SkillCategory {
  TECHNOLOGY = "technology",
  DESIGN = "design",
  BUSINESS = "business",
  MARKETING = "marketing",
  LANGUAGES = "languages",
  MUSIC = "music",
  ARTS_CRAFTS = "arts_crafts",
  FITNESS = "fitness",
  COOKING = "cooking",
  PHOTOGRAPHY = "photography",
  WRITING = "writing",
  OTHER = "other",
}

// Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Socket.io event types
export interface ClientEvents {
  join_conversation: (conversationId: string) => void;
  leave_conversation: (conversationId: string) => void;
  send_message: (data: SendMessageData) => void;
  typing_start: (conversationId: string) => void;
  typing_stop: (conversationId: string) => void;
  join_session: (sessionId: string) => void;
  session_update: (data: SessionUpdateData) => void;
}

export interface ServerEvents {
  message_received: (message: Message) => void;
  message_updated: (message: Message) => void;
  typing_indicator: (data: TypingData) => void;
  user_online: (userId: string) => void;
  user_offline: (userId: string) => void;
  notification: (notification: Notification) => void;
  session_reminder: (session: Session) => void;
  match_suggestion: (match: MatchSuggestion) => void;
}

export interface SendMessageData {
  conversationId: string;
  content: string;
  type: MessageType;
}

export interface SessionUpdateData {
  sessionId: string;
  status: SessionStatus;
}

export interface TypingData {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export interface MatchSuggestion {
  id: string;
  userId: string;
  matchedUserId: string;
  score: number;
  explanation: string;
  skills: string[];
}

// Match-related types
export interface MatchScore {
  userId: string;
  score: number;
  breakdown: {
    skillComplementarity: number;
    availabilityOverlap: number;
    learningStyleCompatibility: number;
    ratingHistory: number;
    responseRate: number;
  };
  explanation: string;
  commonSkills: string[];
}

export interface MatchFilters {
  skillCategories?: SkillCategory[];
  proficiencyLevels?: number[];
  location?: string;
  minRating?: number;
  maxDistance?: number;
  availabilityDays?: number[];
  availabilityTimes?: string[];
}

export enum MatchInteractionType {
  FAVORITE = "favorite",
  PASS = "pass",
  BLOCK = "block",
  VIEW = "view",
}

// Express Request extension
export interface AuthenticatedRequest extends Request {
  user: User;
}

// Admin types
export interface AdminAnalytics {
  userMetrics: {
    totalUsers: number;
    monthlyActiveUsers: number;
    newRegistrations: number;
    userRetentionRate: number;
    averageSessionsPerUser: number;
  };
  sessionMetrics: {
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    sessionCompletionRate: number;
    averageSessionDuration: number;
    sessionsThisMonth: number;
  };
  creditMetrics: {
    totalCreditsInCirculation: number;
    totalCreditsEarned: number;
    totalCreditsSpent: number;
    totalRevenue: number;
    averageCreditsPerUser: number;
    creditTransactionsThisMonth: number;
  };
  skillMetrics: {
    totalSkills: number;
    mostPopularSkills: Array<{ skill: string; count: number }>;
    skillCategoryDistribution: Array<{ category: string; count: number }>;
    verifiedSkillsCount: number;
  };
  systemHealth: {
    uptime: number;
    averageResponseTime: number;
    errorRate: number;
    activeConnections: number;
    databaseHealth: boolean;
    redisHealth: boolean;
  };
}

export interface AdminUserDetails extends User {
  skills: UserSkill[];
  sessionsAsTeacher: number;
  sessionsAsLearner: number;
  totalEarnings: number;
  totalSpending: number;
  lastLogin: Date;
  accountStatus: "active" | "suspended" | "banned";
  reportCount: number;
}

export interface AdminSessionDetails extends Session {
  teacher: User;
  learner: User;
  skill: Skill;
  ratings: SessionRating[];
  creditTransactions: CreditTransaction[];
}

export interface SessionRating {
  id: string;
  sessionId: string;
  raterId: string;
  knowledgeRating: number;
  communicationRating: number;
  professionalismRating: number;
  feedback?: string;
  createdAt: Date;
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  type: ReportType;
  reason: string;
  description: string;
  evidence?: string[];
  status: ReportStatus;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  reporter: User;
  reportedUser: User;
}

export enum ReportType {
  INAPPROPRIATE_BEHAVIOR = "inappropriate_behavior",
  SPAM = "spam",
  HARASSMENT = "harassment",
  FAKE_PROFILE = "fake_profile",
  PAYMENT_ISSUE = "payment_issue",
  TECHNICAL_ISSUE = "technical_issue",
  OTHER = "other",
}

export enum ReportStatus {
  PENDING = "pending",
  UNDER_REVIEW = "under_review",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}

export interface ModerationAction {
  id: string;
  adminId: string;
  targetUserId: string;
  type: ModerationActionType;
  reason: string;
  duration?: number; // in days for suspensions
  createdAt: Date;
  expiresAt?: Date;
}

export enum ModerationActionType {
  WARNING = "warning",
  SUSPENSION = "suspension",
  BAN = "ban",
  UNBAN = "unban",
  SKILL_VERIFICATION_REVOKE = "skill_verification_revoke",
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
