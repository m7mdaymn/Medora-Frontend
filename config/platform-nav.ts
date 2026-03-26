import { Building2, CreditCard, LayoutDashboard, type LucideIcon } from 'lucide-react'

type PlatformNavItem = {
  title: string
  href: string
  icon: LucideIcon
}

export const SUPER_ADMIN_NAV_ITEMS: PlatformNavItem[] = [
  {
    title: 'نظرة عامة',
    href: '/admin', // الرئيسية للسوبر أدمن
    icon: LayoutDashboard,
  },
  {
    title: 'إدارة العيادات (Tenants)',
    href: '/admin/tenants', // دي اللي هنبنيها النهاردة
    icon: Building2,
  },
  {
    title: 'الاشتراكات والمدفوعات',
    href: '/admin/subscriptions',
    icon: CreditCard,
  },
]
