import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ILogin, UserProfile } from '../types/auth'

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  setAuth: (data: ILogin) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (data) =>
        set({
          user: data.user,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    { name: 'auth-storage' },
  ),
)
