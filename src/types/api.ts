// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
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

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone: string;
  isVerified: boolean;
  rating: number;
  totalSessions: number;
  creditBalance: number;
  joinedAt: string;
  lastActive: string;
  skills?: UserSkill[];
  availability?: Availability[];
  preferences?: UserPreferences;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  sessionReminders: boolean;
  matchSuggestions: boolean;
  marketingEmails: boolean;
}

// Skill Types
export interface Skill {
  id: string;
  name: string;
  category: string;
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
  createdAt: string;
}

export interface SkillCategory {
  name: string;
  skills: Skill[];
}

// Session Types
export interface Session {
  id: string;
  teacherId: string;
  learnerId: string;
  skillId: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number; // minutes
  status: SessionStatus;
  type: SessionType;
  videoLink?: string;
  creditCost: number;
  teacher: User;
  learner: User;
  skill: Skill;
  ratings?: SessionRating[];
  createdAt: string;
  updatedAt: string;
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

export interface SessionRating {
  id: string;
  sessionId: string;
  raterId: string;
  ratedUserId: string;
  knowledgeRating: number;
  communicationRating: number;
  professionalismRating: number;
  comment?: string;
  createdAt: string;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  attachments?: Attachment[];
  sentAt: string;
  readAt?: string;
  editedAt?: string;
  sender: User;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export enum MessageType {
  TEXT = "text",
  FILE = "file",
  IMAGE = "image",
  SYSTEM = "system",
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

// Credit Types
export interface CreditTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  sessionId?: string;
  stripePaymentId?: string;
  createdAt: string;
}

export enum TransactionType {
  EARNED = "earned",
  SPENT = "spent",
  PURCHASED = "purchased",
  REFUNDED = "refunded",
  BONUS = "bonus",
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export enum NotificationType {
  SESSION_REMINDER = "session_reminder",
  SESSION_CONFIRMED = "session_confirmed",
  SESSION_CANCELLED = "session_cancelled",
  MESSAGE_RECEIVED = "message_received",
  MATCH_SUGGESTION = "match_suggestion",
  CREDIT_EARNED = "credit_earned",
  SKILL_VERIFIED = "skill_verified",
  SYSTEM_UPDATE = "system_update",
}

// Match Types
export interface MatchSuggestion {
  id: string;
  userId: string;
  suggestedUserId: string;
  score: number;
  explanation: string;
  skillMatches: SkillMatch[];
  user: User;
  createdAt: string;
}

export interface SkillMatch {
  teachingSkill: UserSkill;
  learningSkill: UserSkill;
  compatibility: number;
}

// Availability Types
export interface Availability {
  id: string;
  userId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone: string;
}

// Auth Types
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

// Request Types
export interface CreateSessionRequest {
  teacherId: string;
  skillId: string;
  title: string;
  description?: string;
  proposedTimes: string[];
  duration: number;
  type: SessionType;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type: MessageType;
  attachments?: File[];
}

export interface UpdateSkillRequest {
  proficiencyLevel: number;
  canTeach: boolean;
  wantsToLearn: boolean;
}

export interface MatchFilters {
  skillCategories?: string[];
  minRating?: number;
  maxDistance?: number;
  availabilityOverlap?: boolean;
  onlineOnly?: boolean;
}
