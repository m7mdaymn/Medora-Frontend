import {
  Activity,
  Banknote,
  CalendarDays,
  ClipboardList,
  Clock,
  Handshake,
  LayoutDashboard,
  PieChart,
  Receipt,
  Settings,
  Stethoscope,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { UserRole } from './roles'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
}

export type NavCategory = {
  label: string
  items: NavItem[]
}

export const SIDEBAR_NAVIGATION: NavCategory[] = [
  // 1. مساحة عمل الطبيب
  {
    label: 'شاشة الطبيب', // بدل مساحة عمل الطبيب
    items: [
      {
        title: 'كشوفات اليوم', // بدل طابور الكشف (لأن الطابور كلمة مش احترافية للمرضى)
        href: '/doctor/queue',
        icon: Activity,
        roles: ['Doctor'],
      },
      {
        title: 'سجل الكشوفات', // بدل زياراتي
        href: '/doctor/visits',
        icon: CalendarDays,
        roles: ['Doctor'],
      },
      {
        title: 'ملفات المرضى', // بدل سجل مرضاي
        href: '/doctor/patients',
        icon: Users,
        roles: ['Doctor'],
      },
      {
        title: 'إعدادات الكشف', // مخصصة أكتر للدكتور
        href: '/doctor/settings',
        icon: Settings,
        roles: ['Doctor'],
      },
    ],
  },

  // 2. التشغيل والاستقبال
  {
    label: 'الاستقبال والحجوزات', // مصطلح تجاري دقيق
    items: [
      {
        title: 'الرئيسية', // أسهل وأسرع للعين
        href: '/',
        icon: LayoutDashboard,
        roles: ['ClinicOwner', 'ClinicManager', 'Receptionist', 'SuperAdmin'],
      },
      {
        title: 'العيادة الآن', // بتدي انطباع إن دي شاشة الـ Live للمرضى اللي حاضرين
        href: '/queue',
        icon: Clock,
        roles: ['ClinicOwner', 'ClinicManager', 'Receptionist', 'SuperAdmin'],
      },
      {
        title: 'أجندة المواعيد', // المصطلح الأوقع في العيادات
        href: '/appointments',
        icon: CalendarDays,
        roles: ['ClinicOwner', 'ClinicManager', 'Receptionist', 'SuperAdmin'],
      },
      {
        title: 'سجل المرضى',
        href: '/patients',
        icon: Users,
        roles: ['ClinicOwner', 'ClinicManager', 'Receptionist', 'SuperAdmin'],
      },
    ],
  },

  // 3. الإدارة المالية
  {
    label: 'الحسابات والماليات',
    items: [
      {
        title: 'الخزنة والتحصيل', // ده اللي الريسبشن بيعمله فعلاً
        href: '/invoices',
        icon: Receipt,
        roles: ['ClinicOwner', 'ClinicManager', 'Receptionist', 'SuperAdmin'],
      },
      {
        title: 'المصروفات والعهد', // مصطلح مالي أصح
        href: '/expenses',
        icon: Banknote,
        roles: ['ClinicOwner', 'ClinicManager', 'SuperAdmin'],
      },
      {
        title: 'حركة الخزنة والتقارير', // بيفهم صاحب العيادة إن هنا الفلوس
        href: '/reports',
        icon: PieChart,
        roles: ['ClinicOwner', 'ClinicManager', 'SuperAdmin'],
      },
      // {
      //   title: 'تعاقدات الشركات', // أوضح من كلمة تعاقدات مبهمة
      //   href: '/contracts',
      //   icon: Handshake,
      //   roles: ['ClinicOwner', 'ClinicManager', 'SuperAdmin'],
      // },
    ],
  },

  // 4. الإدارة والتشغيل
  {
    label: 'الإدارة والتشغيل',
    items: [
      {
        title: 'إدارة الأطباء',
        href: '/doctors',
        icon: Stethoscope,
        roles: ['ClinicOwner', 'ClinicManager', 'SuperAdmin'],
      },
      {
        title: 'شئون العاملين', // مصطلح HR مظبوط
        href: '/staff',
        icon: ClipboardList,
        roles: ['ClinicOwner', 'ClinicManager', 'SuperAdmin'],
      },
      {
        title: 'لائحة الأسعار', // الكلمة السحرية في أي عيادة للخدمات
        href: '/services',
        icon: Banknote,
        roles: ['ClinicOwner', 'SuperAdmin'],
      },
      {
        title: 'بيانات المنشأة', // أشيك من "إعدادات العيادة"
        href: '/settings',
        icon: Settings,
        roles: ['ClinicOwner', 'SuperAdmin'],
      },
    ],
  },
]
