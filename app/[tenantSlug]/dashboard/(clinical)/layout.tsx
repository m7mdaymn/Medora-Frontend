import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/get-user-role'
import { UserRole } from '@/types/api'

interface ClinicalLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

// الريسبشن والمديرين مسموح لهم يدخلوا القسم ده
const ALLOWED_ROLES: UserRole[] = [
  'ClinicOwner',
  'ClinicManager',
  'Receptionist',
  'SuperAdmin',
]

export default async function ClinicalLayout({ children, params }: ClinicalLayoutProps) {
  const { tenantSlug } = await params
  const role = await getUserRole()

  if (!role || !ALLOWED_ROLES.includes(role)) {
    redirect(`/${tenantSlug}/dashboard`)
  }

  return <>{children}</>
}