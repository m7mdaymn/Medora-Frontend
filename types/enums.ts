// ============================================================================
// Elite Clinic - Backend Enum Types (Matching C# Domain Enums)
// ============================================================================

// Queue/Ticket Status
export enum TicketStatus {
  Waiting = 0,
  Called = 1,
  InVisit = 2,
  Completed = 3,
  Skipped = 4,
  NoShow = 5,
  Cancelled = 6,
}

export type TicketStatusString =
  | 'Waiting'
  | 'Called'
  | 'InVisit'
  | 'Completed'
  | 'Skipped'
  | 'NoShow'
  | 'Cancelled'

// Visit Status
export enum VisitStatus {
  Open = 0,
  Completed = 1,
}

export type VisitStatusString = 'Open' | 'Completed'

// Visit Type
export enum VisitType {
  Exam = 0,
  Consultation = 1,
}

export type VisitTypeString = 'Exam' | 'Consultation'

// Visit Source (Phase 1 addition)
export enum VisitSource {
  WalkInTicket = 0,
  Booking = 1,
  ConsultationBooking = 2,
  PatientSelfServiceTicket = 3,
  PatientSelfServiceBooking = 4,
}

export type VisitSourceString =
  | 'WalkInTicket'
  | 'Booking'
  | 'ConsultationBooking'
  | 'PatientSelfServiceTicket'
  | 'PatientSelfServiceBooking'

// Invoice Status
export enum InvoiceStatus {
  Unpaid = 0,
  PartiallyPaid = 1,
  Paid = 2,
  Refunded = 3,
}

export type InvoiceStatusString = 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Refunded'

// Booking Status
export enum BookingStatus {
  Confirmed = 0,
  Cancelled = 1,
  Rescheduled = 2,
  Completed = 3,
}

export type BookingStatusString = 'Confirmed' | 'Cancelled' | 'Rescheduled' | 'Completed'

// Gender
export enum Gender {
  Male = 0,
  Female = 1,
}

export type GenderString = 'Male' | 'Female'

// Encounter Lifecycle State
export enum EncounterLifecycleState {
  Draft = 0,
  InProgress = 1,
  MedicallyCompleted = 2,
  FullyClosed = 3,
}

export type EncounterLifecycleStateString =
  | 'Draft'
  | 'InProgress'
  | 'MedicallyCompleted'
  | 'FullyClosed'

// Encounter Financial State
export enum EncounterFinancialState {
  NotStarted = 0,
  PendingSettlement = 1,
  FinanciallySettled = 2,
}

export type EncounterFinancialStateString =
  | 'NotStarted'
  | 'PendingSettlement'
  | 'FinanciallySettled'

// Urgent Case Mode
export enum UrgentCaseMode {
  Disabled = -1,
  UrgentNext = 0,
  UrgentBucket = 1,
  UrgentFront = 2,
}

export type UrgentCaseModeString = 'Disabled' | 'UrgentNext' | 'UrgentBucket' | 'UrgentFront'

// Lab Request Type
export enum LabRequestType {
  Lab = 0,
  Imaging = 1,
}

export type LabRequestTypeString = 'Lab' | 'Imaging'

// Document Category
export enum DocumentCategory {
  Lab = 0,
  Radiology = 1,
  OtherMedicalDocument = 2,
}

export type DocumentCategoryString = 'Lab' | 'Radiology' | 'OtherMedicalDocument'

// Doctor Compensation Mode
export enum DoctorCompensationMode {
  Salary = 0,
  Percentage = 1,
  FixedPerVisit = 2,
}

export type DoctorCompensationModeString = 'Salary' | 'Percentage' | 'FixedPerVisit'

// Worker Mode (Phase 1 addition)
export enum WorkerMode {
  FullStaff = 0,
  PayrollOnly = 1,
}

export type WorkerModeString = 'FullStaff' | 'PayrollOnly'

// Credit Transaction Type (Deprecated - kept for historical data)
export enum CreditTransactionType {
  Issued = 0,
  Consumed = 1,
  Adjusted = 2,
  Reversed = 3,
  Expired = 4,
}

export type CreditTransactionTypeString =
  | 'Issued'
  | 'Consumed'
  | 'Adjusted'
  | 'Reversed'
  | 'Expired'

// Credit Reason (Deprecated - kept for historical data)
export enum CreditReason {
  DoctorAbsent = 0,
  SessionForceClosedUnserved = 1,
  SessionAutoClosedUnserved = 2,
  ClinicCancellationAfterPayment = 3,
  NoShowRetainedByPolicy = 4,
  ManualAdjustment = 5,
  CreditConsumption = 6,
  CreditExpiration = 7,
}

export type CreditReasonString =
  | 'DoctorAbsent'
  | 'SessionForceClosedUnserved'
  | 'SessionAutoClosedUnserved'
  | 'ClinicCancellationAfterPayment'
  | 'NoShowRetainedByPolicy'
  | 'ManualAdjustment'
  | 'CreditConsumption'
  | 'CreditExpiration'

// Message Channel
export enum MessageChannel {
  WhatsApp = 0,
  PWA = 1,
}

export type MessageChannelString = 'WhatsApp' | 'PWA'

// Message Status
export enum MessageStatus {
  Pending = 0,
  Sending = 1,
  Sent = 2,
  Delivered = 3,
  Read = 4,
  Failed = 5,
  Retrying = 6,
}

export type MessageStatusString =
  | 'Pending'
  | 'Sending'
  | 'Sent'
  | 'Delivered'
  | 'Read'
  | 'Failed'
  | 'Retrying'

// Tenant Status
export enum TenantStatus {
  Active = 0,
  Suspended = 1,
  PendingSetup = 2,
}

export type TenantStatusString = 'Active' | 'Suspended' | 'PendingSetup'

// Subscription Status
export enum SubscriptionStatus {
  Active = 0,
  Trial = 1,
  Expired = 2,
  Cancelled = 3,
}

export type SubscriptionStatusString = 'Active' | 'Trial' | 'Expired' | 'Cancelled'

// Finance Action Type
export enum FinanceActionType {
  Invoice = 0,
  Payment = 1,
  Refund = 2,
  Expense = 3,
}

export type FinanceActionTypeString = 'Invoice' | 'Payment' | 'Refund' | 'Expense'

// Day of Week (matching System.DayOfWeek)
export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export type DayOfWeekString =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'

// ============================================================================
// Utility functions for enum conversion
// ============================================================================

export function getEnumKey<T extends Record<string, string | number>>(
  enumObj: T,
  value: number
): string {
  const keys = Object.keys(enumObj).filter((k) => enumObj[k] === value)
  return keys[0] || ''
}

export function getEnumValue<T extends Record<string, string | number>>(
  enumObj: T,
  key: string
): number {
  return enumObj[key] as number
}
