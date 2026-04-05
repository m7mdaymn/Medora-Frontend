'use client'

import {
  adjustSelfServicePaidAmountAction,
  approveSelfServiceRequestAction,
  listSelfServiceRequestsAction,
  rejectSelfServiceRequestAction,
  requestSelfServicePaymentReuploadAction,
} from '@/actions/self-service/requests'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ISelfServiceRequestListItem, SelfServiceRequestStatus } from '@/types/self-service'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

function statusLabel(status: SelfServiceRequestStatus): string {
  switch (status) {
    case 'PendingPaymentReview':
      return 'بانتظار مراجعة الدفع'
    case 'PaymentApproved':
      return 'تمت الموافقة على الدفع'
    case 'ConvertedToQueueTicket':
      return 'تم التحويل لتذكرة'
    case 'ConvertedToBooking':
      return 'تم التحويل لحجز'
    case 'Rejected':
      return 'مرفوض'
    case 'ReuploadRequested':
      return 'طلب إعادة رفع'
    case 'Expired':
      return 'منتهي'
    default:
      return status
  }
}

function statusVariant(status: SelfServiceRequestStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ConvertedToQueueTicket':
    case 'ConvertedToBooking':
      return 'default'
    case 'PaymentApproved':
    case 'ReuploadRequested':
      return 'secondary'
    case 'Rejected':
    case 'Expired':
      return 'destructive'
    default:
      return 'outline'
  }
}

export default function SelfServiceRequestsPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const [workingId, setWorkingId] = useState<string | null>(null)

  const {
    data: requestsRes,
    isLoading,
    mutate,
  } = useSWR(['self-service-requests', tenantSlug], () =>
    listSelfServiceRequestsAction(tenantSlug, {
      pageNumber: 1,
      pageSize: 100,
    }),
  )

  const requests = requestsRes?.data?.items || []

  const runAction = async (
    request: ISelfServiceRequestListItem,
    callback: () => Promise<{ success: boolean; message: string }>,
  ) => {
    setWorkingId(request.id)
    try {
      const response = await callback()
      if (!response.success) {
        toast.error(response.message || 'فشلت العملية')
        return
      }

      toast.success('تم تنفيذ الإجراء')
      await mutate()
    } finally {
      setWorkingId(null)
    }
  }

  const onApprove = async (request: ISelfServiceRequestListItem) => {
    const adjustedPaidAmountInput = window.prompt(
      'قيمة المبلغ المعتمد (اختياري، اتركه فارغاً لاستخدام المبلغ المصرح):',
      request.declaredPaidAmount?.toString() || '',
    )

    const adjustedPaidAmount =
      adjustedPaidAmountInput && adjustedPaidAmountInput.trim().length > 0
        ? Number(adjustedPaidAmountInput)
        : undefined

    if (adjustedPaidAmount !== undefined && Number.isNaN(adjustedPaidAmount)) {
      toast.error('القيمة المدخلة غير صحيحة')
      return
    }

    await runAction(request, async () => {
      const response = await approveSelfServiceRequestAction(tenantSlug, request.id, {
        adjustedPaidAmount,
      })
      return { success: response.success, message: response.message }
    })
  }

  const onReject = async (request: ISelfServiceRequestListItem) => {
    const reason = window.prompt('سبب الرفض:')
    if (!reason || !reason.trim()) return

    await runAction(request, async () => {
      const response = await rejectSelfServiceRequestAction(tenantSlug, request.id, reason.trim())
      return { success: response.success, message: response.message }
    })
  }

  const onRequestReupload = async (request: ISelfServiceRequestListItem) => {
    const reason = window.prompt('سبب طلب إعادة الرفع:')
    if (!reason || !reason.trim()) return

    await runAction(request, async () => {
      const response = await requestSelfServicePaymentReuploadAction(
        tenantSlug,
        request.id,
        reason.trim(),
      )
      return { success: response.success, message: response.message }
    })
  }

  const onAdjustAmount = async (request: ISelfServiceRequestListItem) => {
    const amountInput = window.prompt(
      'المبلغ بعد التعديل:',
      request.adjustedPaidAmount?.toString() || request.declaredPaidAmount?.toString() || '0',
    )

    if (!amountInput) return
    const adjustedPaidAmount = Number(amountInput)

    if (Number.isNaN(adjustedPaidAmount)) {
      toast.error('المبلغ المدخل غير صحيح')
      return
    }

    await runAction(request, async () => {
      const response = await adjustSelfServicePaidAmountAction(tenantSlug, request.id, {
        adjustedPaidAmount,
      })
      return { success: response.success, message: response.message }
    })
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='طلبات الخدمة الذاتية'
        text='مراجعة إثباتات الدفع وتحويل الطلبات إلى تذاكر أو حجوزات'
      />

      {isLoading ? (
        <div className='space-y-2'>
          <Skeleton className='h-24 w-full rounded-2xl' />
          <Skeleton className='h-24 w-full rounded-2xl' />
        </div>
      ) : requests.length === 0 ? (
        <Card className='rounded-2xl p-10 text-center text-muted-foreground'>
          لا توجد طلبات حالياً.
        </Card>
      ) : (
        <div className='space-y-3'>
          {requests.map((request) => {
            const isClosed =
              request.status === 'ConvertedToQueueTicket' ||
              request.status === 'ConvertedToBooking' ||
              request.status === 'Rejected' ||
              request.status === 'Expired'

            return (
              <Card key={request.id} className='rounded-2xl border-border/50 p-4 space-y-3'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='text-sm font-bold'>{request.patientName}</p>
                    <p className='text-xs text-muted-foreground'>
                      د. {request.doctorName} • {request.serviceName}
                    </p>
                  </div>

                  <Badge variant={statusVariant(request.status)}>{statusLabel(request.status)}</Badge>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground'>
                  <div className='rounded-lg border border-border/40 p-2'>
                    تاريخ الطلب: {new Date(request.requestedDate).toLocaleDateString('ar-EG')}
                  </div>
                  <div className='rounded-lg border border-border/40 p-2'>
                    المبلغ المصرح: {request.declaredPaidAmount?.toLocaleString('ar-EG') || 0} ج.م
                  </div>
                  <div className='rounded-lg border border-border/40 p-2'>
                    المبلغ المعتمد: {request.adjustedPaidAmount?.toLocaleString('ar-EG') || '-'}
                  </div>
                </div>

                {!isClosed && (
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      size='sm'
                      onClick={() => void onApprove(request)}
                      disabled={workingId === request.id}
                    >
                      موافقة
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => void onAdjustAmount(request)}
                      disabled={workingId === request.id}
                    >
                      تعديل المبلغ
                    </Button>
                    <Button
                      size='sm'
                      variant='secondary'
                      onClick={() => void onRequestReupload(request)}
                      disabled={workingId === request.id}
                    >
                      طلب إعادة رفع
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => void onReject(request)}
                      disabled={workingId === request.id}
                    >
                      رفض
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
