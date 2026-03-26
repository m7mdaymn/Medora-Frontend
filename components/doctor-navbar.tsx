'use client'

import { ClinicImage } from '@/components/shared/clinic-image' // 👈 تأكد من المسار
import { useAuthStore } from '@/store/useAuthStore'
import { useTenantStore } from '@/store/useTenantStore'

import { LogoutButton } from './auth/LogoutButton'
import { ModeToggle } from './ModeToggle'
import { Avatar, AvatarFallback } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export function DoctorNavbar() {
  const { user } = useAuthStore()
  const tenantConfig = useTenantStore((state) => state.config)

  return (
    <header className='sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-6 shadow-sm'>
      <div className='flex items-center gap-3'>
        <div className='relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border bg-background'>
          {/* استخدمنا الـ Component الموحد هنا */}
          <ClinicImage
            src={tenantConfig?.logoUrl}
            alt={tenantConfig?.name || 'Clinic'}
            fill
            fallbackType='logo'
            className='object-contain p-1'
          />
        </div>
        <span className='font-bold text-foreground hidden sm:inline-block text-lg'>
          {tenantConfig?.name || 'العيادة'}
        </span>
      </div>

      <div className='flex items-center gap-3'>
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className='h-9 w-9 cursor-pointer border border-primary/20 hover:ring-2 hover:ring-primary/50 transition-all'>
              <AvatarFallback className='bg-primary/10 text-primary font-bold'>
                {user?.displayName?.charAt(0) || 'D'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel className='flex flex-col'>
              <span>{user?.displayName || 'دكتور'}</span>
              <span className='text-xs text-muted-foreground font-normal'>مساحة عمل الطبيب</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='cursor-pointer'>الملف الشخصي</DropdownMenuItem>
            <DropdownMenuItem className='cursor-pointer'>إعدادات الكشف</DropdownMenuItem>
            <DropdownMenuSeparator />
            <LogoutButton />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
