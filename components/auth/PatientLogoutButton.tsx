'use client'

import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { usePatientAuthStore } from '@/store/usePatientAuthStore'
import { LogOut } from 'lucide-react'
import { useParams } from 'next/navigation'
import { patientLogoutAction } from '../../actions/auth/patient-logout'

interface Props {
  variant?: 'menu-item' | 'button'
}

export function PatientLogoutButton({ variant = 'button' }: Props) {
  const { tenantSlug } = useParams()
  const logoutFromStore = usePatientAuthStore((state) => state.logout)
  const slug = typeof tenantSlug === 'string' ? tenantSlug : ''

  const handleLogout = async () => {
    // 1. مسح من الـ Zustand
    logoutFromStore(slug)
    // 2. مسح الكوكيز والسيشن من السيرفر
    await patientLogoutAction(slug)
    // 3. توجيه للوجن
    window.location.href = `/${slug}/patient/login`
  }

  // 🔥 التعديل هنا: خليناها JSX Variable مش Component
  const content = (
    <>
      <LogOut className='h-4 w-4 ml-2' />
      <span className='font-bold'>تسجيل الخروج</span>
    </>
  )

  if (variant === 'menu-item') {
    return (
      <DropdownMenuItem
        className='text-destructive focus:text-destructive cursor-pointer'
        onClick={handleLogout}
      >
        {content}
      </DropdownMenuItem>
    )
  }

  return (
    <Button
      variant='destructive'
      className='w-full rounded-2xl  shadow-lg shadow-destructive/10'
      onClick={handleLogout}
    >
      {content}
    </Button>
  )
}
