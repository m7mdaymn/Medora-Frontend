'use client'

import { getBranchesAction } from '@/actions/branch/branches'
import { ClinicImage } from '@/components/shared/clinic-image' // 👈 تأكد من المسار
import { useAuthStore } from '@/store/useAuthStore'
import { useBranchSelectionStore } from '@/store/useBranchSelectionStore'
import { useTenantStore } from '@/store/useTenantStore'
import { IBranch } from '@/types/branch'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { LogoutButton } from './auth/LogoutButton'
import { ModeToggle } from './ModeToggle'
import { Avatar, AvatarFallback } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface DoctorNavbarProps {
  tenantSlug: string
}

export function DoctorNavbar({ tenantSlug }: DoctorNavbarProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const tenantConfig = useTenantStore((state) => state.config)
  const [branches, setBranches] = useState<IBranch[]>([])
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)

  const selectedBranchByTenant = useBranchSelectionStore((state) => state.selectedBranchByTenant)
  const setSelectedBranch = useBranchSelectionStore((state) => state.setSelectedBranch)
  const clearSelectedBranch = useBranchSelectionStore((state) => state.clearSelectedBranch)

  const selectedBranchId = selectedBranchByTenant[tenantSlug]

  const canSelectBranch = useMemo(() => {
    if (!tenantSlug || !user) return false
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

      const selectionExists = Boolean(
        selectedBranchId && activeBranches.some((branch) => branch.id === selectedBranchId),
      )
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

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(tenantSlug, branchId)
    syncBranchCookie(branchId)
    router.refresh()
  }

  return (
    <header className='sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-6 shadow-sm'>
      <div className='flex items-center gap-3'>
        <div className='relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border bg-background'>
          {/* استخدمنا الـ Component الموحد هنا */}
          <ClinicImage
            src={tenantConfig?.logoUrl}
            alt={tenantConfig?.name || 'Clinic'}
            fill
            fallbackType='logo'
            className='object-contain p-1'
          />
        </div>
        <span className='font-bold text-foreground hidden sm:inline-block text-lg'>
          {tenantConfig?.name || 'العيادة'}
        </span>
      </div>

      <div className='flex items-center gap-3'>
        {canSelectBranch ? (
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
        ) : null}

        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className='h-9 w-9 cursor-pointer border border-primary/20 hover:ring-2 hover:ring-primary/50 transition-all'>
              <AvatarFallback className='bg-primary/10 text-primary font-bold'>
                {user?.displayName?.charAt(0) || 'D'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel className='flex flex-col'>
              <span>{user?.displayName || 'دكتور'}</span>
              <span className='text-xs text-muted-foreground font-normal'>مساحة عمل الطبيب</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='cursor-pointer'>الملف الشخصي</DropdownMenuItem>
            <DropdownMenuItem className='cursor-pointer'>إعدادات الكشف</DropdownMenuItem>
            <DropdownMenuSeparator />
            <LogoutButton />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
