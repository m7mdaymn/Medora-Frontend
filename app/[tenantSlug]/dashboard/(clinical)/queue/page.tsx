import { getDoctorsAction } from '@/actions/doctor/get-doctors'
import { getQueueBoard } from '@/actions/queue/queue-board'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { QueueActions } from './queue-actions'
import { QueueView } from './queue-view'

export default async function QueuePage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params

  // 1. جلب الداتا بالتوازي من السيرفر (شيلنا جلب المرضى)
  const [boardRes, doctorsRes] = await Promise.all([
    getQueueBoard(tenantSlug),
    getDoctorsAction(tenantSlug),
  ])

  // 2. تجهيز الداتا لزراير الأكشن
  const doctors = doctorsRes?.doctors || []

  return (
    <DashboardShell>
      <DashboardHeader heading='كشوفات اليوم' text={`مراقبة العيادات وإصدار التذاكر.`}>
        <QueueActions tenantSlug={tenantSlug} doctors={doctors} initialBoardRes={boardRes} />
      </DashboardHeader>

      <QueueView tenantSlug={tenantSlug} initialBoardRes={boardRes} doctors={doctors} />
    </DashboardShell>
  )
}
