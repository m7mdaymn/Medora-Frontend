import OwnerDashboard from '@/components/dashboard/OwnerDashboard'
import { redirect } from 'next/navigation'
import { getToken } from '../../../actions/auth/getToken'

interface DashboardPageProps {
  params: Promise<{ tenantSlug: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { tenantSlug } = await params
  const token = await getToken()

  if (!token) redirect('/login') // ابعته لصفحة اللوجين أرحم من رسالة نصية

  // فك التوكن - يفضل تكون في Utility Function عشان متكررش الكود
  const payloadBase64 = token.split('.')[1]
  const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'))
  const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']

  // المنطق الجديد للتحويل (The Routing Logic)

  if (role === 'Doctor') {
    redirect(`/${tenantSlug}/dashboard/doctor/queue`)
  }

  if (role === 'Receptionist') {
    redirect(`/${tenantSlug}/dashboard/queue`)
  }

  // الـ Roles اللي ليها Dashboard فعلي (UI)
  switch (role) {
    case 'ClinicOwner':
    case 'ClinicManager':
      return <OwnerDashboard tenantSlug={tenantSlug} />

    default:
      return (
        <div className='flex h-[50vh] items-center justify-center text-destructive'>
          لا توجد لوحة تحكم مخصصة لصلاحياتك أو غير مصرح لك بالدخول.
        </div>
      )
  }
}
