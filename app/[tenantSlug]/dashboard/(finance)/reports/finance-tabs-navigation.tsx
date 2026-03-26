'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'overview', label: 'نظرة عامة' },
  { id: 'doctors', label: 'حسابات ونسب الأطباء' },
  { id: 'monthly', label: 'التقارير الشهرية' },
]

export function FinanceTabsNavigation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  // الدالة دي بتحافظ على التواريخ (from, to) وبتبدل بس قيمة الـ tab
  const createQueryString = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    // تصفير الباجينيشن لو موجود عشان التاب الجديدة تبدأ من صفحة 1
    params.delete('page')
    return params.toString()
  }

  return (
    <div className='flex items-center gap-2 border-b pb-4 mb-6 overflow-x-auto'>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id
        return (
          <Link
            key={tab.id}
            href={`${pathname}?${createQueryString(tab.id)}`}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
