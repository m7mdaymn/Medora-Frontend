import { getMyQueueAction } from '@/actions/doctor/get-my-queue'
import { DashboardHeader, DashboardShell } from '../../../../../components/shell'
import { DoctorTerminalView } from './doctor-terminal-view'

export default async function DoctorQueuePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>
}) {
  const { tenantSlug } = await params

  // بنجيب الداتا (سواء موجودة أو بـ null لو العيادة مقفولة)
  const queueRes = await getMyQueueAction(tenantSlug)
  const initialData = queueRes.success ? queueRes.data : null

  return (
    <DashboardShell>
      <DashboardHeader heading='إدارة العيادة' text='طابور المرضى الحالي' />

      {/* هنرندر التيرمينال دايماً، وهو اللي هيتولى مهمة الشاشتين (مفتوحة أو مغلقة) */}
      <DoctorTerminalView initialData={initialData} tenantSlug={tenantSlug} />
    </DashboardShell>
  )
}
