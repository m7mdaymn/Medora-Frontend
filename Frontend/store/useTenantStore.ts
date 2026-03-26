import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TenantConfig {
  name: string
  logoUrl: string | null
}

interface TenantState {
  config: TenantConfig | null
  setTenantConfig: (config: TenantConfig) => void
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      config: null,
      setTenantConfig: (config) => set({ config }),
    }),
    {
      name: 'tenant-config-storage', // اسم الـ Key في الـ LocalStorage
    },
  ),
)
