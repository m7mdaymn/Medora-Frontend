import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/get-user-role'
import { UserRole } from '@/types/api'

interface ManagementLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

// الريسبشن والدكتور ممنوعين من الإدارة
const ALLOWED_ROLES: UserRole[] = ['ClinicOwner', 'ClinicManager', 'SuperAdmin']

export default async function ManagementLayout({ children, params }: ManagementLayoutProps) {
  const { tenantSlug } = await params
  const role = await getUserRole()

  if (!role || !ALLOWED_ROLES.includes(role)) {
    redirect(`/${tenantSlug}/dashboard`)
  }

  return <>{children}</>
}
