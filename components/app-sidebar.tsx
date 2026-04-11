'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

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
  useSidebar,
} from '@/components/ui/sidebar'

import { SIDEBAR_NAVIGATION } from '@/config/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useTenantStore } from '@/store/useTenantStore'
import { ClinicImage } from './shared/clinic-image'
import { Skeleton } from './ui/skeleton'

export function AppSidebar() {
  const pathname = usePathname()
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const { setOpenMobile, isMobile } = useSidebar()
  const user = useAuthStore((state) => state.user)
  const tenantConfig = useTenantStore((state) => state.config)

  const [isMounted, setIsMounted] = useState(false)

  // 🔴 الحل السحري لتخطي تحذير الـ Cascading Render
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsMounted(true)
    }, 0)

    return () => clearTimeout(timeout)
  }, [])

  const getFullUrl = (href: string) => `/${tenantSlug}/dashboard${href === '/' ? '' : href}`

  const filteredConfig = SIDEBAR_NAVIGATION.map((category) => ({
    ...category,
    items: category.items.filter((item) => user && item.roles.includes(user.role)),
  })).filter((category) => category.items.length > 0)

  const isLoading = !isMounted || !user

  return (
    <Sidebar collapsible='icon' side='right'>
      <SidebarHeader className='flex h-16 shrink-0 flex-row items-center border-b px-4 group-data-[collapsible=icon]:px-0 overflow-hidden'>
        {tenantConfig && isMounted ? (
          <div className='flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center'>
            <div className='relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-background'>
              <ClinicImage
                src={tenantConfig.logoUrl}
                alt={tenantConfig.name || 'Logo'}
                fill
                fallbackType='logo'
                className='object-contain p-0.5'
              />
            </div>
            <span className='truncate text-xl font-extrabold group-data-[collapsible=icon]:hidden'>
              {tenantConfig.name}
            </span>
          </div>
        ) : (
          <div className='flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center'>
            <Skeleton className='h-10 w-10 shrink-0 rounded-md' />
            <Skeleton className='h-5 w-24 group-data-[collapsible=icon]:hidden' />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {isLoading ? (
          <SidebarGroup>
            <SidebarGroupLabel className='group-data-[collapsible=icon]:hidden'>
              <Skeleton className='h-3 w-16 mb-2' />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[1, 2, 3, 4, 5].map((i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuButton disabled className='flex items-center gap-2'>
                      <Skeleton className='h-4 w-4 shrink-0' />
                      <Skeleton className='h-4 w-full max-w-30 group-data-[collapsible=icon]:hidden' />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          filteredConfig.map((category) => (
            <SidebarGroup key={category.label}>
              <SidebarGroupLabel className='text-xs font-bold text-muted-foreground/70 uppercase tracking-widest group-data-[collapsible=icon]:hidden'>
                {category.label}
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu>
                  {category.items.map((item) => {
                    const fullUrl = getFullUrl(item.href)
                    const isExactOnly = item.href === '/' || item.href === '/doctor'
                    const isActive = isExactOnly
                      ? pathname === fullUrl
                      : pathname === fullUrl || pathname.startsWith(`${fullUrl}/`)

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className='transition-all duration-200 hover:bg-primary/5 data-[active=true]:bg-primary/10'
                        >
                          <Link
                            href={fullUrl}
                            onClick={() => {
                              if (isMobile) setOpenMobile(false)
                            }}
                          >
                            <item.icon className='h-4 w-4 shrink-0' />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        )}
      </SidebarContent>
    </Sidebar>
  )
}
