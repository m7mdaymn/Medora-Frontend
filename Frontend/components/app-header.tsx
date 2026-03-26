'use client'

import { usePathname } from 'next/navigation'
import { useAuthStore } from '../store/useAuthStore'
import { LogoutButton } from './auth/LogoutButton'
import { ModeToggle } from './ModeToggle'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Separator } from './ui/separator'
import { SidebarTrigger } from './ui/sidebar'
import { DoctorNotesBell } from './DoctorNotesBell'

export function AppHeader() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  // الشرط بقا صريح: أي حد مسموح له يشوف الجرس ما عدا الدكتور
  // (الريسبشن، المدير، المالك)
  const isNotDoctor = user?.role !== 'Doctor'

  const getTitle = () => {
    if (pathname.includes('/patients')) return 'سجل المرضى'
    if (pathname.includes('/staff')) return 'إدارة الموظفين'
    if (pathname.includes('/settings')) return 'الإعدادات'
    if (pathname.includes('/queue')) return 'الطابور'
    return 'الرئيسية'
  }

  return (
    <header className='flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 sticky top-0 z-40 w-full'>
      <SidebarTrigger className='-ml-1' />
      <Separator orientation='vertical' className='mx-2 h-4' />

      <div className='flex-1 flex items-center gap-2 text-sm'>
        <span className='text-muted-foreground'>العيادة</span>
        <span className='text-muted-foreground'>/</span>
        <h2 className='font-semibold text-foreground'>{getTitle()}</h2>
      </div>

      <div className='flex items-center gap-4'>
        {/* الجرس هيظهر لكل أدوار العيادة إلا الدكتور */}
        {isNotDoctor && user?.tenantSlug && <DoctorNotesBell tenantSlug={user.tenantSlug} />}

        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className='h-9 w-9 cursor-pointer border border-primary/20 hover:ring-2 hover:ring-primary/50 transition-all'>
              <AvatarImage src='' />
              <AvatarFallback className='bg-primary/10 text-primary font-bold'>
                {user?.displayName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel>{user?.displayName || 'مستخدم'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
            <LogoutButton />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
