'use client'

import { useParams } from 'next/navigation'
import { logoutAction } from '@/actions/auth/logout'
import { useAuthStore } from '@/store/useAuthStore'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const { tenantSlug } = useParams()
  const logoutFromStore = useAuthStore((state) => state.logout)

  const handleLogout = async () => {
    logoutFromStore()

    const slug = typeof tenantSlug === 'string' ? tenantSlug : ''
    await logoutAction(slug)
  }

  return (
    <DropdownMenuItem
    variant='destructive'
    className='cursor-pointer'
      onClick={handleLogout}
    >
      <LogOut className='ml-2 h-4 w-4' />
      <span>تسجيل الخروج</span>
    </DropdownMenuItem>
  )
}
