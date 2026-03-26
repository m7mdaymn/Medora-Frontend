'use client'

import { Home, CalendarDays, FileText, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export function PatientBottomNav() {
  const pathname = usePathname()
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  // خريطة الصفحات الحقيقية بناءً على البيزنس بتاعنا
  const navItems = [
    { name: 'الرئيسية', href: `/${tenantSlug}/patient`, icon: Home },
    { name: 'حجوزاتي', href: `/${tenantSlug}/patient/bookings`, icon: CalendarDays },
    { name: 'السجل', href: `/${tenantSlug}/patient/history`, icon: FileText },
    { name: 'حسابي', href: `/${tenantSlug}/patient/profile`, icon: User },
  ]

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around bg-background border-t shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] pb-safe dir-rtl'>
      {navItems.map((item) => {
        // لو المسار الحالي هو نفس مسار اللينك، يبقى هو Active
        const isActive = pathname === item.href

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 w-16 transition-all duration-200',
              isActive
                ? 'text-primary scale-110' // Active State
                : 'text-muted-foreground hover:text-foreground',
            )}
            prefetch={false}
          >
            <item.icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
            <span className='text-[10px] font-medium'>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
