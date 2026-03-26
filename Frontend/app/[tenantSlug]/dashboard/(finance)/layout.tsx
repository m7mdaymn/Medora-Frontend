import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/get-user-role'
import { UserRole } from '@/types/api'

interface FinanceLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

// الدكتور ممنوع من القسم ده نهائياً
const ALLOWED_ROLES: UserRole[] = ['ClinicOwner', 'ClinicManager', 'SuperAdmin','Receptionist']

export default async function FinanceLayout({ children, params }: FinanceLayoutProps) {
  const { tenantSlug } = await params
  const role = await getUserRole()

  if (!role || !ALLOWED_ROLES.includes(role)) {
    redirect(`/${tenantSlug}/dashboard`)
  }

  return <>{children}</>
}
