import {
  Activity,
  Building2,
  ClipboardList,
  CreditCard,
  Gauge,
  LayoutDashboard,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'

type PlatformNavItem = {
  title: string
  href: string
  icon: LucideIcon
}

export const SUPER_ADMIN_NAV_ITEMS: PlatformNavItem[] = [
  {
    title: 'نظرة عامة',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'مركز القيادة',
    href: '/admin/control-tower',
    icon: Gauge,
  },
  {
    title: 'إدارة الكيانات (Tenants)',
    href: '/admin/tenants',
    icon: Building2,
  },
  {
    title: 'حالة الكيانات',
    href: '/admin/tenant-status',
    icon: ClipboardList,
  },
  {
    title: 'الاشتراكات والمدفوعات',
    href: '/admin/subscriptions',
    icon: CreditCard,
  },
  {
    title: 'مركز التجديدات',
    href: '/admin/renewal-center',
    icon: Activity,
  },
  {
    title: 'دعم المنصة',
    href: '/admin/support',
    icon: MessageSquare,
  },
  {
    title: 'الفواتير والتحصيل',
    href: '/admin/billing',
    icon: CreditCard,
  },
  {
    title: 'صحة النظام',
    href: '/admin/health',
    icon: Activity,
  },
]

export const WORKER_NAV_ITEMS: PlatformNavItem[] = [
  {
    title: 'إدارة الكيانات (Tenants)',
    href: '/admin/tenants',
    icon: Building2,
  },
  {
    title: 'دعم المنصة',
    href: '/admin/support',
    icon: MessageSquare,
  },
]
