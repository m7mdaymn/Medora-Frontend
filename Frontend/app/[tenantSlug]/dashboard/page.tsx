import OwnerDashboard from '@/components/dashboard/OwnerDashboard'
import { redirect } from 'next/navigation'
import { getToken } from '../../../actions/auth/getToken'

interface DashboardPageProps {
  params: Promise<{ tenantSlug: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const resolvedParams = await params
  const { tenantSlug } = resolvedParams

  const token = await getToken()

  if (!token) {
    return <div className='p-4 text-center'>يرجى تسجيل الدخول.</div>
  }
  const payloadBase64 = token.split('.')[1]

  const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'))
  const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']

  if (role === 'Doctor') {
    redirect(`/${tenantSlug}/dashboard/doctor/queue`)
  }

  if (role === 'Contractor') {
    redirect(`/${tenantSlug}/dashboard/contractor/orders`)
  }

  if (role === 'Receptionist') {
    redirect(`/${tenantSlug}/dashboard/queue`)
  }

  if (role === 'Nurse') {
    redirect(`/${tenantSlug}/dashboard/notifications`)
  }

  if (role === 'Patient') {
    redirect(`/${tenantSlug}/patient`)
  }

  if (!role) {
    return <div className='p-4 text-center'>غير مصرح لك بالدخول، يرجى تسجيل الدخول.</div>
  }

  switch (role) {
    case 'SuperAdmin':
    case 'ClinicOwner':
    case 'ClinicManager':
      return <OwnerDashboard tenantSlug={tenantSlug} />

    default:
      return <div className='p-4 text-center'>لا توجد لوحة تحكم مخصصة لصلاحياتك.</div>
  }
}
