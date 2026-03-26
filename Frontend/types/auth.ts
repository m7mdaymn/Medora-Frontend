import { UserRole } from './api'

export interface UserProfile {
  id: string
  username: string
  displayName: string
  role: UserRole
  tenantId: string | null
  tenantSlug: string | null
  permissions: string[]
  profiles: Array<{ id: string; name: string; isDefault: boolean }> // للمرضى فقط
}

export interface ILogin {
  token: string
  refreshToken: string
  expiresAt: string
  user: UserProfile
}
