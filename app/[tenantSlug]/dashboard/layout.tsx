import DashboardLayoutClient from '@/components/dashboard-layout-client'

interface LayoutProps {
  children: React.ReactNode
}

export default async function DashboardServerLayout({ children }: LayoutProps) {
  // // 1. بنجيب الرول على السيرفر في 0ms
  // const role = await getUserRole()

  // 2. لو دكتور: ارسمله الـ UI المخصوص بتاعه (بدون سايدبار)
  // if (role === 'Doctor') {
  //   return (
  //     <div className="flex min-h-screen flex-col bg-muted/10">
  //       <DoctorNavbar />
  //       <main className="flex-1 overflow-y-auto no-scrollbar p-6">
  //         <div className="mx-auto max-w-7xl w-full">{children}</div>
  //       </main>
  //     </div>
  //   )
  // }

  // 3. أي موظف تاني: ابعته للـ Client Layout اللي فيه السايدبار
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
