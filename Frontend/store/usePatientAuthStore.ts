import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ILogin } from '../types/auth'

// 🔴 البيانات اللي محتاجينها فعلاً في الكلاينت (UI فقط)
interface TenantAuthData {
  user: ILogin['user'] | null
  activeProfileId: string | null
  isAuthenticated: boolean
}

interface PatientAuthState {
  tenants: Record<string, TenantAuthData>
  setPatientAuth: (tenantSlug: string, data: ILogin) => void
  setActiveProfile: (tenantSlug: string, profileId: string) => void
  logout: (tenantSlug: string) => void
}

export const usePatientAuthStore = create<PatientAuthState>()(
  persist(
    (set) => ({
      tenants: {},

      setPatientAuth: (tenantSlug, data) => {
        const profiles = data.user.profiles || []
        const defaultProfile = profiles.find((p) => p.isDefault)

        set((state) => ({
          tenants: {
            ...state.tenants,
            [tenantSlug]: {
              user: data.user,
              activeProfileId: defaultProfile?.id || profiles[0]?.id || null,
              isAuthenticated: true,
            },
          },
        }))
      },

      setActiveProfile: (tenantSlug, profileId) =>
        set((state) => ({
          tenants: {
            ...state.tenants,
            [tenantSlug]: {
              ...state.tenants[tenantSlug],
              activeProfileId: profileId,
            },
          },
        })),

      logout: (tenantSlug) =>
        set((state) => {
          const newTenants = { ...state.tenants }
          delete newTenants[tenantSlug]
          return { tenants: newTenants }
        }),
    }),
    { name: 'patient-auth-storage' },
  ),
)
