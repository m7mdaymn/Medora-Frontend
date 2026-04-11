// config/roles.ts

export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  WORKER: 'Worker',
  CLINIC_OWNER: 'ClinicOwner',
  CLINIC_MANAGER: 'ClinicManager',
  RECEPTIONIST: 'Receptionist',
  NURSE: 'Nurse',
  DOCTOR: 'Doctor',
  CONTRACTOR: 'Contractor',
  PATIENT: 'Patient',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export const PERMISSIONS = {
  CAN_MANAGE_PATIENTS: [
    ROLES.SUPER_ADMIN,
    ROLES.CLINIC_OWNER,
    ROLES.CLINIC_MANAGER,
    ROLES.RECEPTIONIST,
    ROLES.NURSE,
  ],

  CAN_MANAGE_STAFF: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.CLINIC_MANAGER],

  CAN_VIEW_FULL_FINANCE: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.CLINIC_MANAGER],

  CAN_MANAGE_BOOKINGS: [
    ROLES.SUPER_ADMIN,
    ROLES.CLINIC_OWNER,
    ROLES.CLINIC_MANAGER,
    ROLES.RECEPTIONIST,
  ],

  CAN_WRITE_PRESCRIPTION: [ROLES.SUPER_ADMIN, ROLES.DOCTOR],
}

export const ROLE_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  [ROLES.SUPER_ADMIN]: { label: 'مدير النظام', variant: 'destructive' },
  [ROLES.WORKER]: { label: 'موظف منصة', variant: 'secondary' },
  [ROLES.CLINIC_OWNER]: { label: 'مالك العيادة', variant: 'default' },
  [ROLES.CLINIC_MANAGER]: { label: 'مدير عيادة', variant: 'default' },
  [ROLES.CONTRACTOR]: { label: 'شريك متعاقد', variant: 'secondary' },
  [ROLES.DOCTOR]: { label: 'طبيب', variant: 'default' },
  [ROLES.NURSE]: { label: 'ممرض', variant: 'outline' },
  [ROLES.RECEPTIONIST]: { label: 'استقبال', variant: 'outline' },
  [ROLES.PATIENT]: { label: 'مريض', variant: 'outline' },
}