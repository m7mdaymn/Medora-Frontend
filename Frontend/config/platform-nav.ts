import {
  Activity,
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  Gauge,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
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
    title: 'إدارة العيادات (Tenants)',
    href: '/admin/tenants',
    icon: Building2,
  },
  {
    title: 'حالة العيادات',
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
    title: 'الفواتير والتحصيل',
    href: '/admin/billing',
    icon: CreditCard,
  },
  {
    title: 'تحليلات المنصة',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'إدارة الخطط',
    href: '/admin/plans',
    icon: Sparkles,
  },
  {
    title: 'إدارة الخواص',
    href: '/admin/feature-flags',
    icon: ShieldCheck,
  },
  {
    title: 'سجل العمليات',
    href: '/admin/audit-log',
    icon: ClipboardList,
  },
  {
    title: 'صلاحيات المنصة',
    href: '/admin/access-control',
    icon: ShieldCheck,
  },
  {
    title: 'صحة النظام',
    href: '/admin/health',
    icon: Activity,
  },
]
