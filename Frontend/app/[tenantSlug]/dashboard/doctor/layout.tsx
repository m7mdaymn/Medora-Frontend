import { redirect } from "next/navigation"
import { SendDoctorNoteModal } from "../../../../components/SendDoctorNoteModal"
import { getUserRole } from "../../../../lib/get-user-role"

interface DoctorLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}


export default async function DoctorLayout({ children, params }: DoctorLayoutProps) {
  const { tenantSlug } = await params
  const role = await getUserRole()

  if (role !== 'Doctor') {
    redirect(`/${tenantSlug}/dashboard`)
  }

  return (
    <div className='relative min-h-screen'>
      <main>{children}</main>

      {/* الدايرة الصغيرة المحشورة في الزاوية */}
      <div className='fixed bottom-6 right-6 z-50'>
        <SendDoctorNoteModal tenantSlug={tenantSlug} />
      </div>
    </div>
  )
}
