'use client'

import {
  acceptPartnerOrderAction,
  listPartnerOrdersAction,
  markPartnerOrderArrivedAction,
  schedulePartnerOrderAction,
  uploadPartnerResultAction,
} from '@/actions/partner/workflow'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { IPartnerOrder } from '@/types/partner'
import { CalendarClock, CheckCircle2, Clock3, FileText, UserRound } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

function statusLabel(status: string): string {
  switch (status) {
    case 'Sent':
      return 'مرسل'
    case 'Accepted':
      return 'مقبول'
    case 'InProgress':
      return 'جاري التنفيذ'
    case 'Completed':
      return 'مكتمل'
    case 'Cancelled':
      return 'ملغي'
    default:
      return status
  }
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Completed':
      return 'default'
    case 'Cancelled':
      return 'destructive'
    case 'Accepted':
    case 'InProgress':
      return 'secondary'
    default:
      return 'outline'
  }
}

export default function ContractorOrdersPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const [workingOrderId, setWorkingOrderId] = useState<string | null>(null)

  const {
    data: ordersRes,
    isLoading,
    mutate,
  } = useSWR(['contractor-orders', tenantSlug], () =>
    listPartnerOrdersAction(tenantSlug, {
      pageNumber: 1,
      pageSize: 100,
    }),
  )

  const orders = ordersRes?.data?.items || []

  const runOrderAction = async (orderId: string, action: () => Promise<unknown>) => {
    setWorkingOrderId(orderId)
    try {
      await action()
      await mutate()
    } finally {
      setWorkingOrderId(null)
    }
  }

  const onAccept = async (order: IPartnerOrder) => {
    await runOrderAction(order.id, async () => {
      const response = await acceptPartnerOrderAction(tenantSlug, order.id, 'Accepted by contractor')
      if (!response.success) {
        toast.error(response.message || 'فشل قبول الطلب')
        return
      }
      toast.success('تم قبول الطلب')
    })
  }

  const onSchedule = async (order: IPartnerOrder) => {
    const input = window.prompt('أدخل موعد الحضور (مثال: 2026-04-06 09:00):')
    if (!input) return

    const parsed = new Date(input)
    if (Number.isNaN(parsed.getTime())) {
      toast.error('صيغة الموعد غير صحيحة')
      return
    }

    await runOrderAction(order.id, async () => {
      const response = await schedulePartnerOrderAction(
        tenantSlug,
        order.id,
        parsed.toISOString(),
        'Scheduled by contractor',
      )
      if (!response.success) {
        toast.error(response.message || 'فشل جدولة الطلب')
        return
      }
      toast.success('تم تحديد الموعد')
    })
  }

  const onArrived = async (order: IPartnerOrder) => {
    await runOrderAction(order.id, async () => {
      const response = await markPartnerOrderArrivedAction(
        tenantSlug,
        order.id,
        new Date().toISOString(),
        'Patient arrived at partner facility',
      )
      if (!response.success) {
        toast.error(response.message || 'فشل تسجيل الحضور')
        return
      }
      toast.success('تم تسجيل حضور المريض')
    })
  }

  const onUploadResult = async (order: IPartnerOrder) => {
    const resultSummary = window.prompt('اكتب ملخص النتيجة:')
    if (!resultSummary) return

    const finalCostInput = window.prompt('التكلفة النهائية (اختياري):', order.finalCost?.toString() || '')
    const parsedCost =
      finalCostInput && finalCostInput.trim().length > 0 ? Number(finalCostInput.trim()) : undefined

    if (parsedCost !== undefined && Number.isNaN(parsedCost)) {
      toast.error('قيمة التكلفة النهائية غير صحيحة')
      return
    }

    await runOrderAction(order.id, async () => {
      const response = await uploadPartnerResultAction(tenantSlug, order.id, {
        resultSummary,
        finalCost: parsedCost,
        notes: 'Result uploaded by contractor',
        resultUploadedAt: new Date().toISOString(),
      })

      if (!response.success) {
        toast.error(response.message || 'فشل رفع النتيجة')
        return
      }

      toast.success('تم رفع النتيجة وإنهاء الطلب')
    })
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='طلبات الخدمات الخارجية'
        text='استلام الطلب، تحديد الموعد، تسجيل حضور المريض، ورفع النتيجة'
      />

      {isLoading ? (
        <div className='space-y-3'>
          <Skeleton className='h-40 w-full rounded-2xl' />
          <Skeleton className='h-40 w-full rounded-2xl' />
        </div>
      ) : orders.length === 0 ? (
        <Card className='rounded-2xl p-10 text-center text-muted-foreground'>
          لا توجد طلبات شريك متاحة حالياً.
        </Card>
      ) : (
        <div className='grid gap-3'>
          {orders.map((order) => {
            const isWorking = workingOrderId === order.id
            const isClosed = order.status === 'Completed' || order.status === 'Cancelled'

            return (
              <Card key={order.id} className='rounded-2xl p-4 border-border/50 space-y-3'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='text-base font-bold'>{order.serviceNameSnapshot || 'خدمة خارجية'}</p>
                    <p className='text-xs text-muted-foreground'>{order.partnerName}</p>
                  </div>
                  <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-xs'>
                  <div className='rounded-lg bg-muted/30 p-2 flex items-center gap-2'>
                    <UserRound className='w-3.5 h-3.5 text-muted-foreground' />
                    <span>{order.patientName || 'مريض غير محدد'}</span>
                  </div>
                  <div className='rounded-lg bg-muted/30 p-2 flex items-center gap-2'>
                    <CalendarClock className='w-3.5 h-3.5 text-muted-foreground' />
                    <span>
                      {order.scheduledAt
                        ? new Date(order.scheduledAt).toLocaleString('ar-EG')
                        : 'بدون موعد حتى الآن'}
                    </span>
                  </div>
                  <div className='rounded-lg bg-muted/30 p-2 flex items-center gap-2'>
                    <Clock3 className='w-3.5 h-3.5 text-muted-foreground' />
                    <span>
                      {order.resultUploadedAt
                        ? `النتيجة: ${new Date(order.resultUploadedAt).toLocaleString('ar-EG')}`
                        : 'لم يتم رفع نتيجة'}
                    </span>
                  </div>
                </div>

                {order.resultSummary && (
                  <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 flex items-start gap-2'>
                    <FileText className='w-3.5 h-3.5 mt-0.5' />
                    <span>{order.resultSummary}</span>
                  </div>
                )}

                <div className='flex flex-wrap gap-2'>
                  {order.status === 'Sent' && (
                    <Button size='sm' onClick={() => onAccept(order)} disabled={isWorking}>
                      قبول
                    </Button>
                  )}

                  {(order.status === 'Sent' || order.status === 'Accepted') && (
                    <Button size='sm' variant='secondary' onClick={() => onSchedule(order)} disabled={isWorking}>
                      تحديد موعد
                    </Button>
                  )}

                  {(order.status === 'Accepted' || order.status === 'InProgress') && (
                    <Button size='sm' variant='outline' onClick={() => onArrived(order)} disabled={isWorking}>
                      تسجيل وصول المريض
                    </Button>
                  )}

                  {!isClosed && (
                    <Button
                      size='sm'
                      variant='default'
                      onClick={() => onUploadResult(order)}
                      disabled={isWorking}
                      className='gap-1'
                    >
                      <CheckCircle2 className='w-3.5 h-3.5' />
                      رفع النتيجة وإنهاء
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
