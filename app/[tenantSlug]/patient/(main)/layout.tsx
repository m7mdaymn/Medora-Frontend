import { PatientBottomNav } from '../../../../components/patient/bottom-navigation-mobile'
import { PatientHeader } from '../../../../components/patient/PatientHeader' // 👈 استيراد الهيدر الجديد

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}) {
  return (
    <div className='min-h-screen bg-muted/10 pb-20' dir='rtl'>
      {/* 👇 الهيدر الجديد اللي بيقرأ من الـ Zustand Store */}
      <PatientHeader />

      <main className='p-4 max-w-md mx-auto'>{children}</main>

      <PatientBottomNav />
    </div>
  )
}
