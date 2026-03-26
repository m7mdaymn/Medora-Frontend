// config/roles.ts

export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  CLINIC_OWNER: 'ClinicOwner',
  CLINIC_MANAGER: 'ClinicManager',
  RECEPTIONIST: 'Receptionist',
  DOCTOR: 'Doctor',
  PATIENT: 'Patient',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export const PERMISSIONS = {
  CAN_MANAGE_PATIENTS: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER, ROLES.CLINIC_MANAGER],

  CAN_MANAGE_STAFF: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER],

  CAN_VIEW_FULL_FINANCE: [ROLES.SUPER_ADMIN, ROLES.CLINIC_OWNER],

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
  [ROLES.CLINIC_OWNER]: { label: 'مالك العيادة', variant: 'default' },
  [ROLES.CLINIC_MANAGER]: { label: 'مدير عيادة', variant: 'default' },
  [ROLES.DOCTOR]: { label: 'طبيب', variant: 'default' },
  [ROLES.RECEPTIONIST]: { label: 'استقبال', variant: 'outline' },
  [ROLES.PATIENT]: { label: 'مريض', variant: 'outline' },
}