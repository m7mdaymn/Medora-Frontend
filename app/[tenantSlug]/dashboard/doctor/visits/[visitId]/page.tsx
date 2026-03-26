import { getMyVisitFieldsAction } from '@/actions/doctor/get-my-visit-fields'
import { getPatientSummaryAction } from '@/actions/patient/get-patient-summary'
import { getVisitAction } from '@/actions/visit/get-visit'
import { IDoctor } from '@/types/doctor'
import { VisitTerminalClient } from './visit-terminal-client'

export default async function Page({
  params,
}: {
  params: Promise<{ visitId: string; tenantSlug: string }>
}) {
  const { visitId, tenantSlug } = await params

  // 1. جلب بيانات الزيارة
  const visitResponse = await getVisitAction(tenantSlug, visitId)

  if (!visitResponse.success || !visitResponse.data) {
    return (
      <div className='flex h-full w-full items-center justify-center text-muted-foreground font-bold'>
        الزيارة غير موجودة أو تم حذفها.
      </div>
    )
  }
  const visit = visitResponse.data

  // 2. جلب إعدادات حقول الكشف الخاصة بالدكتور الحالي
  const fieldsResponse = await getMyVisitFieldsAction(tenantSlug)

  // بناء أوبجيكت وهمي للدكتور عشان الـ Component ميضربش
  const doctorMock = {
    visitFieldConfig: fieldsResponse.success ? fieldsResponse.data : null,
  } as unknown as IDoctor

  // 3. جلب التاريخ المرضي للمريض (للسلايدر الجانبي)
  const summaryResponse = await getPatientSummaryAction(tenantSlug, visit.patientId)
  const summary = summaryResponse.success ? summaryResponse.data : null

  return (
    <VisitTerminalClient
      visit={visit}
      tenantSlug={tenantSlug}
      doctor={doctorMock}
      summary={summary}
    />
  )
}
