import { redirect } from 'next/navigation'
import { fetchApi } from '@/lib/fetchApi'
import { UserProfile } from '@/types/auth' // ظبط مسارك
import { AdminSidebar } from '@/components/admin-sidebar'
import { AppHeader } from '@/components/app-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  // بنضرب على API الـ profile والسيرفر بيجيب التوكن من الكوكيز أوتوماتيك من fetchApi بتاعتك
  const res = await fetchApi<UserProfile>('/api/Auth/me', { method: 'GET' })
  // لو مفيش توكن، أو التوكن منتهي، أو مش سوبر أدمن -> طرد فوراً
  if (!res.success || res.data?.role !== 'SuperAdmin') {
    redirect('/admin/login')
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className='h-screen overflow-hidden flex flex-col bg-muted/10'>
        <AppHeader />
        <main className='flex-1 overflow-y-auto no-scrollbar p-6'>
          <div className='max-w-7xl mx-auto'>{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
