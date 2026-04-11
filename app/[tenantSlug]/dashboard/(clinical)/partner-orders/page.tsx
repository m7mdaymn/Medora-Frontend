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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { IPartnerOrder, PartnerOrderStatus, PartnerType } from '@/types/partner'
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  FilterX,
  TrendingUp,
  UserRound,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

const FILTER_STATUSES: PartnerOrderStatus[] = [
  'Sent',
  'Accepted',
  'InProgress',
  'Completed',
  'Cancelled',
]

const FILTER_PARTNER_TYPES: Array<'Laboratory' | 'Radiology' | 'Pharmacy'> = [
  'Laboratory',
  'Radiology',
  'Pharmacy',
]

type PartnerActionResponse = {
  success: boolean
  message: string
}

function statusLabel(status: PartnerOrderStatus): string {
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

function statusVariant(status: PartnerOrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
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

function partnerTypeLabel(partnerType: PartnerType): string {
  switch (partnerType) {
    case 'Laboratory':
      return 'معمل'
    case 'Radiology':
      return 'أشعة'
    case 'Pharmacy':
      return 'صيدلية'
    default:
      return partnerType
  }
}

function formatCurrency(amount?: number | null): string {
  if (amount == null) return 'غير محددة'
  return `${amount.toLocaleString('ar-EG')} ج.م`
}

function toDateTimeLocal(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (num: number) => String(num).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

export default function PartnerOrdersPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const [statusFilter, setStatusFilter] = useState<PartnerOrderStatus | ''>('')
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<PartnerType | ''>('')
  const [workingOrderId, setWorkingOrderId] = useState<string | null>(null)

  const [scheduleOrder, setScheduleOrder] = useState<IPartnerOrder | null>(null)
  const [scheduleAt, setScheduleAt] = useState('')
  const [scheduleNotes, setScheduleNotes] = useState('')

  const [resultOrder, setResultOrder] = useState<IPartnerOrder | null>(null)
  const [resultSummary, setResultSummary] = useState('')
  const [finalCostInput, setFinalCostInput] = useState('')
  const [resultNotes, setResultNotes] = useState('')

  const [isDialogSaving, setIsDialogSaving] = useState(false)

  const {
    data: ordersRes,
    isLoading,
    mutate,
  } = useSWR(['clinical-partner-orders', tenantSlug, statusFilter, partnerTypeFilter], () =>
    listPartnerOrdersAction(tenantSlug, {
      pageNumber: 1,
      pageSize: 100,
      status: statusFilter || undefined,
      partnerType: partnerTypeFilter || undefined,
    }),
  )

  const orders = useMemo(() => ordersRes?.data?.items ?? [], [ordersRes?.data?.items])

  const orderSummary = useMemo(() => {
    return {
      total: orders.length,
      sent: orders.filter((order) => order.status === 'Sent').length,
      active: orders.filter((order) => order.status === 'Accepted' || order.status === 'InProgress')
        .length,
      completed: orders.filter((order) => order.status === 'Completed').length,
    }
  }, [orders])

  const hasActiveFilters = Boolean(statusFilter || partnerTypeFilter)

  const clearFilters = () => {
    setStatusFilter('')
    setPartnerTypeFilter('')
  }

  const runOrderAction = async (
    orderId: string,
    action: () => Promise<PartnerActionResponse>,
    successMessage: string,
    fallbackError: string,
  ) => {
    setWorkingOrderId(orderId)
    try {
      const response = await action()
      if (!response.success) {
        toast.error(response.message || fallbackError)
        return
      }

      toast.success(successMessage)
      await mutate()
    } finally {
      setWorkingOrderId(null)
    }
  }

  const onAccept = async (order: IPartnerOrder) => {
    await runOrderAction(
      order.id,
      () => acceptPartnerOrderAction(tenantSlug, order.id, 'Accepted from clinic dashboard'),
      'تم قبول الطلب',
      'فشل قبول الطلب',
    )
  }

  const onArrived = async (order: IPartnerOrder) => {
    await runOrderAction(
      order.id,
      () =>
        markPartnerOrderArrivedAction(
          tenantSlug,
          order.id,
          new Date().toISOString(),
          'Patient arrival recorded from clinic dashboard',
        ),
      'تم تسجيل حضور المريض',
      'فشل تسجيل الحضور',
    )
  }

  const openScheduleDialog = (order: IPartnerOrder) => {
    setScheduleOrder(order)
    setScheduleAt(order.scheduledAt ? toDateTimeLocal(order.scheduledAt) : '')
    setScheduleNotes('')
  }

  const submitSchedule = async () => {
    if (!scheduleOrder) return

    if (!scheduleAt.trim()) {
      toast.error('اختر موعد الحضور')
      return
    }

    const parsed = new Date(scheduleAt)
    if (Number.isNaN(parsed.getTime())) {
      toast.error('صيغة الموعد غير صحيحة')
      return
    }

    setIsDialogSaving(true)
    try {
      const response = await schedulePartnerOrderAction(
        tenantSlug,
        scheduleOrder.id,
        parsed.toISOString(),
        scheduleNotes.trim() || undefined,
      )

      if (!response.success) {
        toast.error(response.message || 'فشل تحديد الموعد')
        return
      }

      toast.success('تم تحديد الموعد')
      setScheduleOrder(null)
      await mutate()
    } finally {
      setIsDialogSaving(false)
    }
  }

  const openResultDialog = (order: IPartnerOrder) => {
    setResultOrder(order)
    setResultSummary(order.resultSummary || '')
    setFinalCostInput(order.finalCost != null ? String(order.finalCost) : '')
    setResultNotes('')
  }

  const submitResult = async () => {
    if (!resultOrder) return

    const summary = resultSummary.trim()
    if (!summary) {
      toast.error('اكتب ملخص النتيجة')
      return
    }

    const normalizedCost = finalCostInput.trim()
    let parsedCost: number | undefined

    if (normalizedCost.length > 0) {
      const parsed = Number(normalizedCost)
      if (Number.isNaN(parsed) || parsed < 0) {
        toast.error('قيمة التكلفة النهائية غير صحيحة')
        return
      }

      parsedCost = parsed
    }

    setIsDialogSaving(true)
    try {
      const response = await uploadPartnerResultAction(tenantSlug, resultOrder.id, {
        resultSummary: summary,
        finalCost: parsedCost,
        notes: resultNotes.trim() || undefined,
        resultUploadedAt: new Date().toISOString(),
      })

      if (!response.success) {
        toast.error(response.message || 'فشل رفع النتيجة')
        return
      }

      toast.success('تم رفع النتيجة وإنهاء الطلب')
      setResultOrder(null)
      await mutate()
    } finally {
      setIsDialogSaving(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='طلبات الشركاء'
        text='متابعة دورة الطلبات الخارجية من الإرسال وحتى رفع النتيجة'
      />

      <Card className='relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-sky-50 via-background to-emerald-50 p-5'>
        <div className='absolute -top-20 -left-10 h-44 w-44 rounded-full bg-sky-200/30 blur-3xl' />
        <div className='absolute -bottom-14 -right-8 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl' />

        <div className='relative grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <div className='rounded-2xl border border-border/50 bg-background/75 p-4'>
            <p className='text-xs text-muted-foreground'>إجمالي الطلبات</p>
            <div className='mt-2 flex items-center gap-2'>
              <Building2 className='h-4 w-4 text-primary' />
              <p className='text-2xl font-black'>{orderSummary.total}</p>
            </div>
          </div>

          <div className='rounded-2xl border border-border/50 bg-background/75 p-4'>
            <p className='text-xs text-muted-foreground'>طلبات جديدة</p>
            <div className='mt-2 flex items-center gap-2'>
              <Clock3 className='h-4 w-4 text-amber-600' />
              <p className='text-2xl font-black'>{orderSummary.sent}</p>
            </div>
          </div>

          <div className='rounded-2xl border border-border/50 bg-background/75 p-4'>
            <p className='text-xs text-muted-foreground'>قيد التنفيذ</p>
            <div className='mt-2 flex items-center gap-2'>
              <TrendingUp className='h-4 w-4 text-sky-600' />
              <p className='text-2xl font-black'>{orderSummary.active}</p>
            </div>
          </div>

          <div className='rounded-2xl border border-border/50 bg-background/75 p-4'>
            <p className='text-xs text-muted-foreground'>طلبات مكتملة</p>
            <div className='mt-2 flex items-center gap-2'>
              <CheckCircle2 className='h-4 w-4 text-emerald-600' />
              <p className='text-2xl font-black'>{orderSummary.completed}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className='rounded-3xl border border-border/60 p-4'>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
          <div className='space-y-2'>
            <Label>الحالة</Label>
            <Select
              value={statusFilter || 'all'}
              onValueChange={(value) =>
                setStatusFilter(value === 'all' ? '' : (value as PartnerOrderStatus))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='كل الحالات' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>كل الحالات</SelectItem>
                {FILTER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>نوع الشريك</Label>
            <Select
              value={partnerTypeFilter || 'all'}
              onValueChange={(value) =>
                setPartnerTypeFilter(value === 'all' ? '' : (value as PartnerType))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='كل الأنواع' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>كل الأنواع</SelectItem>
                {FILTER_PARTNER_TYPES.map((partnerType) => (
                  <SelectItem key={partnerType} value={partnerType}>
                    {partnerTypeLabel(partnerType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-end'>
            <Button
              type='button'
              variant='outline'
              className='w-full gap-2'
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              <FilterX className='h-4 w-4' />
              مسح الفلاتر
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className='space-y-3'>
          <Skeleton className='h-40 w-full rounded-2xl' />
          <Skeleton className='h-40 w-full rounded-2xl' />
        </div>
      ) : orders.length === 0 ? (
        <Card className='rounded-3xl border border-dashed p-10 text-center text-muted-foreground'>
          لا توجد طلبات شريك مطابقة للفلتر الحالي.
        </Card>
      ) : (
        <div className='grid gap-4'>
          {orders.map((order) => {
            const isClosed = order.status === 'Completed' || order.status === 'Cancelled'
            const isBusy = workingOrderId === order.id || isDialogSaving
            const isCompleted = order.status === 'Completed'

            const cardTone = isCompleted
              ? 'border-emerald-200/80 bg-emerald-50/40'
              : order.status === 'Cancelled'
                ? 'border-rose-200/80 bg-rose-50/40'
                : 'border-border/60 bg-card'

            return (
              <Card key={order.id} className={`rounded-3xl border p-4 space-y-3 ${cardTone}`}>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='space-y-1'>
                    <p className='text-base font-bold'>{order.serviceNameSnapshot || 'خدمة خارجية'}</p>
                    <p className='text-xs text-muted-foreground'>
                      {order.partnerName} • {partnerTypeLabel(order.partnerType)}
                    </p>
                  </div>

                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='outline'>{formatCurrency(order.finalCost ?? order.estimatedCost ?? order.servicePrice)}</Badge>
                    <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-2 text-xs md:grid-cols-3'>
                  <div className='rounded-xl border border-border/50 bg-background/70 p-2 flex items-center gap-2'>
                    <UserRound className='h-3.5 w-3.5 text-muted-foreground' />
                    <span>{order.patientName || 'مريض غير محدد'}</span>
                  </div>
                  <div className='rounded-xl border border-border/50 bg-background/70 p-2 flex items-center gap-2'>
                    <CalendarClock className='h-3.5 w-3.5 text-muted-foreground' />
                    <span>
                      {order.scheduledAt
                        ? new Date(order.scheduledAt).toLocaleString('ar-EG')
                        : 'بدون موعد حتى الآن'}
                    </span>
                  </div>
                  <div className='rounded-xl border border-border/50 bg-background/70 p-2 flex items-center gap-2'>
                    <Clock3 className='h-3.5 w-3.5 text-muted-foreground' />
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

                {order.notes ? (
                  <div className='rounded-xl border border-border/40 bg-muted/20 p-2 text-xs text-muted-foreground'>
                    {order.notes}
                  </div>
                ) : null}

                <div className='flex flex-wrap gap-2'>
                  {order.status === 'Sent' && (
                    <Button size='sm' onClick={() => void onAccept(order)} disabled={isBusy}>
                      قبول
                    </Button>
                  )}

                  {(order.status === 'Sent' || order.status === 'Accepted') && (
                    <Button
                      size='sm'
                      variant='secondary'
                      onClick={() => openScheduleDialog(order)}
                      disabled={isBusy}
                    >
                      تحديد موعد
                    </Button>
                  )}

                  {(order.status === 'Accepted' || order.status === 'InProgress') && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => void onArrived(order)}
                      disabled={isBusy}
                    >
                      تسجيل وصول المريض
                    </Button>
                  )}

                  {!isClosed && (
                    <Button
                      size='sm'
                      variant='default'
                      onClick={() => openResultDialog(order)}
                      disabled={isBusy}
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

      <Dialog open={Boolean(scheduleOrder)} onOpenChange={(open) => !open && !isDialogSaving && setScheduleOrder(null)}>
        <DialogContent showCloseButton={!isDialogSaving}>
          <DialogHeader>
            <DialogTitle>تحديد موعد حضور المريض</DialogTitle>
            <DialogDescription>
              {scheduleOrder ? `${scheduleOrder.partnerName} • ${scheduleOrder.patientName}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3'>
            <div className='space-y-2'>
              <Label>الموعد</Label>
              <Input
                type='datetime-local'
                value={scheduleAt}
                onChange={(event) => setScheduleAt(event.target.value)}
                disabled={isDialogSaving}
              />
            </div>

            <div className='space-y-2'>
              <Label>ملاحظات (اختياري)</Label>
              <Textarea
                value={scheduleNotes}
                onChange={(event) => setScheduleNotes(event.target.value)}
                placeholder='تفاصيل الموعد أو تعليمات الحضور...'
                disabled={isDialogSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setScheduleOrder(null)}
              disabled={isDialogSaving}
            >
              إلغاء
            </Button>
            <Button type='button' onClick={() => void submitSchedule()} disabled={isDialogSaving}>
              {isDialogSaving ? (
                <>
                  <Clock3 className='ml-2 h-4 w-4 animate-pulse' />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ الموعد'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resultOrder)} onOpenChange={(open) => !open && !isDialogSaving && setResultOrder(null)}>
        <DialogContent showCloseButton={!isDialogSaving}>
          <DialogHeader>
            <DialogTitle>رفع نتيجة الطلب</DialogTitle>
            <DialogDescription>
              {resultOrder ? `${resultOrder.partnerName} • ${resultOrder.patientName}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3'>
            <div className='space-y-2'>
              <Label>ملخص النتيجة</Label>
              <Textarea
                value={resultSummary}
                onChange={(event) => setResultSummary(event.target.value)}
                placeholder='اكتب النتيجة أو ملخص الخدمة المقدمة'
                disabled={isDialogSaving}
              />
            </div>

            <div className='space-y-2'>
              <Label>التكلفة النهائية (اختياري)</Label>
              <Input
                type='number'
                min='0'
                step='0.01'
                value={finalCostInput}
                onChange={(event) => setFinalCostInput(event.target.value)}
                placeholder='مثال: 350'
                disabled={isDialogSaving}
              />
            </div>

            <div className='space-y-2'>
              <Label>ملاحظات داخلية (اختياري)</Label>
              <Textarea
                value={resultNotes}
                onChange={(event) => setResultNotes(event.target.value)}
                placeholder='أي ملاحظات إضافية عن الإغلاق...'
                disabled={isDialogSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setResultOrder(null)}
              disabled={isDialogSaving}
            >
              إلغاء
            </Button>
            <Button type='button' onClick={() => void submitResult()} disabled={isDialogSaving}>
              {isDialogSaving ? (
                <>
                  <Clock3 className='ml-2 h-4 w-4 animate-pulse' />
                  جاري الحفظ...
                </>
              ) : (
                'رفع النتيجة'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
