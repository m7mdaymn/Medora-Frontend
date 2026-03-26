import { DashboardHeader, DashboardShell } from '@/components/shell'
import { IDoctorVisitConfig } from '@/types/doctor'
import { getMyVisitFieldsAction } from '../../../../../actions/doctor/get-my-visit-fields'
import { VisitFieldsClient } from './visit-fields-client'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function DoctorSettingsPage({ params }: Props) {
  const { tenantSlug } = await params

  // جلب الإعدادات الحالية من السيرفر
  const res = await getMyVisitFieldsAction(tenantSlug)

  // هندلة لو الدكتور لسه ملوش إعدادات (أول مرة يفتح)
  const initialConfig: IDoctorVisitConfig = res.data || {
    bloodPressure: false,
    heartRate: false,
    temperature: false,
    weight: false,
    height: false,
    bmi: false,
    bloodSugar: false,
    oxygenSaturation: false,
    respiratoryRate: false,
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='إعدادات شاشة الكشف'
        text='قم بتفعيل الحقول والعلامات الحيوية التي ترغب في ظهورها دائماً أثناء كشفك على المرضى.'
      />
      <div className='max-w-5xl mx-auto w-full'>
        <VisitFieldsClient tenantSlug={tenantSlug} initialConfig={initialConfig} />
      </div>
    </DashboardShell>
  )
}
