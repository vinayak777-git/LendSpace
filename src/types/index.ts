export type AppRole = 'user' | 'owner' | 'manager';

export type ResourceType = 'equipment' | 'space' | 'device' | 'tool' | 'lab';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AppRole;
  institution: string;
  department?: string;
  studentId?: string;
  useIntents?: string[];
  projectPurpose?: string;
  usageTimeline?: string;
  specialRequirements?: string;
  primaryNeeds?: string[];
  hasCompletedRequirementsOnboarding?: boolean;
  orgType?: string;
  jobTitle?: string;
  resourceCategories?: string[];
  isVerifiedOwner?: boolean;
  avatar?: string;
  createdAt: string;
}

export type UserRole = 'student' | 'faculty' | 'manager' | 'admin';

export interface Credential {
  id: string;
  type: string; // e.g. '3d_printing', 'laser_cutting', 'wet_lab_cert', 'camera_handling', 'safety_level_1'
  name: string;
  status: 'verified' | 'pending' | 'expired';
  expiry: string;
  verifiedAt?: string;
  docUrl?: string;
  rejectedReason?: string;
}

export interface UserUsageStats {
  hoursThisWeek: number;
  activeBookingsCount: number;
  lateReturnsCount: number;
  completedBookingsCount: number;
  strikes?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  org: string; // Department / Program, e.g. "Mechanical Eng", "Robotics Club"
  department?: string;
  phone?: string;
  projectPurpose?: string;
  usageTimeline?: string;
  specialRequirements?: string;
  primaryNeeds?: string[];
  jobTitle?: string;
  avatar?: string;
  verified: boolean;
  credentials: Credential[];
  usageStats: UserUsageStats;
  privacySettings?: {
    showProfileToPublic: boolean;
    showPastProjects: boolean;
    shareContactWithManagers: boolean;
  };
}

export type ResourceCategory =
  | '3d_printer'
  | 'laser_cutter'
  | 'electronics'
  | 'photography'
  | 'spaces'
  | 'wet_lab'
  | 'computing'
  | 'soldering'
  | string;

export type DemandLevel = 'low' | 'medium' | 'high';
export type ApprovalMode = 'auto' | 'manual';

export interface AvailabilityWindow {
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  startHour: number; // 8 = 08:00
  endHour: number;   // 20 = 20:00
}

export interface Requirement {
  id: string;
  type: 'credential' | 'supervision' | 'deposit' | 'faculty_approval';
  credentialType?: string;
  label: string;
  description?: string;
}

export interface Resource {
  id: string;
  title: string;
  category: ResourceCategory;
  type?: ResourceType;
  description: string;
  location: string;
  ownerId: string;
  managerIds: string[];
  images: string[];
  availabilityWindows: AvailabilityWindow[];
  requirements: Requirement[];
  rules: string[];
  depositAmount: number;
  maxHoursPerBooking: number;
  maxHoursPerWeekPerUser: number;
  supervisionRequired: boolean;
  approvalMode: ApprovalMode;
  demandLevel: DemandLevel;
  isPaused?: boolean;
  status?: 'live' | 'paused' | 'draft' | 'pending_verification';
  cooldownHours?: number;
  checklistItems?: string[]; // Standard condition items (e.g. nozzle clean, lens intact)
  capacity?: number;
  assetTag?: string;
  building?: string;
  room?: string;
  minBookingMinutes?: number;
  minBookingHours?: number;
  maxBookingHours?: number;
  weeklyCapHours?: number;
  bufferMinutes?: number;
  maxAdvanceDays?: number;
  safetyNotes?: string;
  requiredPPE?: string[];
  whoMayBook?: 'anyone_verified' | 'institution_only' | 'approved_list' | string;
  depositRequired?: number;
  facultyApprovalRequired?: boolean;
  safetyRules?: string[];
  checkInChecklist?: string[];
  requiredCredentials?: string[];
  cooldownPeriodHours?: number;
  condition?: string;
  // Area & Rent Pricing Customizations
  hourlyRate?: number;
  dailyRate?: number;
  pricingModel?: 'free' | 'hourly' | 'daily' | 'flat';
  currency?: string;
  isFree?: boolean;
  areaSqFt?: number;
  amenities?: string[];
  roomLayout?: string;
}

export interface Review {
  id: string;
  resourceId: string;
  bookingId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'technician';
  department: string;
  assignedResourceIds: string[];
  permissions: {
    canReviewRequests: boolean;
    canInspectReturns: boolean;
    canManageIncidents: boolean;
    canEditListings: boolean;
    canManageTeam: boolean;
  };
  status: 'active' | 'invited';
  addedAt: string;
}

export type BookingStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'waitlisted'
  | 'checked_in'
  | 'returned'
  | 'cancelled'
  | 'overdue'
  | 'disputed';

export interface BookingExtension {
  id: string;
  requestedDurationMinutes: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedReason?: string;
}

export interface ChecklistResponse {
  item: string;
  passed: boolean;
  note?: string;
}

export interface ConditionReport {
  bookingId: string;
  phase: 'before' | 'after';
  checklist: ChecklistResponse[];
  notes: string;
  photos: string[];
  rating: number; // 1-5
  submittedAt: string;
  submittedBy: string;
  managerConfirmed?: boolean;
  managerNotes?: string;
  confirmedAt?: string;
}

export interface ScoreBreakdown {
  purposeWeight: number;
  recentHoursScore: number;
  academicLinkScore: number;
  waitingTimeScore: number;
  latePenalty: number;
  total: number;
  academicBoost?: number;
}

export interface Booking {
  id: string;
  resourceId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userOrg?: string;
  start: string; // ISO String
  end: string;   // ISO String
  purpose: string;
  academicProject?: boolean;
  status: BookingStatus;
  decisionReason?: string;
  extensions: BookingExtension[];
  waitlistPosition?: number;
  priorityScore?: number;
  scoreBreakdown?: ScoreBreakdown;
  checkInReport?: ConditionReport;
  returnReport?: ConditionReport;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface WaitlistEntry {
  bookingId: string;
  position: number;
  priorityScore: number;
  scoreBreakdown: ScoreBreakdown;
  userId: string;
  resourceId: string;
  start: string;
  end: string;
}

export type IncidentType = 'damage' | 'delay' | 'dispute' | 'safety';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical' | 'minor' | 'moderate';
export type IncidentStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';
export type IncidentPenalty =
  | 'none'
  | 'warn'
  | 'deduct_deposit'
  | 'suspend_access'
  | 'deposit_deduction'
  | 'temporary_suspension'
  | 'warning'
  | 'ban';

export interface Incident {
  id: string;
  bookingId: string;
  resourceId: string;
  reporterId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  status: IncidentStatus;
  resolution?: string;
  penalty?: IncidentPenalty;
  reviewedBy?: string;
  reviewedAt?: string;
  resolutionReason?: string;
  photos?: string[];
  createdAt: string;
}

export type NotificationType =
  | 'approved'
  | 'rejected'
  | 'waitlist_promotion'
  | 'reminder'
  | 'cancellation'
  | 'overdue'
  | 'incident_update'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  actor?: { id: string; name: string; role: string };
  action: string;
  targetId: string;
  targetType: 'booking' | 'resource' | 'incident' | 'credential' | 'user' | 'system' | 'policy' | 'settings';
  reason: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface EligibilityResult {
  isEligible: boolean;
  score: 'green' | 'amber' | 'red'; // green = full, amber = missing 1, red = missing multiple or ineligible
  missingRequirements: Requirement[];
  metRequirements: Requirement[];
  reasons: string[];
  actionNeeded?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingBooking?: Booking;
  reasons: string[];
  suggestedSlots: { start: string; end: string; label: string }[];
}

export interface FairnessCheckResult {
  allowed: boolean;
  userHoursThisWeek: number;
  maxWeeklyHours: number;
  cooldownActive: boolean;
  cooldownEndsAt?: string;
  activePendingCount: number;
  maxActivePending: number;
  priorityScore: number;
  scoreBreakdown: ScoreBreakdown;
  reasons: string[];
  warning?: string;
}
