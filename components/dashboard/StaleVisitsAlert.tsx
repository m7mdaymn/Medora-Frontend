'use client'

import { getStaleVisitsAction } from '@/actions/maintenance/maintenance-actions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AlertTriangle, ListFilter } from 'lucide-react'
import useSWR from 'swr'
import { StaleVisitsManager } from './StaleVisitsManager'

interface StaleVisitsAlertProps {
  tenantSlug: string
}

export function StaleVisitsAlert({ tenantSlug }: StaleVisitsAlertProps) {
  const {
    data: staleRes,
    mutate,
    isLoading,
  } = useSWR(['stale-visits', tenantSlug], ([, slug]) => getStaleVisitsAction(slug, 12), {
    revalidateOnFocus: true,
  })

  const staleVisits = staleRes?.data || []
  const count = staleVisits.length

  if (isLoading || count === 0) return null

  return (
    <div className='mb-6 '>
      <Alert className='border border-border bg-card text-card-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 shadow-sm gap-4'>
        <div className='flex items-center gap-4'>
          {/* 2. أيقونة محايدة جوه Box احترافي */}
          <div className='bg-muted border border-border p-2.5 rounded-md shrink-0'>
            <AlertTriangle className='size-5 text-muted-foreground' />
          </div>

          <div>
            <AlertTitle className='font-bold text-base tracking-tight'>
              تنبيه سلامة البيانات: زيارات معلقة
            </AlertTitle>
            <AlertDescription className='text-sm text-muted-foreground mt-1'>
              يوجد {count} زيارات غير مغلقة من أيام سابقة. عدم إغلاقها يؤثر على دقة إحصائيات النظام.
            </AlertDescription>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            {/* 4. زرار Outline شيك ومحايد */}
            <Button
              variant='outline'
              size='sm'
              className='shrink-0 gap-2 font-medium hover:bg-muted/50'
            >
              <ListFilter className='size-4' />
              مراجعة وتنظيف
            </Button>
          </DialogTrigger>

          {/* Modal Content */}
          <DialogContent className='max-w-4xl max-h-[85vh] flex flex-col overflow-hidden p-0 gap-0'>
            <DialogHeader className='p-6 border-b bg-muted/20'>
              <DialogTitle className='text-right text-xl'>إغلاق الزيارات المعلقة</DialogTitle>
            </DialogHeader>

            <div className='flex-1 overflow-y-auto p-6'>
              <StaleVisitsManager
                initialVisits={staleVisits}
                tenantSlug={tenantSlug}
                onRefresh={() => mutate()}
              />
            </div>
          </DialogContent>
        </Dialog>
      </Alert>
    </div>
  )
}
