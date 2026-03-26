'use client'

import { UserRole } from '@/config/roles'
import { useAuthStore } from '../store/useAuthStore'

export function useUserRole() {
  // بنجيب الـ user من الستور بتاع زوستاند
  const user = useAuthStore((state) => state.user)

  return (user?.role as UserRole) || null
}
