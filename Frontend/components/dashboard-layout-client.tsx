'use client'

import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='h-screen overflow-hidden flex flex-col'>
        <AppHeader />
        <main className='flex-1 overflow-y-auto no-scrollbar p-6'>
          <div>{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
