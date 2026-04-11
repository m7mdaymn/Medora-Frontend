'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { completeVisitAction } from '../../../../../../actions/visit/complete-visit'
import { calculateAge, getChronicDiseases } from '../../../../../../lib/patient-utils'
import { useTenantStore } from '../../../../../../store/useTenantStore'
import { IDoctor } from '../../../../../../types/doctor'
import { IPatientSummary } from '../../../../../../types/patient-app'
import { IVisit } from '../../../../../../types/visit'
import { VisitBillingTab } from './billing-tab'
import { ClinicalTab } from './clinical-tab'
import { LabsTab } from './lab-tab'
import { PartnerReferralsTab } from './partner-referrals-tab'
import { PrescriptionTab } from './prescription-tab'
import PrintablePrescription from './printable-prescription'
import { TerminalHeader } from './terminal-header'

export function VisitTerminalClient({
  visit,
  tenantSlug,
  doctor,
  summary,
}: {
  visit: IVisit
  tenantSlug: string
  defaultTab?: string
  doctor?: IDoctor
  summary: IPatientSummary | null
}) {
  const router = useRouter()
  const [isCompleting, setIsCompleting] = useState(false)
  const tenantConfig = useTenantStore((state) => state.config)
  const isClosed = visit.status === 'Completed' || visit.completedAt !== null

  // تجهيز الداتا عشان نمررها للهيدر والطباعة
  const patientAge = calculateAge(visit.patientDateOfBirth)
  const chronicDiseases = getChronicDiseases(visit.chronicProfile)

  const handleCompleteVisit = async () => {
    setIsCompleting(true)

    try {
      const clinicalForm = document.getElementById('clinical-form') as HTMLFormElement

      if (clinicalForm) {
        await new Promise((resolve) => {
          clinicalForm.requestSubmit()
          setTimeout(resolve, 1000)
        })
      }

      const res = await completeVisitAction(tenantSlug, visit.id)

      if (res.success) {
        toast.success('تم حفظ التعديلات وإنهاء الزيارة بنجاح')
        router.push(`/${tenantSlug}/dashboard/doctor/queue`)
        router.refresh()
      } else {
        toast.error(res.message || 'فشل إنهاء الزيارة')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      toast.error(errorMessage)
      console.error('Visit Completion Error:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className='flex flex-col gap-4 relative w-full'>
      {/* منطقة الشاشة العادية */}
      <div className='print:hidden flex flex-col gap-6 w-full max-w-6xl mx-auto'>
        <TerminalHeader
          visit={visit}
          isClosed={isClosed}
          patientAge={patientAge.toString()}
          chronicDiseases={chronicDiseases}
          tenantSlug={tenantSlug}
          summary={summary}
          isCompleting={isCompleting}
          onComplete={handleCompleteVisit}
        />

        <div className='flex flex-col gap-6 w-full pb-10'>
          <ClinicalTab visit={visit} tenantSlug={tenantSlug} doctor={doctor} isClosed={isClosed} />
          <VisitBillingTab visit={visit} tenantSlug={tenantSlug} isClosed={isClosed} />
          <PrescriptionTab visit={visit} tenantSlug={tenantSlug} isClosed={isClosed} />
          <LabsTab visit={visit} tenantSlug={tenantSlug} isClosed={isClosed} />
          <PartnerReferralsTab visit={visit} tenantSlug={tenantSlug} isClosed={isClosed} />
        </div>
      </div>

      <PrintablePrescription
        visit={visit}
        tenantConfig={tenantConfig}
        doctor={doctor}
        patientAge={patientAge.toString()}
        tenantSlug={tenantSlug}
      />
    </div>
  )
}
