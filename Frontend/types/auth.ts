import { UserRole } from './api'

export interface UserProfile {
  id: string
  username: string
  displayName: string
  role: UserRole
  tenantId: string | null
  tenantSlug: string | null
  tenantType?: 'Clinic' | 'Partner' | null
  permissions: string[]
  profiles: Array<{
    id: string
    name: string
    isDefault: boolean
    branchId?: string | null
    branchName?: string | null
  }>
}

export interface ILogin {
  token: string
  refreshToken: string
  expiresAt: string
  user: UserProfile
}
