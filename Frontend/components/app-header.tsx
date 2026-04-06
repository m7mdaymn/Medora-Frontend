'use client'

import { getBranchesAction } from '@/actions/branch/branches'
import { useBranchSelectionStore } from '@/store/useBranchSelectionStore'
import { IBranch } from '@/types/branch'
import { Building2, User } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { LogoutButton } from './auth/LogoutButton'
import { DoctorNotesBell } from './DoctorNotesBell'
import { ModeToggle } from './ModeToggle'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Separator } from './ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { SidebarTrigger } from './ui/sidebar'

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()
  const [branches, setBranches] = useState<IBranch[]>([])
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)

  const selectedBranchByTenant = useBranchSelectionStore((state) => state.selectedBranchByTenant)
  const setSelectedBranch = useBranchSelectionStore((state) => state.setSelectedBranch)
  const clearSelectedBranch = useBranchSelectionStore((state) => state.clearSelectedBranch)

  const tenantSlugParam = params.tenantSlug
  const tenantSlug = Array.isArray(tenantSlugParam) ? tenantSlugParam[0] : tenantSlugParam
  const selectedBranchId = tenantSlug ? selectedBranchByTenant[tenantSlug] : undefined

  const isNotDoctor = user?.role !== 'Doctor'
  const canManageBranches =
    user?.role === 'ClinicOwner' ||
    user?.role === 'BranchManager' ||
    Boolean(user?.permissions?.includes('branch.manage'))

  const canSelectBranch = useMemo(() => {
    if (!user || !tenantSlug) return false
    return user.role !== 'SuperAdmin' && user.role !== 'Worker'
  }, [tenantSlug, user])

  const syncBranchCookie = useCallback((branchId?: string) => {
    if (!tenantSlug || typeof document === 'undefined') return

    const cookieName = `selected_branch_${tenantSlug}`
    if (branchId) {
      document.cookie = `${cookieName}=${branchId}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`
      return
    }

    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`
  }, [tenantSlug])

  useEffect(() => {
    if (!canSelectBranch || !tenantSlug) return

    let isMounted = true

    const loadBranches = async () => {
      setIsLoadingBranches(true)

      const response = await getBranchesAction(tenantSlug, false)
      if (!isMounted) return

      const activeBranches = response.success && response.data
        ? response.data.filter((branch) => branch.isActive)
        : []

      setBranches(activeBranches)

      if (!activeBranches.length) {
        clearSelectedBranch(tenantSlug)
        syncBranchCookie(undefined)
        setIsLoadingBranches(false)
        return
      }

      const selectionExists = Boolean(selectedBranchId && activeBranches.some((b) => b.id === selectedBranchId))
      const nextSelectedBranchId = selectionExists ? selectedBranchId! : activeBranches[0].id

      if (!selectionExists) {
        setSelectedBranch(tenantSlug, nextSelectedBranchId)
      }

      syncBranchCookie(nextSelectedBranchId)
      setIsLoadingBranches(false)
    }

    void loadBranches()

    return () => {
      isMounted = false
    }
  }, [
    canSelectBranch,
    clearSelectedBranch,
    selectedBranchId,
    setSelectedBranch,
    syncBranchCookie,
    tenantSlug,
  ])

  const getTitle = () => {
    if (pathname.includes('/patients')) return 'سجل المرضى'
    if (pathname.includes('/staff')) return 'إدارة الموظفين'
    if (pathname.includes('/settings')) return 'الإعدادات'
    if (pathname.includes('/queue')) return 'الكشفوفات'
    if (pathname.includes('/appointments')) return 'الحجوزات'
    if (pathname.includes('/invoices')) return 'الفواتير'
    if (pathname.includes('/expenses')) return 'المصروفات'
    if (pathname.includes('/reports')) return 'التقارير'
    if (pathname.includes('/doctors')) return 'إدارة الأطباء'
    if (pathname.includes('/services')) return 'الخدمات'
    if (pathname.includes('/contracts')) return 'التعاقدات'
    if (pathname.includes('/store')) return 'المخزون'
    if (pathname.includes('/profile')) return 'الملف الشخصي'
    return 'الرئيسية'
  }

  const handleProfileNavigation = () => {
    if (!tenantSlug) return

    const profilePath =
      user?.role === 'Doctor'
        ? `/${tenantSlug}/dashboard/doctor/profile`
        : `/${tenantSlug}/dashboard/profile`

    router.push(profilePath)
  }

  const handleBranchChange = (branchId: string) => {
    if (!tenantSlug) return
    setSelectedBranch(tenantSlug, branchId)
    syncBranchCookie(branchId)
    router.refresh()
  }

  const openBranchManagement = () => {
    if (!tenantSlug) return
    router.push(`/${tenantSlug}/dashboard/branches`)
  }

  return (
    <header className='flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 sticky top-0 z-40 w-full'>
      <SidebarTrigger className='-ml-1' />
      <Separator orientation='vertical' className='mx-2 h-4' />

      <div className='flex-1 flex items-center gap-2 text-sm'>
        <span className='text-muted-foreground'>العيادة</span>
        <span className='text-muted-foreground'>/</span>
        <h2 className='font-semibold text-foreground'>{getTitle()}</h2>
      </div>

      <div className='flex items-center gap-4'>
        {canSelectBranch ? (
          <div className='flex items-center gap-2'>
            <Select
              value={selectedBranchId}
              onValueChange={handleBranchChange}
              disabled={isLoadingBranches || branches.length === 0}
            >
              <SelectTrigger className='w-36 sm:w-50'>
                <SelectValue placeholder='اختر الفرع' />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canManageBranches ? (
              <Button type='button' size='sm' variant='outline' onClick={openBranchManagement}>
                <Building2 className='h-4 w-4' />
                <span className='hidden sm:inline'>إدارة الفروع</span>
              </Button>
            ) : null}
          </div>
        ) : null}

        {isNotDoctor && user?.tenantSlug && <DoctorNotesBell tenantSlug={user.tenantSlug} />}

        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className='h-9 w-9 cursor-pointer border border-primary/20 hover:ring-2 hover:ring-primary/50 transition-all'>
              <AvatarImage src='' />
              <AvatarFallback className='bg-primary/10 text-primary font-bold'>
                {user?.displayName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel>{user?.displayName || 'مستخدم'}</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem className='cursor-pointer' onClick={handleProfileNavigation}>
              <User className='ml-2 h-4 w-4' />
              <span>الملف الشخصي</span>
            </DropdownMenuItem>

            <LogoutButton />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
