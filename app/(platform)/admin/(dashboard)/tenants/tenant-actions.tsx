'use client'

import { Ban, CheckCircle, Loader2, MoreVertical, PauseCircle, Settings2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  activateTenantAction,
  blockTenantAction,
  suspendTenantAction,
} from '../../../../../actions/platform/tenant-actions'
import { ManageTenantSheet } from '../../../../../components/admin/manage-tenant-sheet'
import { BaseApiResponse } from '../../../../../types/api' // لازم تستخدم دي
import { ITenant } from '../../../../../types/platform'

interface TenantActionsProps {
  tenant: ITenant
}

export function TenantActions({ tenant }: TenantActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // التعديل الجوهري: شيلنا any واستخدمنا ITenant لأن دي الداتا اللي الـ Action بيرجعها
  const handleAction = (
    actionFn: (id: string) => Promise<BaseApiResponse<ITenant>>,
    successMsg: string,
  ) => {
    startTransition(async () => {
      const res = await actionFn(tenant.id)
      if (res.success) {
        toast.success(successMsg)
      } else {
        toast.error(res.message || 'حدث خطأ')
      }
      setIsMenuOpen(false)
    })
  }

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0' disabled={isPending}>
            {isPending ? (
              <Loader2 className='h-4 w-4 animate-spin text-primary' />
            ) : (
              <MoreVertical className='h-4 w-4 text-muted-foreground' />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-56'>
          <DropdownMenuLabel>إجراءات العيادة</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setIsSheetOpen(true)} className='cursor-pointer'>
            <Settings2 className='ml-2 h-4 w-4' />
            إدارة الخواص والاشتراك
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {tenant.status !== 'Active' && (
            <DropdownMenuItem
              onClick={() => handleAction(activateTenantAction, 'تم تفعيل العيادة بنجاح')}
              className='text-green-600 focus:text-green-600 focus:bg-green-50 cursor-pointer'
            >
              <CheckCircle className='ml-2 h-4 w-4' /> تفعيل
            </DropdownMenuItem>
          )}

          {tenant.status === 'Active' && (
            <DropdownMenuItem
              onClick={() => handleAction(suspendTenantAction, 'تم إيقاف العيادة مؤقتاً')}
              className='text-yellow-600 focus:text-yellow-600 focus:bg-yellow-50 cursor-pointer'
            >
              <PauseCircle className='ml-2 h-4 w-4' /> إيقاف مؤقت
            </DropdownMenuItem>
          )}

          {tenant.status !== 'Blocked' && (
            <DropdownMenuItem
              onClick={() => handleAction(blockTenantAction, 'تم حظر العيادة نهائياً')}
              className='text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer'
            >
              <Ban className='ml-2 h-4 w-4' /> حظر نهائي
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ManageTenantSheet
        tenant={tenant}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </>
  )
}
