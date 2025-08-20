// User roles and permissions
export enum UserRole {
  EMPLOYEE = "employee",
  MANAGER = "manager",
  HR = "hr",
  ADMIN = "admin",
  COMMITTEE_MEMBER = "committee_member",
}

// Grade levels
export enum GradeLevel {
  L1 = "L1",
  L2 = "L2",
  L3 = "L3",
  L4 = "L4",
  L5 = "L5",
}

// Review statuses
export enum ReviewStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  PEER_REVIEW = "peer_review",
  MANAGER_REVIEW = "manager_review",
  COMMITTEE_REVIEW = "committee_review",
  COMPLETED = "completed",
  REJECTED = "rejected",
}

// Peer review status
export enum PeerReviewStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  REJECTED = "rejected",
}

// Manager review status
export enum ManagerReviewStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// Committee status
export enum CommitteeStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

// Notification types
export enum NotificationType {
  PEER_REVIEW_REQUEST = "peer_review_request",
  MANAGER_REVIEW_REQUEST = "manager_review_request",
  COMMITTEE_DECISION = "committee_decision",
  REVIEW_COMPLETED = "review_completed",
}

export enum AssessmentStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  COMPLETED = "completed",
}

export enum AchievementsCategory {
  RESPONSIBILITY = "Ответственность",
  INTERACTION = "Взаимодействие",
  LEADERSHIP = "Лидерство",
}

// Core interfaces
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  hireDate: string;
  currentGrade: GradeLevel;
  role: UserRole;
  managerId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GradeExpectation {
  id: string;
  gradeLevel: GradeLevel;
  gradeName: string;
  description: string;
  requirements: string;
  createdAt: string;
}

export interface ReviewCycle {
  id: string;
  cycleName: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface SelfAssessment {
  id: string;
  employeeId: string;
  reviewCycleId: string;
  achievements: string;
  achievements_category: string; // New field for dropdown
  selfEvaluation: string;
  currentGrade: GradeLevel;
  targetGrade: GradeLevel;
  status: ReviewStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PeerReviewer {
  id: string;
  selfAssessmentId: string;
  reviewerId: string;
  reviewOrder: number; // 1st or 2nd reviewer
  status: PeerReviewStatus;
  confirmedGrade?: GradeLevel;
  feedback?: string;
  reviewDate?: string;
  createdAt: string;
}

export interface ManagerReview {
  id: string;
  selfAssessmentId: string;
  managerId: string;
  status: ManagerReviewStatus;
  approvedGrade?: GradeLevel;
  feedback?: string;
  reviewDate?: string;
  createdAt: string;
}

export interface ReviewCommittee {
  id: string;
  reviewCycleId: string;
  committeeName: string;
  status: CommitteeStatus;
  createdAt: string;
}

export interface CommitteeMember {
  id: string;
  committeeId: string;
  employeeId: string;
  role: string; // chair, member, etc.
  createdAt: string;
}

export interface CommitteeDecision {
  id: string;
  selfAssessmentId: string;
  committeeId: string;
  finalGrade: GradeLevel;
  decision: string;
  decisionDate: string;
  createdAt: string;
}

export interface ReviewNotification {
  id: string;
  selfAssessmentId: string;
  employeeId: string;
  notificationType: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Extended interfaces with relationships
export interface SelfAssessmentWithDetails extends SelfAssessment {
  employee: User;
  reviewCycle: ReviewCycle;
  peerReviewers: (PeerReviewer & { reviewer: User })[];
  managerReview?: ManagerReview & { manager: User };
  committeeDecision?: CommitteeDecision;
}

export interface UserWithManager extends User {
  manager?: User;
  subordinates?: User[];
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SelfAssessmentForm {
  achievements: string;
  achievements_category: string; // New field for dropdown
  selfEvaluation: string;
  currentGrade: GradeLevel;
  targetGrade: GradeLevel;
  peerReviewerIds: string[];
  employeeId?: string;
  reviewCycleId?: string;
  status: AssessmentStatus;
}

export interface PeerReviewForm {
  confirmedGrade: GradeLevel;
  feedback: string;
}

export interface ManagerReviewForm {
  approvedGrade: GradeLevel;
  feedback: string;
}

export interface CommitteeDecisionForm {
  finalGrade: GradeLevel;
  decision: string;
}

// Filter and search types
export interface ReviewFilters {
  status?: ReviewStatus;
  grade?: GradeLevel;
  department?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface UserFilters {
  role?: UserRole;
  department?: string;
  grade?: GradeLevel;
}
