'use client'

import { addInvoiceLineItemAction } from '@/actions/finance/invoices'
import { getClinicServicesAction } from '@/actions/service/clinic-services'
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
import { IClinicService } from '@/types/services'
import { IInvoice, IVisit } from '@/types/visit'
import { Banknote, Loader2, PackagePlus, ReceiptText } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

type BillingMode = 'service' | 'item'

interface VisitBillingTabProps {
  visit: IVisit
  tenantSlug: string
  isClosed?: boolean
}

function formatMoney(value: number): string {
  return `${value.toLocaleString('ar-EG')} ج.م`
}

function statusLabel(status: string): string {
  switch (status) {
    case 'Paid':
      return 'مدفوعة'
    case 'PartiallyPaid':
      return 'دفع جزئي'
    case 'Refunded':
      return 'مرتجعة'
    default:
      return 'غير مدفوعة'
  }
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Paid':
      return 'default'
    case 'PartiallyPaid':
      return 'secondary'
    case 'Refunded':
      return 'outline'
    default:
      return 'destructive'
  }
}

export function VisitBillingTab({ visit, tenantSlug, isClosed }: VisitBillingTabProps) {
  const [invoice, setInvoice] = useState<IInvoice | null>(visit.invoice)
  const [mode, setMode] = useState<BillingMode>('service')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [itemName, setItemName] = useState('')
  const [quantityInput, setQuantityInput] = useState('1')
  const [unitPriceInput, setUnitPriceInput] = useState('')
  const [lineNotes, setLineNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: servicesPage, isLoading: servicesLoading } = useSWR(
    ['visit-inline-clinic-services', tenantSlug],
    () => getClinicServicesAction(tenantSlug, 1, 200, true),
  )

  const services = useMemo(() => servicesPage?.items ?? [], [servicesPage?.items])

  const selectedService = useMemo<IClinicService | null>(() => {
    return services.find((service) => service.id === selectedServiceId) ?? null
  }, [services, selectedServiceId])

  useEffect(() => {
    setInvoice(visit.invoice)
  }, [visit.invoice])

  useEffect(() => {
    if (mode !== 'service' || !selectedService) return
    setUnitPriceInput(String(selectedService.defaultPrice))
  }, [mode, selectedService])

  const handleAddLineItem = async () => {
    if (!invoice?.id) {
      toast.error('لا توجد فاتورة مرتبطة بهذه الزيارة')
      return
    }

    if (isClosed) {
      toast.error('لا يمكن تعديل الفاتورة بعد إغلاق الزيارة من شاشة الطبيب')
      return
    }

    const quantity = Number(quantityInput)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error('الكمية يجب أن تكون رقمًا صحيحًا أكبر من صفر')
      return
    }

    const unitPrice = Number(unitPriceInput)
    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      toast.error('سعر الوحدة غير صحيح')
      return
    }

    let normalizedName = ''
    let clinicServiceId: string | undefined

    if (mode === 'service') {
      if (!selectedService) {
        toast.error('اختر خدمة من قائمة الخدمات أولاً')
        return
      }
      normalizedName = selectedService.name
      clinicServiceId = selectedService.id
    } else {
      normalizedName = itemName.trim()
      if (!normalizedName) {
        toast.error('اكتب اسم البند/العنصر')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const response = await addInvoiceLineItemAction(tenantSlug, invoice.id, {
        clinicServiceId,
        itemName: normalizedName,
        unitPrice,
        quantity,
        notes: lineNotes.trim() || undefined,
      })

      if (!response.success || !response.data) {
        toast.error(response.message || 'فشلت إضافة البند')
        return
      }

      setInvoice(response.data)
      setQuantityInput('1')
      setLineNotes('')

      if (mode === 'item') {
        setItemName('')
        setUnitPriceInput('')
      } else if (selectedService) {
        setUnitPriceInput(String(selectedService.defaultPrice))
      }

      toast.success('تمت إضافة البند وتحديث الفاتورة')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='w-full mt-2 print:hidden space-y-4'>
      <Card className='relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-amber-50 via-background to-sky-50 p-4 space-y-4'>
        <div className='absolute -top-14 -right-8 h-28 w-28 rounded-full bg-amber-200/30 blur-3xl' />
        <div className='absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-sky-200/30 blur-3xl' />

        <div className='relative flex items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <ReceiptText className='w-4 h-4 text-primary' />
            <h3 className='text-sm font-semibold text-foreground'>الفاتورة داخل الزيارة</h3>
          </div>

          {invoice ? (
            <Badge variant={statusVariant(invoice.status)}>{statusLabel(invoice.status)}</Badge>
          ) : (
            <Badge variant='outline'>لا توجد فاتورة</Badge>
          )}
        </div>

        {invoice ? (
          <div className='relative grid grid-cols-1 sm:grid-cols-3 gap-2'>
            <div className='rounded-2xl border border-border/60 bg-background/85 p-3'>
              <p className='text-[11px] text-muted-foreground'>الإجمالي</p>
              <p className='text-base font-black text-foreground'>{formatMoney(invoice.amount)}</p>
            </div>

            <div className='rounded-2xl border border-border/60 bg-background/85 p-3'>
              <p className='text-[11px] text-muted-foreground'>المدفوع</p>
              <p className='text-base font-black text-emerald-700'>{formatMoney(invoice.paidAmount)}</p>
            </div>

            <div className='rounded-2xl border border-border/60 bg-background/85 p-3'>
              <p className='text-[11px] text-muted-foreground'>المتبقي</p>
              <p className='text-base font-black text-amber-700'>
                {formatMoney(invoice.remainingAmount)}
              </p>
            </div>
          </div>
        ) : (
          <div className='relative rounded-2xl border border-dashed border-border/70 bg-background/70 p-3 text-sm text-muted-foreground'>
            لا توجد فاتورة مرتبطة بهذه الزيارة حالياً.
          </div>
        )}

        <div className='relative rounded-xl border border-amber-300/60 bg-amber-100/70 px-3 py-2 text-xs text-amber-900'>
          بعد إنهاء الزيارة، يمكن لسكرتارية الاستقبال تحصيل المبلغ المتبقي من نفس الفاتورة.
        </div>
      </Card>

      {invoice && (
        <Card className='rounded-3xl border border-border/60 p-4 space-y-4'>
          <div className='space-y-2'>
            <h4 className='text-sm font-semibold'>بنود الفاتورة الحالية</h4>

            {invoice.lineItems.length === 0 ? (
              <div className='rounded-2xl border border-dashed border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground'>
                لا توجد بنود مضافة حتى الآن.
              </div>
            ) : (
              <div className='space-y-2'>
                {invoice.lineItems.map((line) => (
                  <div
                    key={line.id}
                    className='rounded-2xl border border-border/60 bg-background p-3 flex flex-wrap items-center justify-between gap-2'
                  >
                    <div className='space-y-0.5'>
                      <p className='text-sm font-semibold'>{line.itemName}</p>
                      <p className='text-[11px] text-muted-foreground'>
                        {line.quantity} × {formatMoney(line.unitPrice)}
                      </p>
                    </div>
                    <p className='text-sm font-black text-primary'>{formatMoney(line.totalPrice)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                type='button'
                size='sm'
                variant={mode === 'service' ? 'default' : 'outline'}
                onClick={() => setMode('service')}
                disabled={isClosed}
              >
                خدمة من قائمة العيادة
              </Button>
              <Button
                type='button'
                size='sm'
                variant={mode === 'item' ? 'default' : 'outline'}
                onClick={() => setMode('item')}
                disabled={isClosed}
              >
                بند/عنصر يدوي
              </Button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
              {mode === 'service' ? (
                <div className='space-y-1.5 md:col-span-2'>
                  <Label>الخدمة</Label>
                  <Select
                    value={selectedServiceId || 'none'}
                    onValueChange={(value) => setSelectedServiceId(value === 'none' ? '' : value)}
                    disabled={isClosed || servicesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='اختر خدمة' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>اختر...</SelectItem>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {formatMoney(service.defaultPrice)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className='space-y-1.5 md:col-span-2'>
                  <Label>اسم البند/العنصر</Label>
                  <Input
                    value={itemName}
                    onChange={(event) => setItemName(event.target.value)}
                    placeholder='مثال: مستهلكات إضافية / أدوات طبية'
                    disabled={isClosed}
                  />
                </div>
              )}

              <div className='space-y-1.5'>
                <Label>الكمية</Label>
                <Input
                  type='number'
                  min='1'
                  step='1'
                  value={quantityInput}
                  onChange={(event) => setQuantityInput(event.target.value)}
                  disabled={isClosed}
                />
              </div>

              <div className='space-y-1.5'>
                <Label>سعر الوحدة</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={unitPriceInput}
                  onChange={(event) => setUnitPriceInput(event.target.value)}
                  disabled={isClosed}
                />
              </div>

              <div className='space-y-1.5 md:col-span-2 lg:col-span-4'>
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  value={lineNotes}
                  onChange={(event) => setLineNotes(event.target.value)}
                  placeholder='ملاحظة داخلية للبند'
                  rows={2}
                  disabled={isClosed}
                />
              </div>
            </div>

            <div className='flex items-center justify-between gap-3'>
              <div className='text-xs text-muted-foreground flex items-center gap-1.5'>
                <Banknote className='w-3.5 h-3.5' />
                تحديث الفاتورة يتم مباشرة بعد الإضافة.
              </div>

              <Button
                type='button'
                onClick={handleAddLineItem}
                disabled={isClosed || isSubmitting || !invoice.id}
                className='gap-2'
              >
                {isSubmitting ? <Loader2 className='h-4 w-4 animate-spin' /> : <PackagePlus className='h-4 w-4' />}
                إضافة إلى الفاتورة
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
