'use client'

import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { SUPER_ADMIN_NAV_ITEMS } from '@/config/platform-nav'

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible='icon' side='right'>
      <SidebarHeader className='flex h-16 shrink-0 flex-row items-center gap-2 border-b px-4 text-xl font-bold text-primary'>
        <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground'>
          <ShieldCheck className='h-5 w-5' />
        </div>
        <span className='truncate font-extrabold group-data-[collapsible=icon]:hidden'>
          إدارة المنصة
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>التحكم المركزي</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SUPER_ADMIN_NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className='transition-all duration-200 hover:translate-x-1'
                    >
                      <Link href={item.href}>
                        <item.icon className='h-4 w-4' />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
