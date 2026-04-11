import { getUserRole } from '@/lib/get-user-role'
import { UserRole } from '@/types/api'
import { redirect } from 'next/navigation'

interface ClinicalLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

const ALLOWED_ROLES: UserRole[] = ['ClinicOwner', 'ClinicManager', 'Receptionist', 'SuperAdmin']

export default async function ClinicalLayout({ children, params }: ClinicalLayoutProps) {
  const { tenantSlug } = await params
  const role = await getUserRole()
  console.log(role)

  if (!role || !ALLOWED_ROLES.includes(role)) {
    redirect(`/${tenantSlug}/dashboard`)
  }

  return <>{children}</>
}
