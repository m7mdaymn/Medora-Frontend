'use client'

import {
  addPartnerOrderCommentAction,
  createVisitPartnerOrderAction,
  listPartnerContractsAction,
  listPartnerOrdersAction,
  listPartnersAction,
  listPartnerServicesAction,
} from '@/actions/partner/workflow'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { IVisit } from '@/types/visit'
import {
  Building2,
  ExternalLink,
  MessageSquareText,
  SendHorizontal,
  Stethoscope,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

type PartnerTypeFilter = 'all' | 'Laboratory' | 'Radiology' | 'Pharmacy'

interface PartnerReferralsTabProps {
  visit: IVisit
  tenantSlug: string
  isClosed?: boolean
}

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

function partnerTypeLabel(value: string): string {
  switch (value) {
    case 'Laboratory':
      return 'معمل'
    case 'Radiology':
      return 'أشعة'
    case 'Pharmacy':
      return 'صيدلية'
    default:
      return value
  }
}

function settlementTargetLabel(value?: string | null): string {
  if (value === 'Doctor') return 'الطبيب مباشرة'
  return 'العيادة'
}

function formatMoney(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return 'غير محدد'
  return `${value.toLocaleString('ar-EG')} ج.م`
}

export function PartnerReferralsTab({ visit, tenantSlug, isClosed }: PartnerReferralsTabProps) {
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<PartnerTypeFilter>('all')
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [selectedContractId, setSelectedContractId] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [customServiceName, setCustomServiceName] = useState('')
  const [estimatedCostInput, setEstimatedCostInput] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [externalReference, setExternalReference] = useState('')
  const [notes, setNotes] = useState('')
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [commentDraftByOrderId, setCommentDraftByOrderId] = useState<Record<string, string>>({})
  const [commentingOrderId, setCommentingOrderId] = useState<string | null>(null)

  const { data: partnersRes } = useSWR(
    ['visit-inline-partners', tenantSlug, partnerTypeFilter],
    () =>
      listPartnersAction(tenantSlug, {
        activeOnly: true,
        type: partnerTypeFilter === 'all' ? undefined : partnerTypeFilter,
        pageNumber: 1,
        pageSize: 200,
      }),
  )

  const { data: contractsRes } = useSWR(
    selectedPartnerId
      ? ['visit-inline-partner-contracts', tenantSlug, selectedPartnerId]
      : null,
    () =>
      listPartnerContractsAction(tenantSlug, {
        partnerId: selectedPartnerId,
        activeOnly: true,
      }),
  )

  const { data: servicesRes } = useSWR(['visit-inline-partner-services', tenantSlug], () =>
    listPartnerServicesAction(tenantSlug, {
      activeOnly: true,
    }),
  )

  const {
    data: ordersRes,
    mutate: mutateOrders,
    isLoading: ordersLoading,
  } = useSWR(['visit-inline-partner-orders', tenantSlug, visit.id], () =>
    listPartnerOrdersAction(tenantSlug, {
      visitId: visit.id,
      pageNumber: 1,
      pageSize: 100,
    }),
  )

  const partners = useMemo(() => partnersRes?.data?.items ?? [], [partnersRes?.data?.items])
  const services = useMemo(() => servicesRes?.data ?? [], [servicesRes?.data])
  const contracts = contractsRes?.data ?? []
  const visitOrders = ordersRes?.data?.items ?? []

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  )

  const selectedServiceEstimatedPatientCost = useMemo(() => {
    if (!selectedService) return null

    const discount = selectedService.patientDiscountPercentage ?? 0
    const safeDiscount = Math.min(Math.max(discount, 0), 100)

    return Number(((selectedService.price * (100 - safeDiscount)) / 100).toFixed(2))
  }, [selectedService])

  const servicesForSelectedPartner = useMemo(() => {
    if (!selectedPartnerId) return []
    return services.filter((service) => service.partnerId === selectedPartnerId)
  }, [services, selectedPartnerId])

  useEffect(() => {
    if (!selectedService) return

    if (selectedService.partnerId !== selectedPartnerId) {
      setSelectedPartnerId(selectedService.partnerId)
      setSelectedContractId('')
    }

    setEstimatedCostInput(selectedService.price.toString())
  }, [selectedService, selectedPartnerId])

  useEffect(() => {
    if (!selectedPartnerId) return

    const exists = partners.some((partner) => partner.id === selectedPartnerId)
    if (!exists) {
      setSelectedPartnerId('')
      setSelectedContractId('')
      setSelectedServiceId('')
    }
  }, [partners, selectedPartnerId])

  const onCreateInlineOrder = async () => {
    if (!selectedPartnerId) {
      toast.error('اختر المزود/الشريك أولاً')
      return
    }

    if (!selectedServiceId && !customServiceName.trim()) {
      toast.error('اختر خدمة من القائمة أو اكتب اسم الخدمة المطلوبة')
      return
    }

    const normalizedCost = estimatedCostInput.trim()
    let estimatedCost: number | undefined

    if (normalizedCost.length > 0) {
      const parsed = Number(normalizedCost)
      if (Number.isNaN(parsed) || parsed < 0) {
        toast.error('قيمة التكلفة التقديرية غير صحيحة')
        return
      }
      estimatedCost = parsed
    }

    setIsCreatingOrder(true)
    try {
      const response = await createVisitPartnerOrderAction(tenantSlug, visit.id, {
        partnerId: selectedPartnerId,
        partnerContractId: selectedContractId || undefined,
        partnerServiceCatalogItemId: selectedServiceId || undefined,
        requestedServiceName: selectedServiceId ? undefined : customServiceName.trim() || undefined,
        estimatedCost,
        clinicalNotes: clinicalNotes.trim() || undefined,
        externalReference: externalReference.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      if (!response.success) {
        toast.error(response.message || 'فشل إنشاء الطلب')
        return
      }

      toast.success('تم إرسال الطلب الخارجي بنجاح')
      setSelectedContractId('')
      setSelectedServiceId('')
      setCustomServiceName('')
      setEstimatedCostInput('')
      setClinicalNotes('')
      setExternalReference('')
      setNotes('')
      await mutateOrders()
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const submitOrderComment = async (orderId: string) => {
    const comment = commentDraftByOrderId[orderId]?.trim()
    if (!comment) {
      toast.error('اكتب التعليق أولاً')
      return
    }

    setCommentingOrderId(orderId)
    try {
      const response = await addPartnerOrderCommentAction(tenantSlug, orderId, {
        comment,
        notifyPatient: true,
      })

      if (!response.success) {
        toast.error(response.message || 'فشل إرسال التعليق')
        return
      }

      toast.success('تم إرسال تعليق المتابعة')
      setCommentDraftByOrderId((current) => ({ ...current, [orderId]: '' }))
      await mutateOrders()
    } finally {
      setCommentingOrderId(null)
    }
  }

  return (
    <div className='w-full mt-2 print:hidden space-y-4'>
      <Card className='relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-sky-50 via-background to-emerald-50 p-4'>
        <div className='absolute -top-16 -right-10 h-36 w-36 rounded-full bg-sky-200/30 blur-3xl' />
        <div className='absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-emerald-200/30 blur-3xl' />

        <div className='relative flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <Stethoscope className='w-4 h-4 text-primary' />
            <h3 className='text-sm font-semibold text-foreground'>إحالات وخدمات خارجية مباشرة</h3>
          </div>

          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='rounded-full bg-background/80'>
              <Building2 className='h-3.5 w-3.5 ml-1' />
              {visitOrders.length} طلب مرتبط
            </Badge>
            <Button asChild size='sm' variant='outline' className='h-8 bg-background/80'>
              <Link href={`/${tenantSlug}/dashboard/partner-orders`}>
                <ExternalLink className='w-3.5 h-3.5 ml-1' />
                إدارة كل الطلبات
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      <Card className='rounded-3xl border border-border/60 p-4 space-y-3'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
          <div className='space-y-2'>
            <Label>نوع الشريك</Label>
            <Select
              value={partnerTypeFilter}
              onValueChange={(value) => setPartnerTypeFilter(value as PartnerTypeFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder='كل الأنواع' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>كل الأنواع</SelectItem>
                <SelectItem value='Laboratory'>معامل</SelectItem>
                <SelectItem value='Radiology'>مراكز أشعة</SelectItem>
                <SelectItem value='Pharmacy'>صيدليات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>المزود/الشريك</Label>
            <Select value={selectedPartnerId || 'none'} onValueChange={(value) => setSelectedPartnerId(value === 'none' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder='اختر الشريك' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>اختر...</SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name} ({partnerTypeLabel(partner.type)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>العقد (اختياري)</Label>
            <Select
              value={selectedContractId || 'none'}
              onValueChange={(value) => setSelectedContractId(value === 'none' ? '' : value)}
              disabled={!selectedPartnerId}
            >
              <SelectTrigger>
                <SelectValue placeholder='اختر عقداً' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>بدون عقد</SelectItem>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.serviceScope || 'عقد عام'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2 md:col-span-2 lg:col-span-3'>
            <Label>اختيار سريع من كل الخدمات المتاحة</Label>
            <Select
              value={selectedServiceId || 'none'}
              onValueChange={(value) => setSelectedServiceId(value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='اختر خدمة من جميع المزودين' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>بدون اختيار</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.serviceName} - {service.partnerName} - {service.price} ج.م
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPartnerId && servicesForSelectedPartner.length > 0 && (
            <div className='space-y-2 md:col-span-2 lg:col-span-3'>
              <Label>خدمات المزود المحدد</Label>
              <div className='flex flex-wrap gap-1.5'>
                {servicesForSelectedPartner.map((service) => (
                  <Button
                    key={service.id}
                    type='button'
                    size='sm'
                    variant={selectedServiceId === service.id ? 'default' : 'outline'}
                    className='h-7 text-xs'
                    onClick={() => setSelectedServiceId(service.id)}
                  >
                    {service.serviceName}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {selectedService && (
            <div className='space-y-2 md:col-span-2 lg:col-span-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3'>
              <p className='text-xs font-semibold text-emerald-700'>
                تفاصيل التسعير والتسوية للخدمة المختارة
              </p>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs'>
                <p className='rounded-md bg-white/80 px-2 py-1'>السعر الأساسي: {formatMoney(selectedService.price)}</p>
                <p className='rounded-md bg-white/80 px-2 py-1'>
                  خصم المريض: {selectedService.patientDiscountPercentage ?? 0}%
                </p>
                <p className='rounded-md bg-white/80 px-2 py-1'>
                  سعر المريض المتوقع: {formatMoney(selectedServiceEstimatedPatientCost)}
                </p>
                <p className='rounded-md bg-white/80 px-2 py-1'>
                  جهة التسوية: {settlementTargetLabel(selectedService.settlementTarget)}
                </p>
                <p className='rounded-md bg-white/80 px-2 py-1'>
                  نسبة التسوية: {selectedService.settlementPercentage}%
                </p>
                <p className='rounded-md bg-white/80 px-2 py-1'>
                  مبلغ ثابت للطبيب: {formatMoney(selectedService.doctorFixedPayoutAmount)}
                </p>
                {selectedService.settlementTarget === 'Clinic' && (
                  <p className='rounded-md bg-white/80 px-2 py-1'>
                    نسبة الطبيب من حصة العيادة: {selectedService.clinicDoctorSharePercentage ?? 0}%
                  </p>
                )}
              </div>
            </div>
          )}

          {!selectedServiceId && (
            <div className='space-y-2 md:col-span-2 lg:col-span-3'>
              <Label>خدمة/عنصر مخصص (إذا غير موجود بالقائمة)</Label>
              <Input
                value={customServiceName}
                onChange={(event) => setCustomServiceName(event.target.value)}
                placeholder='مثال: باقة تحاليل متابعة شهرية'
              />
            </div>
          )}

          <div className='space-y-2'>
            <Label>تكلفة تقديرية (اختياري)</Label>
            <Input
              value={estimatedCostInput}
              onChange={(event) => setEstimatedCostInput(event.target.value)}
              placeholder='مثال: 350'
              type='number'
              min='0'
              step='0.01'
            />
          </div>

          <div className='space-y-2'>
            <Label>مرجع خارجي (اختياري)</Label>
            <Input
              value={externalReference}
              onChange={(event) => setExternalReference(event.target.value)}
              placeholder='رقم طلب/مرجع لدى الشريك'
            />
          </div>

          <div className='space-y-2 md:col-span-2 lg:col-span-3'>
            <Label>ملاحظات الطبيب الإكلينيكية للشريك</Label>
            <Textarea
              value={clinicalNotes}
              onChange={(event) => setClinicalNotes(event.target.value)}
              placeholder='أي تعليمات طبية مهمة مرتبطة بالحالة قبل تنفيذ الخدمة'
              className='min-h-[84px]'
            />
          </div>

          <div className='space-y-2 md:col-span-2 lg:col-span-3'>
            <Label>ملاحظات إدارية (اختياري)</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder='ملاحظات تنظيمية أو تعليمات إضافية'
              className='min-h-[72px]'
            />
          </div>
        </div>

        <div className='flex items-center justify-end gap-2'>
          {isClosed && (
            <span className='text-xs text-amber-600'>الزيارة مكتملة - يمكن إضافة متابعة إذا لزم</span>
          )}
          <Button type='button' onClick={() => void onCreateInlineOrder()} disabled={isCreatingOrder}>
            {isCreatingOrder ? 'جارٍ الإرسال...' : 'إرسال طلب خارجي مباشر'}
          </Button>
        </div>
      </Card>

      <Card className='rounded-3xl border border-border/60 p-4 space-y-3'>
        <div className='flex items-center gap-2'>
          <MessageSquareText className='w-4 h-4 text-muted-foreground' />
          <h4 className='text-sm font-semibold'>طلبات الشركاء المرتبطة بهذه الزيارة</h4>
        </div>

        {ordersLoading ? (
          <p className='text-xs text-muted-foreground'>جارٍ تحميل الطلبات...</p>
        ) : visitOrders.length === 0 ? (
          <p className='text-xs text-muted-foreground'>لا توجد طلبات شريك مرتبطة بهذه الزيارة بعد.</p>
        ) : (
          <div className='space-y-2'>
            {visitOrders.map((order) => (
              <div key={order.id} className='rounded-2xl border border-border/60 bg-background/70 p-3 space-y-2'>
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='text-sm font-bold text-foreground'>
                      {order.serviceNameSnapshot || 'خدمة خارجية'}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {order.partnerName} • {partnerTypeLabel(order.partnerType)}
                    </p>
                  </div>
                  <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px]'>
                  <p className='rounded-lg border border-border/50 bg-muted/20 px-2 py-1 text-muted-foreground'>
                    الطبيب: {order.doctorName || 'غير محدد'}
                  </p>
                  <p className='rounded-lg border border-border/50 bg-muted/20 px-2 py-1 text-muted-foreground'>
                    الموعد:{' '}
                    {order.scheduledAt
                      ? new Date(order.scheduledAt).toLocaleString('ar-EG')
                      : 'لم يحدد بعد'}
                  </p>
                  <p className='rounded-lg border border-border/50 bg-muted/20 px-2 py-1 text-muted-foreground'>
                    التكلفة: {order.finalCost ?? order.estimatedCost ?? order.servicePrice ?? 'غير محددة'}
                  </p>
                  <p className='rounded-lg border border-border/50 bg-muted/20 px-2 py-1 text-muted-foreground'>
                    الرفع: {order.resultUploadedAt ? new Date(order.resultUploadedAt).toLocaleString('ar-EG') : 'لم تُرفع نتيجة'}
                  </p>
                </div>

                {order.resultSummary && (
                  <p className='text-xs rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 p-2'>
                    {order.resultSummary}
                  </p>
                )}

                {order.notes && (
                  <p className='text-[11px] text-muted-foreground'>{order.notes}</p>
                )}

                <div className='flex gap-2'>
                  <Input
                    value={commentDraftByOrderId[order.id] || ''}
                    onChange={(event) =>
                      setCommentDraftByOrderId((current) => ({
                        ...current,
                        [order.id]: event.target.value,
                      }))
                    }
                    placeholder='تعليق متابعة للمريض والشريك'
                  />
                  <Button
                    size='sm'
                    onClick={() => void submitOrderComment(order.id)}
                    disabled={commentingOrderId === order.id}
                    className='shrink-0'
                  >
                    <SendHorizontal className='w-3.5 h-3.5 ml-1' />
                    {commentingOrderId === order.id ? 'جارٍ...' : 'إرسال'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
