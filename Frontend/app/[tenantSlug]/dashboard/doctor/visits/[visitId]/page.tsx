import { getMeDoctorAction } from '@/actions/doctor/get-me' 
import { getPatientSummaryAction } from '@/actions/patient/get-patient-summary'
import { getVisitAction } from '@/actions/visit/get-visit'
import { VisitTerminalClient } from './visit-terminal-clinic'
import { IDoctor } from '../../../../../../types/doctor'

export default async function Page({
  params,
}: {
  params: Promise<{ visitId: string; tenantSlug: string }>
}) {
  const { visitId, tenantSlug } = await params

  const visitResponse = await getVisitAction(tenantSlug, visitId)

  if (!visitResponse?.success || !visitResponse?.data) {
    return (
      <div className='flex h-full w-full items-center justify-center text-muted-foreground font-bold'>
        الزيارة غير موجودة أو تم حذفها.
      </div>
    )
  }
  const visit = visitResponse.data

  const doctorResponse = await getMeDoctorAction(tenantSlug)
  const doctor = doctorResponse.success ? doctorResponse.data : undefined

  const summaryResponse = await getPatientSummaryAction(tenantSlug, visit.patientId)
  const summary = summaryResponse.success ? summaryResponse.data : null

  return (
    <VisitTerminalClient
      visit={visit}
      tenantSlug={tenantSlug}
      doctor={doctor as IDoctor} 
      summary={summary}
    />
  )
}
