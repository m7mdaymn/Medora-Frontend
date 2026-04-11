'use client'

import { closeStaleVisitAction } from '@/actions/maintenance/maintenance-actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner' // أو أي مكتبة Toast عندك
import { IStaleVisit } from '../../types/visit'
import { StaleVisitsTable } from './StaleVisitsTable'

interface StaleVisitsManagerProps {
  initialVisits: IStaleVisit[]
  tenantSlug: string
  onRefresh: () => void // عشان نخليه يـ mutate الـ SWR في الـ Parent
}

export function StaleVisitsManager({
  initialVisits,
  tenantSlug,
  onRefresh,
}: StaleVisitsManagerProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [isClosing, setIsClosing] = React.useState(false)

// To Close The Visit
  const handleConfirmClose = async () => {
    if (!selectedId) return

    setIsClosing(true)
    try {
      const res = await closeStaleVisitAction(
        tenantSlug,
        selectedId,
        'إغلاق إداري لتنظيف البيانات المعلقة', 
      )

      if (res.success) {
        toast.success('تم إغلاق الزيارة بنجاح وتنظيف بياناتها')
        onRefresh()
      } else {
        toast.error(res.message || 'فشل في إغلاق الزيارة')
      }
    } catch (err) {
      if (err instanceof Error) toast.error('حدث خطأ غير متوقع')
    } finally {
      setIsClosing(false)
      setSelectedId(null)
    }
  }

  return (
    <>
      {/* Staled Visits Table*/}
      <StaleVisitsTable
        visits={initialVisits}
        onCloseVisit={(id: string) => setSelectedId(id)}
        isPending={isClosing}
      />

      {/* Close Stale Visit Modal*/}
      <AlertDialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-right'>
              هل أنت متأكد من الإغلاق الإجباري؟
            </AlertDialogTitle>
            <AlertDialogDescription className='text-right'>
           سيتم غلق الزيارة بشكل كامل
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='flex-row-reverse gap-2'>
            <AlertDialogAction
            variant={'destructive'}
              onClick={(e) => {
                e.preventDefault() 
                handleConfirmClose()
              }}
              disabled={isClosing}
            >
              {isClosing ? <Loader2 className='size-4 animate-spin' /> : 'تأكيد الإغلاق'}
            </AlertDialogAction>
            <AlertDialogCancel disabled={isClosing}>تراجع</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
